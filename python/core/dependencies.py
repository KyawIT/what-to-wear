"""Dependency providers for FastAPI routers."""
from __future__ import annotations

from dataclasses import dataclass

from fastapi import Depends, HTTPException, Request

from core.config import Settings
from core.repositories import WearableRepository
from core.service import AIOutfitService, OutfitCombiner, OutfitGenerator
from core.utils import ImageEmbedder


@dataclass
class ServiceContainer:
    """Holds long-lived service objects initialized at startup."""

    settings: Settings
    embedder: ImageEmbedder
    repository: WearableRepository
    ai_outfit_service: AIOutfitService
    outfit_generator: OutfitGenerator
    outfit_combiner: OutfitCombiner


def get_services(request: Request) -> ServiceContainer:
    """Return initialized application services from app state."""
    services = getattr(request.app.state, "services", None)
    if services is None:
        raise HTTPException(status_code=503, detail="Service not initialized")
    return services


def get_settings(services: ServiceContainer = Depends(get_services)) -> Settings:
    """Return runtime settings."""
    return services.settings


def get_embedder(services: ServiceContainer = Depends(get_services)) -> ImageEmbedder:
    """Return shared image embedder."""
    return services.embedder


def get_repository(services: ServiceContainer = Depends(get_services)) -> WearableRepository:
    """Return shared wearable repository."""
    return services.repository


def get_ai_outfit_service(services: ServiceContainer = Depends(get_services)) -> AIOutfitService:
    """Return shared AI outfit service."""
    return services.ai_outfit_service


def get_outfit_generator(services: ServiceContainer = Depends(get_services)) -> OutfitGenerator:
    """Return shared outfit generator."""
    return services.outfit_generator


def get_outfit_combiner(services: ServiceContainer = Depends(get_services)) -> OutfitCombiner:
    """Return shared outfit combiner."""
    return services.outfit_combiner
