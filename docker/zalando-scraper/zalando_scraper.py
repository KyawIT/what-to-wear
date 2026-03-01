#!/usr/bin/env python3
"""Zalando product scraper.

Workflow:
1) Accept a Zalando product URL from user input.
2) Extract the product id (SKU) from the URL.
3) Fetch Zalando GraphQL JSON payload for the product.
4) Normalize the product metadata.
5) Return JSON fields (name, description, post_name).
"""

from __future__ import annotations

import argparse
import json
import logging
import os
import random
import re
import sys
import threading
import time
from dataclasses import dataclass
from typing import Any
from urllib.parse import urlparse

from curl_cffi import requests
from stem import Signal
from stem.control import Controller

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Browser impersonation profiles (rotate to avoid fingerprint detection)
# ---------------------------------------------------------------------------

_IMPERSONATE_PROFILES = [
    "chrome",
    "chrome110",
    "chrome116",
    "chrome119",
    "chrome120",
    "chrome123",
    "chrome124",
    "edge99",
    "edge101",
    "safari15_3",
    "safari15_5",
    "safari17_0",
    "safari17_2_1",
]

# ---------------------------------------------------------------------------
# Session manager (module-level singleton, thread-safe)
# ---------------------------------------------------------------------------

_SESSION_MAX_AGE = 300  # seconds (5 minutes)

_session_lock = threading.Lock()
_session: requests.Session | None = None
_session_created_at: float = 0.0


def _get_session() -> requests.Session:
    """Return a shared curl_cffi session, auto-refreshing after _SESSION_MAX_AGE with a random profile."""
    global _session, _session_created_at
    with _session_lock:
        now = time.monotonic()
        if _session is None or (now - _session_created_at) >= _SESSION_MAX_AGE:
            profile = random.choice(_IMPERSONATE_PROFILES)
            _session = requests.Session(impersonate=profile)
            _session_created_at = now
        return _session


def _invalidate_session() -> None:
    """Force session recreation on next call."""
    global _session
    with _session_lock:
        _session = None


# ---------------------------------------------------------------------------
# Tor proxy helpers
# ---------------------------------------------------------------------------


def _get_proxies() -> dict[str, str] | None:
    """Return proxy dict from PROXY_URL env var, or None if unset."""
    proxy_url = os.environ.get("PROXY_URL")
    if not proxy_url:
        return None
    return {"http": proxy_url, "https": proxy_url}


def _renew_tor_circuit() -> None:
    """Send NEWNYM signal to Tor control port for a fresh exit IP."""
    host = os.environ.get("TOR_CONTROL_HOST", "127.0.0.1")
    port = int(os.environ.get("TOR_CONTROL_PORT", "9051"))
    password = os.environ.get("TOR_CONTROL_PASSWORD", "")
    try:
        with Controller.from_port(address=host, port=port) as controller:
            controller.authenticate(password=password)
            controller.signal(Signal.NEWNYM)
            logger.info("Tor circuit renewed (NEWNYM sent)")
    except Exception as exc:
        logger.warning("Failed to renew Tor circuit: %s", exc)


# ---------------------------------------------------------------------------
# Rate limiter (module-level, thread-safe)
# ---------------------------------------------------------------------------

_RATE_LIMIT_INTERVAL = 0.6  # minimum seconds between requests

_rate_lock = threading.Lock()
_last_request_time: float = 0.0


def _rate_limit_wait() -> None:
    """Block until at least _RATE_LIMIT_INTERVAL has elapsed since the last request."""
    global _last_request_time
    with _rate_lock:
        now = time.monotonic()
        elapsed = now - _last_request_time
        if elapsed < _RATE_LIMIT_INTERVAL:
            time.sleep(_RATE_LIMIT_INTERVAL - elapsed)
        _last_request_time = time.monotonic()


# ---------------------------------------------------------------------------
# In-memory TTL cache (module-level, thread-safe)
# ---------------------------------------------------------------------------

_CACHE_TTL = 3600  # 1 hour

_cache_lock = threading.Lock()
_cache: dict[str, tuple["ProductInfo", float]] = {}
_cache_hits = 0
_cache_misses = 0


def _cache_get(product_id: str) -> "ProductInfo" | None:
    global _cache_hits, _cache_misses
    with _cache_lock:
        entry = _cache.get(product_id)
        if entry is not None:
            product, ts = entry
            if (time.monotonic() - ts) < _CACHE_TTL:
                _cache_hits += 1
                return product
            del _cache[product_id]
        _cache_misses += 1
        return None


def _cache_set(product_id: str, product: "ProductInfo") -> None:
    with _cache_lock:
        _cache[product_id] = (product, time.monotonic())


def get_cache_stats() -> dict[str, int]:
    """Return cache statistics (exported for health endpoint)."""
    with _cache_lock:
        return {"size": len(_cache), "hits": _cache_hits, "misses": _cache_misses}


# ---------------------------------------------------------------------------
# Data model
# ---------------------------------------------------------------------------


@dataclass
class ProductInfo:
    product_id: str
    url: str
    name: str
    description: str
    post_name: str
    image_url: str
    brand: str
    category: str
    color: str
    price: str


# ---------------------------------------------------------------------------
# Payload parsing
# ---------------------------------------------------------------------------

_ZALANDO_PRODUCT_QUERY_ID = "c8c938dbcd7f75e2872b23cfbc4f1d5c039c6d70dab7fe0551e9bb094ed82737"


def extract_product_id(url: str) -> str:
    """Extract Zalando SKU from a product URL and normalize it to uppercase."""
    parsed = urlparse(url)
    path = parsed.path or ""

    match = re.search(r"([a-zA-Z0-9]{9,12}-[a-zA-Z0-9]{3})(?:\.html|/|$)", path)
    if not match:
        # Fallback for non-canonical input variants.
        match = re.search(r"([a-zA-Z0-9]{9,12}-[a-zA-Z0-9]{3})", url)

    if not match:
        raise ValueError(f"Could not extract product id from URL: {url}")

    return match.group(1).upper()


def _pick_string(*values: Any) -> str:
    for value in values:
        if isinstance(value, str):
            text = value.strip()
            if text:
                return text
    return ""


def _build_description(brand: str, category: str, color: str, price: str) -> str:
    parts: list[str] = []

    head = _pick_string(
        f"{brand} {category}".strip() if brand or category else "",
        brand,
        category,
    )
    if head:
        parts.append(head)

    if color:
        parts.append(f"Color: {color}")

    if price:
        parts.append(f"Price: {price}")

    return " | ".join(parts)


def _build_graphql_headers(url: str) -> tuple[str, dict[str, str]]:
    parsed = urlparse(url)
    if not parsed.scheme or not parsed.netloc:
        raise ValueError(f"Invalid URL: {url}")

    request_uri = parsed.path or "/"
    if parsed.query:
        request_uri = f"{request_uri}?{parsed.query}"

    endpoint = f"{parsed.scheme}://{parsed.netloc}/api/graphql/"

    headers = {
        "content-type": "application/json",
        "accept": "application/json, text/plain, */*",
        "origin": f"{parsed.scheme}://{parsed.netloc}",
        "referer": url,
        "x-zalando-feature": "product-view",
        "x-zalando-request-uri": request_uri,
        "x-zalando-intent-context": "navigationTargetGroup=ALL",
        "x-device-type": "desktop",
    }

    return endpoint, headers


def _extract_graphql_error(payload: dict[str, Any]) -> str:
    errors = payload.get("errors")
    if not isinstance(errors, list) or not errors:
        return "Unknown GraphQL error"

    first = errors[0]
    if isinstance(first, dict):
        message = first.get("message")
        if isinstance(message, str) and message.strip():
            return message.strip()

    return "Unknown GraphQL error"


def _fetch_product_payload(product_id: str, url: str) -> dict[str, Any]:
    endpoint, headers = _build_graphql_headers(url)
    request_body = [{"id": _ZALANDO_PRODUCT_QUERY_ID, "variables": {"id": product_id}}]
    proxies = _get_proxies()

    _rate_limit_wait()
    session = _get_session()

    response = session.post(endpoint, headers=headers, json=request_body, timeout=45, proxies=proxies)

    if response.status_code in (403, 429):
        _renew_tor_circuit()
        raise RuntimeError(f"Zalando GraphQL request failed with status {response.status_code}")

    if response.status_code != 200:
        raise RuntimeError(f"Zalando GraphQL request failed with status {response.status_code}")

    try:
        payload = response.json()
    except (TypeError, ValueError) as exc:
        raise RuntimeError(f"Invalid JSON response from Zalando GraphQL: {exc}") from exc

    if not isinstance(payload, list) or not payload:
        raise RuntimeError("Unexpected GraphQL response shape from Zalando")

    first = payload[0]
    if not isinstance(first, dict):
        raise RuntimeError("Unexpected GraphQL response item from Zalando")

    data = first.get("data")
    if not isinstance(data, dict):
        raise RuntimeError(_extract_graphql_error(first))

    product = data.get("product")
    if not isinstance(product, dict):
        raise RuntimeError(_extract_graphql_error(first))

    return product


def _find_product_json_ld(data: Any) -> dict[str, Any] | None:
    if isinstance(data, dict):
        item_type = data.get("@type")
        if isinstance(item_type, str) and item_type.lower() == "product":
            return data
        graph = data.get("@graph")
        if graph is not None:
            return _find_product_json_ld(graph)

    if isinstance(data, list):
        for item in data:
            product = _find_product_json_ld(item)
            if product is not None:
                return product

    return None


def _fetch_product_via_json_ld(url: str, product_id: str) -> dict[str, Any] | None:
    """Fallback parser for environments where GraphQL cannot be used."""
    proxies = _get_proxies()
    _rate_limit_wait()
    session = _get_session()

    response = session.get(url, timeout=45, allow_redirects=True, proxies=proxies)
    if response.status_code != 200:
        return None

    html = response.text
    scripts = re.findall(
        r'<script[^>]*type="application/ld\+json"[^>]*>(.*?)</script>',
        html,
        re.IGNORECASE | re.DOTALL,
    )

    for script in scripts:
        text = script.strip()
        if not text:
            continue

        try:
            data = json.loads(text)
        except json.JSONDecodeError:
            continue

        product = _find_product_json_ld(data)
        if not isinstance(product, dict):
            continue

        sku = _pick_string(product.get("sku"))
        if sku and sku.upper() != product_id:
            continue

        return product

    return None


def _normalize_from_graphql(product: dict[str, Any], product_id: str, url: str) -> ProductInfo:
    brand_data = product.get("brand") if isinstance(product.get("brand"), dict) else {}
    color_data = product.get("color") if isinstance(product.get("color"), dict) else {}
    display_price = (
        product.get("displayPrice") if isinstance(product.get("displayPrice"), dict) else {}
    )
    original = display_price.get("original") if isinstance(display_price.get("original"), dict) else {}
    promotional = (
        display_price.get("promotional") if isinstance(display_price.get("promotional"), dict) else {}
    )
    primary_image = (
        product.get("primaryImage") if isinstance(product.get("primaryImage"), dict) else {}
    )

    brand = _pick_string(brand_data.get("name"))
    category = _pick_string(product.get("category"))
    color = _pick_string(color_data.get("label"), color_data.get("name"))
    price = _pick_string(promotional.get("formatted"), original.get("formatted"))

    post_name = _pick_string(product.get("name"), category, product_id)
    name = _pick_string(brand, post_name)
    description = _build_description(brand=brand, category=category, color=color, price=price)

    return ProductInfo(
        product_id=product_id,
        url=url,
        name=name,
        description=description,
        post_name=post_name,
        image_url=_pick_string(primary_image.get("uri")),
        brand=brand,
        category=category,
        color=color,
        price=price,
    )


def _normalize_from_json_ld(product: dict[str, Any], product_id: str, url: str) -> ProductInfo:
    brand_data = product.get("brand") if isinstance(product.get("brand"), dict) else {}

    brand = _pick_string(brand_data.get("name"), brand_data.get("brand"))
    category = _pick_string(product.get("category"))
    color = _pick_string(product.get("color"))

    offers = product.get("offers") if isinstance(product.get("offers"), dict) else {}
    price = _pick_string(offers.get("price"))

    name = _pick_string(brand, product.get("name"), product_id)
    post_name = _pick_string(product.get("name"), category, product_id)
    description = _pick_string(
        product.get("description"),
        _build_description(brand=brand, category=category, color=color, price=price),
    )

    image = product.get("image")
    image_url = ""
    if isinstance(image, str):
        image_url = image.strip()
    elif isinstance(image, list):
        image_url = _pick_string(*(img for img in image if isinstance(img, str)))

    return ProductInfo(
        product_id=product_id,
        url=url,
        name=name,
        description=description,
        post_name=post_name,
        image_url=image_url,
        brand=brand,
        category=category,
        color=color,
        price=price,
    )


# ---------------------------------------------------------------------------
# Retry settings
# ---------------------------------------------------------------------------

_MAX_RETRIES = 5
_BACKOFF_BASE = 2  # seconds: 2, 4, 8, 16, 32
_BACKOFF_JITTER = 2.0  # random jitter added to backoff


def fetch_product_info(url: str) -> ProductInfo:
    """Fetch product data from Zalando JSON payloads.

    Uses session reuse, rate limiting, caching, and retries with exponential backoff.
    """
    product_id = extract_product_id(url)

    cached = _cache_get(product_id)
    if cached is not None:
        return cached

    last_exc: Exception | None = None

    for attempt in range(_MAX_RETRIES):
        if attempt > 0:
            backoff = _BACKOFF_BASE ** attempt + random.uniform(0, _BACKOFF_JITTER)
            time.sleep(backoff)
            _invalidate_session()

        try:
            payload = _fetch_product_payload(product_id=product_id, url=url)
            result = _normalize_from_graphql(payload, product_id=product_id, url=url)
            _cache_set(product_id, result)
            return result
        except (requests.errors.RequestsError, OSError, RuntimeError) as exc:
            last_exc = exc
            continue

    # Fallback: parse Product JSON-LD from HTML if available.
    try:
        json_ld_product = _fetch_product_via_json_ld(url=url, product_id=product_id)
        if isinstance(json_ld_product, dict):
            result = _normalize_from_json_ld(json_ld_product, product_id=product_id, url=url)
            _cache_set(product_id, result)
            return result
    except (requests.errors.RequestsError, OSError, RuntimeError):
        pass

    raise RuntimeError(f"Failed after {_MAX_RETRIES} retries: {last_exc}")


def main() -> int:
    parser = argparse.ArgumentParser(
        description=(
            "Scrape Zalando product metadata (name, description, post_name) from a product URL."
        )
    )
    parser.add_argument(
        "url",
        help="Example: https://www.zalando.at/cecil-langarmshirt-schwarz-ce321d2s1-q11.html",
    )
    args = parser.parse_args()

    try:
        product = fetch_product_info(args.url)
    except (requests.errors.RequestsError, TimeoutError) as exc:
        print(f"Request failed: {exc}", file=sys.stderr)
        return 1
    except (RuntimeError, ValueError) as exc:
        print(str(exc), file=sys.stderr)
        return 1

    print(
        json.dumps(
            {
                "product_id": product.product_id,
                "url": product.url,
                "name": product.name,
                "description": product.description,
                "post_name": product.post_name,
                "image_url": product.image_url,
                "brand": product.brand,
                "category": product.category,
                "color": product.color,
                "price": product.price,
            },
            ensure_ascii=False,
            indent=2,
        )
    )

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
