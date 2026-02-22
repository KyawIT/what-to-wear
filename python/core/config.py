"""Runtime configuration for the core API service."""
from __future__ import annotations

from dataclasses import dataclass
import os


@dataclass(frozen=True)
class Settings:
    """Application settings loaded from environment variables."""

    app_name: str = "Wearable Classification API"
    app_version: str = "1.0.0"
    app_env: str = "development"
    cors_allow_origins: str = "*"

    qdrant_host: str = "wtw-qdrant"
    qdrant_port: int = 6333
    qdrant_collection: str = "wearables"

    model_name: str = "clip-ViT-B-32"
    outfit_text_model_name: str = "all-MiniLM-L6-v2"
    ai_max_suggestions: int = 6

    @classmethod
    def from_env(cls) -> "Settings":
        """Load settings from process environment."""
        return cls(
            app_name=os.getenv("APP_NAME", cls.app_name),
            app_version=os.getenv("APP_VERSION", cls.app_version),
            app_env=os.getenv("APP_ENV", cls.app_env),
            cors_allow_origins=os.getenv("CORS_ALLOW_ORIGINS", cls.cors_allow_origins),
            qdrant_host=os.getenv("QDRANT_HOST", cls.qdrant_host),
            qdrant_port=int(os.getenv("QDRANT_PORT", str(cls.qdrant_port))),
            qdrant_collection=os.getenv("QDRANT_COLLECTION", cls.qdrant_collection),
            model_name=os.getenv("MODEL_NAME", cls.model_name),
            outfit_text_model_name=os.getenv("OUTFIT_TEXT_MODEL_NAME", cls.outfit_text_model_name),
            ai_max_suggestions=int(os.getenv("AI_MAX_SUGGESTIONS", str(cls.ai_max_suggestions))),
        )

    def cors_origins(self) -> list[str]:
        """Return CORS origins parsed from comma-separated env input."""
        raw = self.cors_allow_origins.strip()
        if raw == "*":
            return ["*"]
        return [origin.strip() for origin in raw.split(",") if origin.strip()]
