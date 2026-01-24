"""Wearable data model."""
from dataclasses import dataclass
from typing import List, Optional


@dataclass
class Wearable:
    """Represents a wearable item with embeddings and metadata."""

    id: str  # Image filename
    embedding: List[float]
    category: str
    tags: List[str]
    image_path: Optional[str] = None

    def to_dict(self):
        """Convert to dictionary for Qdrant payload.

        image_path is optional and will be omitted if not provided.
        """
        payload = {
            "id": self.id,
            "category": self.category,
            "tags": self.tags,
        }
        if self.image_path:
            payload["image_path"] = self.image_path
        return payload
