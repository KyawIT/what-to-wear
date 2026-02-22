"""FastAPI application bootstrap for the core wearable service."""
from __future__ import annotations

from contextlib import asynccontextmanager
import logging

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from core.config import Settings
from core.dependencies import ServiceContainer
from core.logging_config import configure_logging
from core.repositories import WearableRepository
from core.routers import ai_outfit_router, health_router, outfit_router, wearables_router
from core.service import AIOutfitService, OutfitCombiner, OutfitGenerator
from core.utils import ImageEmbedder

configure_logging()
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Initialize and teardown shared services."""
    settings = Settings.from_env()
    logger.info("Initializing application", extra={"env": settings.app_env})

    embedder = ImageEmbedder(model_name=settings.model_name)
    logger.info("Embedding model loaded", extra={"model": settings.model_name, "dim": embedder.embedding_dim})

    repository = WearableRepository(
        collection_name=settings.qdrant_collection,
        host=settings.qdrant_host,
        port=settings.qdrant_port,
        embedding_dim=embedder.embedding_dim,
    )

    ai_outfit_service = AIOutfitService(
        embedder=embedder,
        repository=repository,
        max_suggestions=settings.ai_max_suggestions,
    )

    app.state.services = ServiceContainer(
        settings=settings,
        embedder=embedder,
        repository=repository,
        ai_outfit_service=ai_outfit_service,
        outfit_generator=OutfitGenerator(model_name=settings.outfit_text_model_name),
        outfit_combiner=OutfitCombiner(),
    )

    logger.info(
        "Application ready",
        extra={
            "qdrant_host": settings.qdrant_host,
            "qdrant_port": settings.qdrant_port,
            "qdrant_collection": settings.qdrant_collection,
        },
    )

    try:
        yield
    finally:
        app.state.services = None
        logger.info("Application shutdown complete")


settings = Settings.from_env()
app = FastAPI(
    title=settings.app_name,
    description="API for classifying wearable items by category and tags",
    version=settings.app_version,
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins(),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health_router)
app.include_router(outfit_router)
app.include_router(ai_outfit_router)
app.include_router(wearables_router, prefix="/wearables", tags=["wearables"])


if __name__ == "__main__":
    import uvicorn

    uvicorn.run("core.app:app", host="0.0.0.0", port=8000, reload=False)
