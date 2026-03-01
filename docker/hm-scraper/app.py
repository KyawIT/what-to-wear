#!/usr/bin/env python3
"""H&M product scraper REST API."""

from __future__ import annotations

import logging
import os

from flask import Flask, jsonify, request

logging.basicConfig(
    level=getattr(logging, os.environ.get("LOG_LEVEL", "INFO").upper(), logging.INFO),
    format="%(asctime)s %(levelname)s %(name)s: %(message)s",
)

from hm_scraper import ProductInfo, extract_article_code, fetch_product_via_search, get_cache_stats

app = Flask(__name__)


def product_to_dict(p: ProductInfo) -> dict:
    return {
        "name": p.name,
        "article_code": p.article_code,
        "price": p.price,
        "colors": p.colors,
        "sizes": p.sizes,
        "images": p.images,
    }


@app.route("/scrape", methods=["GET"])
def scrape():
    url = request.args.get("url", "").strip()
    if not url:
        return jsonify({"error": "Missing 'url' query parameter"}), 400

    locale = request.args.get("locale", "de_at").strip()

    try:
        article_code = extract_article_code(url)
        product = fetch_product_via_search(article_code, locale=locale)
    except (ValueError, RuntimeError) as exc:
        return jsonify({"error": str(exc)}), 422
    except Exception as exc:
        return jsonify({"error": f"Request failed: {exc}"}), 502

    return jsonify(product_to_dict(product))


@app.route("/health", methods=["GET"])
def health():
    return jsonify({"status": "ok", "cache": get_cache_stats()})


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=4523)
