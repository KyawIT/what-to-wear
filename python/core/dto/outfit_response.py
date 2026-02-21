"""DTOs for outfit generation API responses."""
from dataclasses import dataclass, field
from typing import List, Optional


@dataclass
class WearableItem:
    """Wearable item in outfit."""
    id: str
    category: str  # Original category (e.g., "dress", "shirt", "jeans")
    tags: Optional[List[str]] = None
    mappedPath: Optional[str] = None  # Hierarchical path (e.g., "BOTTOM", "TOP.SHIRT") - internal use only
    size: float = 1.0  # Size multiplier for visualization (internal only, NOT in JSON output)

    def to_dict(self):
        """Convert to dictionary. Note: 'size' is internal only, not included in API response."""
        return {
            "id": self.id,
            "category": self.category,
            "tags": self.tags or []
        }


@dataclass
class Outfit:
    """Generated outfit."""
    id: str
    wearables: List[WearableItem]
    matchedTags: List[str] = field(default_factory=list)

    def to_dict(self):
        """Convert to dictionary."""
        return {
            "id": self.id,
            "wearables": [w.to_dict() for w in self.wearables]
        }


@dataclass
class GenerateOutfitsSimpleResponse:
    """Response for outfit generation (simple JSON only)."""
    outfits: List[Outfit] = field(default_factory=list)

    def to_dict(self):
        """Convert to dictionary for JSON response."""
        return {
            "outfits": [outfit.to_dict() for outfit in self.outfits]
        }


@dataclass
class GenerateOutfitsResponse:
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
    outfits: List[Outfit] = field(default_factory=list)

    def to_dict(self):
        """Convert to dictionary for JSON response."""
        return {
            "outfits": [outfit.to_dict() for outfit in self.outfits]
        }


@dataclass
class UploadOutfitResponse:
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
    wearables: List[WearableItem] = field(default_factory=list)
    image: Optional[str] = None
    warnings: List[str] = field(default_factory=list)

    def to_dict(self):
        """Convert to dictionary for JSON response."""
        return {
            "id": self.id,
            "wearables": [w.to_dict() for w in self.wearables],
            "image": self.image,
            "warnings": self.warnings
        }


# Legacy alias for backwards compatibility
OutfitResponse = GenerateOutfitsSimpleResponse
