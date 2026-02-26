# Pinterest Pin Scraper

Simple Python scraper that:
1. Takes a Pinterest pin URL as input.
2. Extracts the pin id from the URL.
3. Fetches the pin page HTML.
4. Parses embedded relay JSON payloads.
5. Outputs pin metadata in JSON format.

## Install

```bash
pip install -r requirements.txt
```

## Usage (CLI)

```bash
python3 pinterest_scraper.py "https://www.pinterest.com/pin/9710955443162429/"
```

## CLI Output

```json
{
  "pin_id": "9710955443162429",
  "url": "https://www.pinterest.com/pin/9710955443162429/",
  "name": "Gwlly",
  "description": "This Pin was discovered by Gwlly. Discover (and save!) your own Pins on Pinterest",
  "post_name": "Icon Clothes",
  "image_url": "https://i.pinimg.com/originals/27/ec/32/27ec324585af6ad750d040c3c14d68fb.jpg"
}
```

## REST API

```bash
# Start API
python3 app.py

# Scrape pin
curl "http://localhost:4524/scrape?url=https://www.pinterest.com/pin/9710955443162429/"
```

## Notes

- Uses `curl_cffi` with Chrome impersonation to reduce anti-bot failures.
- Reads pin data from `window.__PWS_RELAY_REGISTER_COMPLETED_REQUEST__` payloads embedded in HTML.
- Includes retry, rate limiting, and in-memory TTL cache.
