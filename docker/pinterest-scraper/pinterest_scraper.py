#!/usr/bin/env python3
"""Pinterest pin scraper.

Workflow:
1) Accept a Pinterest pin URL from user input.
2) Extract the pin id from the URL.
3) Fetch the pin page HTML.
4) Parse relay JSON payload embedded in page scripts.
5) Return normalized pin metadata.
"""

from __future__ import annotations

import argparse
import json
import logging
import os
import random
import re
import socket
import sys
import threading
import time
from dataclasses import dataclass
from typing import Any
from urllib.parse import unquote, urlparse, urlunparse

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


def _resolve_host(hostname: str) -> str:
    """Resolve hostname to IP address for stem compatibility."""
    try:
        results = socket.getaddrinfo(hostname, None, socket.AF_INET)
        if results:
            return results[0][4][0]
    except socket.gaierror:
        pass
    return hostname


def _renew_tor_circuit() -> None:
    """Send NEWNYM signal to Tor control port for a fresh exit IP."""
    host = _resolve_host(os.environ.get("TOR_CONTROL_HOST", "127.0.0.1"))
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
_cache: dict[str, tuple["PinInfo", float]] = {}
_cache_hits = 0
_cache_misses = 0


def _cache_get(pin_id: str) -> "PinInfo" | None:
    global _cache_hits, _cache_misses
    with _cache_lock:
        entry = _cache.get(pin_id)
        if entry is not None:
            pin, ts = entry
            if (time.monotonic() - ts) < _CACHE_TTL:
                _cache_hits += 1
                return pin
            del _cache[pin_id]
        _cache_misses += 1
        return None


def _cache_set(pin_id: str, pin: "PinInfo") -> None:
    with _cache_lock:
        _cache[pin_id] = (pin, time.monotonic())


def get_cache_stats() -> dict[str, int]:
    """Return cache statistics (exported for health endpoint)."""
    with _cache_lock:
        return {"size": len(_cache), "hits": _cache_hits, "misses": _cache_misses}


# ---------------------------------------------------------------------------
# Data model
# ---------------------------------------------------------------------------


@dataclass
class PinInfo:
    pin_id: str
    url: str
    name: str
    description: str
    post_name: str
    image_url: str


def _is_short_url(url: str) -> bool:
    """Return True if *url* is a Pinterest shortened link (pin.it)."""
    return bool(re.match(r"https?://(www\.)?pin\.it/", url))


def _resolve_short_url(url: str) -> str:
    """Follow a pin.it redirect and return the canonical Pinterest URL.

    Uses a HEAD request so we only fetch headers, not the full page.
    The resolved URL is cleaned of tracking query parameters.
    """
    proxies = _get_proxies()
    session = _get_session()

    try:
        resp = session.head(url, timeout=30, allow_redirects=True, proxies=proxies)
    except (requests.errors.RequestsError, OSError) as exc:
        raise RuntimeError(f"Failed to resolve short URL {url}: {exc}") from exc

    final_url = str(resp.url)
    logger.info("Resolved short URL %s -> %s", url, final_url)

    # Strip query params (invite_code, sfo, etc.) — only the path matters.

    parsed = urlparse(final_url)
    clean_url = urlunparse((parsed.scheme, parsed.netloc, parsed.path, "", "", ""))
    return clean_url


def extract_pin_id(url: str) -> str:
    """Extract numeric pin id from a Pinterest pin URL."""
    match = re.search(r"pinterest\.com/pin/(\d+)", url)
    if not match:
        # fallback for shortened or redirected variants
        match = re.search(r"/pin/(\d+)", url)
    if not match:
        raise ValueError(f"Could not extract pin id from URL: {url}")
    return match.group(1)


# ---------------------------------------------------------------------------
# Payload parsing
# ---------------------------------------------------------------------------


def _decode_relay_meta(meta_raw: Any) -> dict[str, Any]:
    """Decode metadata argument from relay registration call."""
    if not isinstance(meta_raw, str):
        return {}
    try:
        decoded = unquote(meta_raw)
        parsed = json.loads(decoded)
        return parsed if isinstance(parsed, dict) else {}
    except Exception:
        return {}


def _iter_relay_payloads(html: str) -> list[tuple[dict[str, Any], dict[str, Any]]]:
    """Parse all relay payload registrations from page scripts.

    Pinterest embeds data as:
    window.__PWS_RELAY_REGISTER_COMPLETED_REQUEST__("<encoded-meta>", { ...json... });
    """
    marker = "window.__PWS_RELAY_REGISTER_COMPLETED_REQUEST__("
    decoder = json.JSONDecoder()
    out: list[tuple[dict[str, Any], dict[str, Any]]] = []

    start = 0
    while True:
        idx = html.find(marker, start)
        if idx == -1:
            break

        cursor = idx + len(marker)

        try:
            meta_raw, consumed_meta = decoder.raw_decode(html[cursor:])
        except json.JSONDecodeError:
            start = idx + len(marker)
            continue

        cursor += consumed_meta
        while cursor < len(html) and html[cursor].isspace():
            cursor += 1
        if cursor >= len(html) or html[cursor] != ",":
            start = cursor
            continue

        cursor += 1
        while cursor < len(html) and html[cursor].isspace():
            cursor += 1

        try:
            payload_raw, consumed_payload = decoder.raw_decode(html[cursor:])
        except json.JSONDecodeError:
            start = cursor
            continue

        if isinstance(payload_raw, dict):
            out.append((_decode_relay_meta(meta_raw), payload_raw))

        start = cursor + consumed_payload

    return out


def _iter_dicts(value: Any):
    """Yield all dict nodes from nested JSON-like structures."""
    if isinstance(value, dict):
        yield value
        for item in value.values():
            yield from _iter_dicts(item)
    elif isinstance(value, list):
        for item in value:
            yield from _iter_dicts(item)


def _score_pin_candidate(node: dict[str, Any], pin_id: str) -> int:
    score = 0
    if str(node.get("entityId", "")) == pin_id:
        score += 10
    if any(k in node for k in ("title", "description", "unauthOnPageTitle", "seoTitle")):
        score += 2
    if any(k in node for k in ("images_orig", "imageLargeUrl", "images_736x")):
        score += 1
    return score


def _extract_pin_from_payload(payload: dict[str, Any], pin_id: str) -> dict[str, Any] | None:
    data = payload.get("data")
    if not isinstance(data, dict):
        return None

    # Fast path for current Pinterest structure.
    v3_get_pin_query = data.get("v3GetPinQuery")
    if isinstance(v3_get_pin_query, dict):
        pin = v3_get_pin_query.get("data")
        if isinstance(pin, dict):
            if str(pin.get("entityId", "")) == pin_id:
                return pin

    # Fallback: scan all nested dicts and pick best match.
    best: dict[str, Any] | None = None
    best_score = 0
    for node in _iter_dicts(data):
        score = _score_pin_candidate(node, pin_id)
        if score > best_score:
            best_score = score
            best = node

    return best if best_score >= 10 else None


def _pick_string(*values: Any) -> str:
    for value in values:
        if isinstance(value, str):
            text = value.strip()
            if text:
                return text
    return ""


def _extract_image_url(pin: dict[str, Any]) -> str:
    for key in ("images_orig", "images_736x", "images_564x", "images_474x", "images_236x"):
        value = pin.get(key)
        if isinstance(value, dict):
            url = value.get("url")
            if isinstance(url, str) and url.strip():
                return url.strip()

    image_large_url = pin.get("imageLargeUrl")
    if isinstance(image_large_url, str) and image_large_url.strip():
        return image_large_url.strip()

    return ""


def _normalize_pin(pin: dict[str, Any], pin_id: str, url: str) -> PinInfo:
    creator = pin.get("nativeCreator") if isinstance(pin.get("nativeCreator"), dict) else {}
    pinner = pin.get("pinner") if isinstance(pin.get("pinner"), dict) else {}
    attribution = (
        pin.get("closeupUnifiedAttribution")
        if isinstance(pin.get("closeupUnifiedAttribution"), dict)
        else {}
    )

    name = _pick_string(
        creator.get("fullName") if isinstance(creator, dict) else None,
        pinner.get("fullName") if isinstance(pinner, dict) else None,
        attribution.get("fullName") if isinstance(attribution, dict) else None,
        creator.get("username") if isinstance(creator, dict) else None,
        pinner.get("username") if isinstance(pinner, dict) else None,
    )

    description = _pick_string(
        pin.get("description"),
        pin.get("closeupUnifiedDescription"),
        pin.get("seoDescription"),
    )

    post_name = _pick_string(
        pin.get("title"),
        pin.get("unauthOnPageTitle"),
        pin.get("gridTitle"),
        pin.get("seoTitle"),
    )

    image_url = _extract_image_url(pin)

    return PinInfo(
        pin_id=pin_id,
        url=url,
        name=name,
        description=description,
        post_name=post_name,
        image_url=image_url,
    )


def _pin_output_quality(pin: dict[str, Any]) -> int:
    """Score pin payload quality for output fields."""
    score = 0

    if _pick_string(pin.get("title")):
        score += 6
    if _pick_string(pin.get("unauthOnPageTitle")):
        score += 5
    if _pick_string(pin.get("gridTitle")):
        score += 4
    if _pick_string(pin.get("seoTitle")):
        score += 2

    if _pick_string(pin.get("description"), pin.get("closeupUnifiedDescription"), pin.get("seoDescription")):
        score += 3

    if _extract_image_url(pin):
        score += 2

    creator = pin.get("nativeCreator") if isinstance(pin.get("nativeCreator"), dict) else {}
    pinner = pin.get("pinner") if isinstance(pin.get("pinner"), dict) else {}
    attribution = pin.get("closeupUnifiedAttribution") if isinstance(pin.get("closeupUnifiedAttribution"), dict) else {}
    if _pick_string(
        creator.get("fullName") if isinstance(creator, dict) else None,
        pinner.get("fullName") if isinstance(pinner, dict) else None,
        attribution.get("fullName") if isinstance(attribution, dict) else None,
        creator.get("username") if isinstance(creator, dict) else None,
        pinner.get("username") if isinstance(pinner, dict) else None,
    ):
        score += 2

    return score


# ---------------------------------------------------------------------------
# Retry settings
# ---------------------------------------------------------------------------

_MAX_RETRIES = 5
_BACKOFF_BASE = 2  # seconds: 2, 4, 8, 16, 32
_BACKOFF_JITTER = 2.0  # random jitter added to backoff


def fetch_pin_info(url: str) -> PinInfo:
    """Fetch pin data from Pinterest page relay payloads.

    Uses session reuse, rate limiting, caching, and retries with exponential backoff.
    Supports short pin.it URLs by resolving them first.
    """
    # Resolve pin.it short URLs to canonical pinterest.com URLs.
    if _is_short_url(url):
        url = _resolve_short_url(url)
        logger.info("Using resolved URL: %s", url)

    pin_id = extract_pin_id(url)

    cached = _cache_get(pin_id)
    if cached is not None:
        return cached

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
            resp = session.get(url, timeout=45, allow_redirects=True, proxies=proxies)
        except (requests.errors.RequestsError, OSError) as exc:
            last_exc = exc
            continue

        if resp.status_code in (403, 429):
            last_exc = RuntimeError(f"Pin request failed with status {resp.status_code}")
            _renew_tor_circuit()
            continue

        if resp.status_code != 200:
            raise RuntimeError(f"Pin request failed with status {resp.status_code}")

        html = resp.text
        payloads = _iter_relay_payloads(html)
        if not payloads:
            raise RuntimeError("Could not find relay payloads in Pinterest page.")

        pin_data: dict[str, Any] | None = None
        best_score = -1

        # Prefer payloads matching this pin id in relay metadata variables,
        # but still rank candidates by output quality.
        for meta, payload in payloads:
            variables = meta.get("variables") if isinstance(meta, dict) else None
            meta_pin_id = None
            if isinstance(variables, dict):
                meta_pin_id = str(variables.get("pinId", "")).strip()

            if meta_pin_id != pin_id:
                continue

            candidate = _extract_pin_from_payload(payload, pin_id)
            if candidate is None:
                continue

            candidate_score = _pin_output_quality(candidate)
            if candidate_score > best_score:
                best_score = candidate_score
                pin_data = candidate

        if pin_data is None:
            # Fallback: scan all payloads without pin-id metadata match.
            for _, payload in payloads:
                candidate = _extract_pin_from_payload(payload, pin_id)
                if candidate is None:
                    continue
                candidate_score = _pin_output_quality(candidate)
                if candidate_score > best_score:
                    best_score = candidate_score
                    pin_data = candidate

        if pin_data is None:
            raise RuntimeError(f"Could not locate pin data for pin id {pin_id}")

        result = _normalize_pin(pin_data, pin_id=pin_id, url=url)
        _cache_set(pin_id, result)
        return result

    raise RuntimeError(f"Failed after {_MAX_RETRIES} retries: {last_exc}")


def main() -> int:
    parser = argparse.ArgumentParser(
        description="Scrape Pinterest pin metadata (name, description, post name) from a pin URL."
    )
    parser.add_argument("url", help="Example: https://www.pinterest.com/pin/9710955443162429/")
    args = parser.parse_args()

    try:
        pin = fetch_pin_info(args.url)
    except (requests.errors.RequestsError, TimeoutError) as exc:
        print(f"Request failed: {exc}", file=sys.stderr)
        return 1
    except (RuntimeError, ValueError) as exc:
        print(str(exc), file=sys.stderr)
        return 1

    print(
        json.dumps(
            {
                "pin_id": pin.pin_id,
                "url": pin.url,
                "name": pin.name,
                "description": pin.description,
                "post_name": pin.post_name,
                "image_url": pin.image_url,
            },
            ensure_ascii=False,
            indent=2,
        )
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
