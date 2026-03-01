FROM python:3.12-slim

WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends curl && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

RUN useradd --create-home --shell /bin/bash scraper
COPY hm_scraper.py app.py ./
RUN chown -R scraper:scraper /app

USER scraper

EXPOSE 4523

CMD ["gunicorn", "--bind", "0.0.0.0:4523", "--workers", "2", "--timeout", "120", "--graceful-timeout", "10", "--access-logfile", "-", "app:app"]
