"""AI Outfit generation endpoint."""
import logging
from fastapi import APIRouter, File, UploadFile, Form, HTTPException, Request
import io

from dto import AIOutfitResponse

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/outfit", tags=["outfit"])

# Will be injected by app.py
ai_outfit_service = None


@router.post("/ai", response_model=AIOutfitResponse)
async def generate_ai_outfit(
    request: Request,
    user_id: str = Form(...)
):
    """
    Generate outfit suggestions from an image using the neural network model.
    
    Das Modell analysiert das hochgeladene Bild und schlägt passende Wearables vor,
    die zum Style/zur Kleidung im Bild passen oder diese ergänzen.
    
    Expects multipart form data with:
    - user_id: User ID (required)
    - image: Image file (required, PNG/JPG)
    
    Returns:
        JSON response with:
        - user_id: The user ID
        - item_ids: Array of suggested item IDs (from database)
    
    Example response:
    {
        "user_id": "test-user",
        "item_ids": [
            "item-black-shoes",
            "item-blue-jeans",
            "item-white-shirt",
            "item-gold-belt"
        ]
    }
    
    **Nächster Schritt:** 
    Mit den item_ids aus MinIO die Bilder fetchen und `/outfit/upload` aufrufen.
    """
    if ai_outfit_service is None:
        raise HTTPException(status_code=503, detail="AI outfit service not initialized")
    
    if not ai_outfit_service.is_ready():
        raise HTTPException(
            status_code=503,
            detail="AI model not yet ready. Neural network is still being trained."
        )
    
    try:
        # Parse multipart form data
        form_data = await request.form()
        
        # Get image file
        image_file = form_data.get("image")
        if not image_file:
            raise HTTPException(status_code=400, detail="Missing 'image' file")
        
        # Read image bytes
        if hasattr(image_file, 'read'):
            image_bytes = await image_file.read()
            logger.debug(f"Loaded image: {len(image_bytes)} bytes")
        else:
            raise HTTPException(status_code=400, detail="Invalid image file")
        
        logger.info(f"Generating outfit suggestions from image for user: {user_id}")
        
        # Generate outfit using AI model
        response = await ai_outfit_service.generate_outfit_from_image(
            image_bytes=image_bytes,
            user_id=user_id
        )
        
        logger.info(f"Generated outfit with {len(response.item_ids)} suggested items")
        
        return response
        
    except NotImplementedError as e:
        logger.warning(str(e))
        raise HTTPException(status_code=503, detail=str(e))
    except Exception as e:
        logger.error(f"Failed to generate outfit: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to generate outfit: {str(e)}")
