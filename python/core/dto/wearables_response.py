"""DTOs for wearables API responses."""
from typing import List

from pydantic import BaseModel


class PredictionResponse(BaseModel):
    """Response for image classification prediction."""
    category: str
    tags: List[str]
    confidence: float

    def to_dict(self) -> dict:
        """Convert to dictionary for JSON response."""
        return {
            "category": self.category,
            "tags": self.tags,
            "confidence": round(self.confidence, 4),
        }


class WearableUploadResponse(BaseModel):
    """Response for wearable image upload."""
    item_id: str
    category: str
    tags: List[str]
    user_id: str

    def to_dict(self) -> dict:
        """Convert to dictionary for JSON response."""
        return {
            "item_id": self.item_id,
            "category": self.category,
            "tags": self.tags,
            "user_id": self.user_id,
        }


class UpdateWearableResponse(BaseModel):
    """Response for updating a wearable item."""
    item_id: str
    user_id: str
    category: str
    tags: List[str]

    def to_dict(self) -> dict:
        """Convert to dictionary for JSON response."""
        return {
            "item_id": self.item_id,
            "user_id": self.user_id,
            "category": self.category,
            "tags": self.tags,
        }


class DeleteWearableResponse(BaseModel):
    """Response for deleting a wearable item."""
    item_id: str
    user_id: str
    deleted: bool = True

    def to_dict(self) -> dict:
        """Convert to dictionary for JSON response."""
        return {
            "item_id": self.item_id,
            "user_id": self.user_id,
            "deleted": self.deleted,
        }
