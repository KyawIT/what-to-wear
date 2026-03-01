#!/usr/bin/env python3
"""Simple H&M product scraper.

Workflow:
1) Accept a product URL from user input.
2) Extract the article code from the URL.
3) Use the search endpoint (bypasses Akamai bot protection on product pages).
4) Parse __NEXT_DATA__ JSON from the search results.
5) Output product name and image URLs.

Requires: curl_cffi (pip install curl_cffi)
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
from dataclasses import dataclass, field

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

_RATE_LIMIT_INTERVAL = 1.0  # minimum seconds between requests

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
_cache: dict[tuple[str, str], tuple[ProductInfo, float]] = {}
_cache_hits = 0
_cache_misses = 0


def _cache_get(article_code: str, locale: str) -> ProductInfo | None:
    global _cache_hits, _cache_misses
    key = (article_code, locale)
    with _cache_lock:
        entry = _cache.get(key)
        if entry is not None:
            product, ts = entry
            if (time.monotonic() - ts) < _CACHE_TTL:
                _cache_hits += 1
                return product
            del _cache[key]
        _cache_misses += 1
        return None


def _cache_set(article_code: str, locale: str, product: ProductInfo) -> None:
    key = (article_code, locale)
    with _cache_lock:
        _cache[key] = (product, time.monotonic())


def get_cache_stats() -> dict:
    """Return cache statistics (exported for health endpoint)."""
    with _cache_lock:
        return {"size": len(_cache), "hits": _cache_hits, "misses": _cache_misses}


# ---------------------------------------------------------------------------
# Data model
# ---------------------------------------------------------------------------


@dataclass
class ProductInfo:
    name: str
    images: list[str]
    article_code: str = ""
    price: str = ""
    sizes: list[str] = field(default_factory=list)
    colors: list[str] = field(default_factory=list)


def extract_article_code(url: str) -> str:
    """Extract the article code (e.g. '1315728001') from an H&M product URL."""
    match = re.search(r"(\d{7,10})", url)
    if not match:
        raise ValueError(f"Could not extract article code from URL: {url}")
    return match.group(1)


# ---------------------------------------------------------------------------
# Retry settings
# ---------------------------------------------------------------------------

_MAX_RETRIES = 5
_BACKOFF_BASE = 2  # seconds: 2, 4, 8, 16, 32
_BACKOFF_JITTER = 2.0  # random jitter added to backoff


def fetch_product_via_search(article_code: str, locale: str = "de_at") -> ProductInfo:
    """Fetch product data via the search results page which returns __NEXT_DATA__.

    Uses session reuse, rate limiting, caching, and retries with exponential backoff.
    """
    # Check cache first
    cached = _cache_get(article_code, locale)
    if cached is not None:
        return cached

    search_url = f"https://www2.hm.com/{locale}/search-results.html?q={article_code}"
    last_exc: Exception | None = None

    proxies = _get_proxies()

    for attempt in range(_MAX_RETRIES):
        if attempt > 0:
            backoff = _BACKOFF_BASE ** attempt + random.uniform(0, _BACKOFF_JITTER)
            time.sleep(backoff)
            _invalidate_session()

        _rate_limit_wait()
        session = _get_session()

        try:
            resp = session.get(search_url, timeout=45, proxies=proxies)
        except (requests.errors.RequestsError, OSError) as exc:
            last_exc = exc
            continue

        if resp.status_code in (403, 429):
            last_exc = RuntimeError(f"Search request failed with status {resp.status_code}")
            _renew_tor_circuit()
            continue

        if resp.status_code != 200:
            raise RuntimeError(f"Search request failed with status {resp.status_code}")

        html = resp.text

        # Extract __NEXT_DATA__ JSON
        match = re.search(
            r'<script\s+id="__NEXT_DATA__"\s+type="application/json">(.*?)</script>',
            html,
            re.DOTALL,
        )
        if not match:
            raise RuntimeError("Could not find __NEXT_DATA__ in search results page.")

        data = json.loads(match.group(1))
        hits = data["props"]["pageProps"]["srpProps"]["hits"]

        if not hits:
            raise RuntimeError(f"No products found for article code {article_code}")

        # Find the exact matching hit
        product = None
        for hit in hits:
            if hit.get("articleCode") == article_code:
                product = hit
                break
        if product is None:
            product = hits[0]

        # Collect all image URLs (gallery first, then product/model fallbacks)
        images: list[str] = []
        seen: set[str] = set()
        for img in product.get("galleryImages", []):
            src = img.get("src", "")
            if src and src not in seen:
                images.append(src)
                seen.add(src)
        for key in ("imageProductSrc", "imageModelSrc"):
            src = product.get(key, "")
            if src and src not in seen:
                images.append(src)
                seen.add(src)

        # Sizes and colors
        sizes = [s["label"] for s in product.get("sizes", []) if "label" in s]
        colors = [s["colorName"] for s in product.get("swatches", []) if "colorName" in s]

        # Price
        price = product.get("regularPrice", "")

        result = ProductInfo(
            name=product.get("title", "Unknown"),
            images=images,
            article_code=product.get("articleCode", article_code),
            price=price,
            sizes=sizes,
            colors=colors,
        )

        _cache_set(article_code, locale, result)
        return result

    # All retries exhausted
    raise RuntimeError(f"Failed after {_MAX_RETRIES} retries: {last_exc}")


def main() -> int:
    parser = argparse.ArgumentParser(
        description="Scrape H&M product name and images from a product URL."
    )
    parser.add_argument(
        "url", help="Example: https://www2.hm.com/de_at/productpage.1315728001.html"
    )
    parser.add_argument(
        "--locale",
        default="de_at",
        help="H&M locale/region (default: de_at)",
    )
    args = parser.parse_args()

    try:
        article_code = extract_article_code(args.url)
        product = fetch_product_via_search(article_code, locale=args.locale)
    except (requests.errors.RequestsError, TimeoutError) as exc:
        print(f"Request failed: {exc}", file=sys.stderr)
        return 1
    except (RuntimeError, ValueError) as exc:
        print(str(exc), file=sys.stderr)
        return 1

    print(f"Product name: {product.name}")
    print(f"Article code: {product.article_code}")
    if product.price:
        print(f"Price: {product.price}")
    if product.colors:
        print(f"Colors: {', '.join(product.colors)}")
    if product.sizes:
        print(f"Sizes: {', '.join(product.sizes)}")
    print("Images:")
    for image_url in product.images:
        print(f"  - {image_url}")

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
