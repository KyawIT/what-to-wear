"""DTOs for outfit generation API responses."""
from typing import List, Optional

from pydantic import BaseModel, ConfigDict, Field


class WearableItem(BaseModel):
    """Wearable item in outfit."""

    model_config = ConfigDict(populate_by_name=True)

    id: str
    category: str
    tags: Optional[List[str]] = None
    mappedPath: Optional[str] = None
    size: float = 1.0

    def to_dict(self) -> dict:
        """Convert to external API dict, excluding internal layout fields."""
        return {
            "id": self.id,
            "category": self.category,
            "tags": self.tags or [],
        }


class Outfit(BaseModel):
    """Generated outfit."""

    id: str
    wearables: List[WearableItem]
    matchedTags: List[str] = Field(default_factory=list)

    def to_dict(self) -> dict:
        """Convert to dictionary."""
        return {
            "id": self.id,
            "wearables": [w.to_dict() for w in self.wearables],
        }


class GenerateOutfitsSimpleResponse(BaseModel):
    """Response for outfit generation (simple JSON only)."""

    outfits: List[Outfit] = Field(default_factory=list)

    def to_dict(self) -> dict:
        """Convert to dictionary for JSON response."""
        return {"outfits": [outfit.to_dict() for outfit in self.outfits]}


class GenerateOutfitsResponse(BaseModel):
    """Response for /outfit/generate_outfits endpoint (multipart with images).
    
    This DTO defines the JSON schema for the outfits data within the multipart response.
    
    NOTE: The endpoint returns multipart/form-data (Response object), so response_model
    is NOT used in the route decorator. However, this DTO correctly documents the 
    structure of the JSON part ("outfits" data) that is included in the multipart body,
    alongside the PNG outfit image files.
    
    Returns:
        Multipart response with:
        - JSON part: {"outfits": [...]} (this DTO's structure)
        - PNG files: outfit_1.png, outfit_2.png, etc.
    """
    outfits: List[Outfit] = Field(default_factory=list)

    def to_dict(self) -> dict:
        """Convert to dictionary for JSON response."""
        return {"outfits": [outfit.to_dict() for outfit in self.outfits]}


class UploadOutfitResponse(BaseModel):
    """Response for /outfit/upload endpoint (combine wearables into outfit).
    
    This DTO defines the JSON schema for the uploaded outfit response within the multipart body.
    
    NOTE: The endpoint returns multipart/form-data (Response object), so response_model
    is NOT used in the route decorator. However, this DTO correctly documents the 
    structure of the JSON part that is included in the multipart response, alongside
    the PNG outfit image file.
    
    Returns:
        Multipart response with:
        - JSON part: This DTO's structure (outfit metadata + wearables + warnings)
        - PNG file: outfit.png (combined outfit image)
    """
    id: str
    wearables: List[WearableItem] = Field(default_factory=list)
    image: Optional[str] = None
    warnings: List[str] = Field(default_factory=list)

    def to_dict(self) -> dict:
        """Convert to dictionary for JSON response."""
        return {
            "id": self.id,
            "wearables": [w.to_dict() for w in self.wearables],
            "image": self.image,
            "warnings": self.warnings,
        }


# Legacy alias for backwards compatibility
OutfitResponse = GenerateOutfitsSimpleResponse
