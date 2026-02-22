"""Health check endpoints."""
from __future__ import annotations

import logging

from fastapi import APIRouter, Depends, HTTPException

from core.config import Settings
from core.dependencies import get_repository, get_settings
from core.repositories import WearableRepository

logger = logging.getLogger(__name__)
router = APIRouter()


@router.get("/")
async def root(settings: Settings = Depends(get_settings)) -> dict:
    """Return basic service information."""
    return {
        "status": "ok",
        "service": settings.app_name,
        "version": settings.app_version,
        "environment": settings.app_env,
    }


@router.get("/health")
async def health_check(
    settings: Settings = Depends(get_settings),
    repository: WearableRepository = Depends(get_repository),
) -> dict:
    """Return application health and Qdrant connectivity status."""
    try:
        info = repository.get_collection_info()
        return {
            "status": "healthy",
            "qdrant": {
                "connected": True,
                "collection": settings.qdrant_collection,
                "vectors_count": info.points_count,
            },
            "model": {
                "loaded": True,
                "name": settings.model_name,
                "dimension": repository.embedding_dim,
            },
        }
    except Exception as exc:
        logger.exception("Health check failed")
        raise HTTPException(status_code=503, detail=f"Service unhealthy: {exc}") from exc
