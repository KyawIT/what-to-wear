"""DTO for AI outfit generation API response."""
from typing import List

from pydantic import BaseModel, Field


class AIOutfitResponse(BaseModel):
    """Response for AI outfit generation from image."""

    user_id: str
    item_ids: List[str] = Field(default_factory=list)

    def to_dict(self) -> dict:
        """Convert to dictionary for JSON response."""
        return {"user_id": self.user_id, "item_ids": self.item_ids}
