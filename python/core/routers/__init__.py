"""FastAPI routers for API endpoints."""
from .health import router as health_router
from .outfit import router as outfit_router
from .wearables import router as wearables_router
from .ai_outfit import router as ai_outfit_router

__all__ = ["health_router", "outfit_router", "wearables_router", "ai_outfit_router"]
