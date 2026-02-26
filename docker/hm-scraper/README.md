# H&M Product Scraper

Simple Python scraper that:
1. Takes an H&M product URL as input.
2. Extracts the article code from the URL.
3. Queries H&M's search endpoint to get product data (bypasses Akamai bot protection).
4. Parses `__NEXT_DATA__` JSON from the search results page.
5. Prints product name, price, colors, sizes, and image URLs.

## Install

```bash
pip install curl_cffi
```

## Usage

```bash
python3 hm_scraper.py "https://www2.hm.com/de_at/productpage.1315728001.html"
```

## Output

```text
Product name: Hemd in Relaxed Fit
Article code: 1315728001
Price: 29,99 €
Colors: Rosa/Kariert, Blau/Kariert
Sizes: XS, S, XL, XXL, M, L, 3XL
Images:
  - https://image.hm.com/assets/hm/...jpg
  - https://image.hm.com/assets/hm/...jpg
```

## Notes

- Requires `curl_cffi` for Chrome TLS fingerprint impersonation (H&M uses Akamai bot protection).
- Uses the search results endpoint instead of direct product page access, since product pages are blocked by Akamai's JavaScript challenge.
- Data is extracted from the `__NEXT_DATA__` JSON embedded in the search results HTML.
- Default locale is `de_at`. Use `--locale` to change (e.g. `--locale en_us`).
