"""Logging configuration helpers for the core API."""
from __future__ import annotations

import logging
import os


def configure_logging() -> None:
    """Configure process-wide logging with an environment-controlled level."""
    level_name = os.getenv("LOG_LEVEL", "INFO").upper()
    level = getattr(logging, level_name, logging.INFO)

    logging.basicConfig(
        level=level,
        format="%(asctime)s %(levelname)s %(name)s %(message)s",
    )
