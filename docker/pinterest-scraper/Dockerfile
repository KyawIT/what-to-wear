FROM python:3.12-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

RUN useradd --create-home --shell /bin/bash scraper
COPY pinterest_scraper.py app.py ./
RUN chown -R scraper:scraper /app

USER scraper

EXPOSE 4524

CMD ["gunicorn", "--bind", "0.0.0.0:4524", "--workers", "2", "--timeout", "30", "--graceful-timeout", "10", "--access-logfile", "-", "app:app"]
