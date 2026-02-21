"""DTO for AI outfit generation API response."""
from dataclasses import dataclass, field
from typing import List


@dataclass
class AIOutfitResponse:
    """Response for AI outfit generation from image."""
    user_id: str
    item_ids: List[str] = field(default_factory=list)  # IDs of suggested wearables from the image

    def to_dict(self):
        """Convert to dictionary for JSON response."""
        return {
            "user_id": self.user_id,
            "item_ids": self.item_ids
        }
