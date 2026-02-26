# Zalando Product Scraper

Simple Python scraper that:
1. Takes a Zalando product URL as input.
2. Extracts the product id (SKU) from the URL.
3. Fetches Zalando GraphQL JSON payload data.
4. Maps product metadata fields.
5. Outputs JSON.

## Install

```bash
pip install -r requirements.txt
```

## Usage (CLI)

```bash
python3 zalando_scraper.py "https://www.zalando.at/cecil-langarmshirt-schwarz-ce321d2s1-q11.html"
```

## CLI Output

```json
{
  "product_id": "CE321D2S1-Q11",
  "url": "https://www.zalando.at/cecil-langarmshirt-schwarz-ce321d2s1-q11.html",
  "name": "Cecil",
  "description": "Cecil Langarmshirt | Color: schwarz | Price: € 15,00",
  "post_name": "Langarmshirt - schwarz",
  "image_url": "https://img01.ztat.net/article/spp-media-p1/d23a337428a94614aab5c8e585d7e720/7fb567683eea41e0af32750e5efcb101.jpg?imwidth=200&filter=packshot"
}
```

## REST API

```bash
# Start API
python3 app.py

# Scrape product
curl "http://localhost:4525/scrape?url=https://www.zalando.at/cecil-langarmshirt-schwarz-ce321d2s1-q11.html"
```

## Notes

- Uses `curl_cffi` with Chrome impersonation.
- Reads product data from Zalando GraphQL JSON payload.
- Includes retry, rate limiting, and in-memory TTL cache.
