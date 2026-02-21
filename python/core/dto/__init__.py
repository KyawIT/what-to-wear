"""DTOs package."""
from .wearables_response import (
    PredictionResponse,
    WearableUploadResponse,
    UpdateWearableResponse,
    DeleteWearableResponse
)
from .outfit_response import (
    OutfitResponse, Outfit, WearableItem,
    GenerateOutfitsSimpleResponse,
    GenerateOutfitsResponse,
    UploadOutfitResponse
)
from .ai_outfit_response import AIOutfitResponse

__all__ = [
    # Wearables
    'PredictionResponse',
    'WearableUploadResponse',
    'UpdateWearableResponse',
    'DeleteWearableResponse',
    # Outfits
    'OutfitResponse', 'Outfit', 'WearableItem',
    'GenerateOutfitsSimpleResponse',
    'GenerateOutfitsResponse',
    'UploadOutfitResponse',
    # AI Outfit
    'AIOutfitResponse'
]
