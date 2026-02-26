#!/usr/bin/env python3
"""Zalando product scraper REST API."""

from __future__ import annotations

from flask import Flask, jsonify, request

from zalando_scraper import ProductInfo, fetch_product_info, get_cache_stats

app = Flask(__name__)


def product_to_dict(product: ProductInfo) -> dict:
    return {
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
    }


@app.route("/scrape", methods=["GET"])
def scrape():
    url = request.args.get("url", "").strip()
    if not url:
        return jsonify({"error": "Missing 'url' query parameter"}), 400

    try:
        product = fetch_product_info(url)
    except (ValueError, RuntimeError) as exc:
        return jsonify({"error": str(exc)}), 422
    except Exception as exc:
        return jsonify({"error": f"Request failed: {exc}"}), 502

    return jsonify(product_to_dict(product))


@app.route("/health", methods=["GET"])
def health():
    return jsonify({"status": "ok", "cache": get_cache_stats()})


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=4525)
