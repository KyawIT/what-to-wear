#!/usr/bin/env python3
"""Pinterest pin scraper REST API."""

from __future__ import annotations

from flask import Flask, jsonify, request

from pinterest_scraper import PinInfo, fetch_pin_info, get_cache_stats

app = Flask(__name__)


def pin_to_dict(pin: PinInfo) -> dict:
    return {
        "pin_id": pin.pin_id,
        "url": pin.url,
        "name": pin.name,
        "description": pin.description,
        "post_name": pin.post_name,
        "image_url": pin.image_url,
    }


@app.route("/scrape", methods=["GET"])
def scrape():
    url = request.args.get("url", "").strip()
    if not url:
        return jsonify({"error": "Missing 'url' query parameter"}), 400

    try:
        pin = fetch_pin_info(url)
    except (ValueError, RuntimeError) as exc:
        return jsonify({"error": str(exc)}), 422
    except Exception as exc:
        return jsonify({"error": f"Request failed: {exc}"}), 502

    return jsonify(pin_to_dict(pin))


@app.route("/health", methods=["GET"])
def health():
    return jsonify({"status": "ok", "cache": get_cache_stats()})


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=4524)
