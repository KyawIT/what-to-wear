"""AI outfit generation endpoint."""
import logging
from fastapi import APIRouter, Form, HTTPException, Request

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
    Generate outfit suggestions from a user image.
    
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
    
    Next step:
    Fetch image files for returned item_ids and call `/outfit/upload`.
    """
    if ai_outfit_service is None:
        raise HTTPException(status_code=503, detail="AI outfit service not initialized")
    
    if not ai_outfit_service.is_ready():
        raise HTTPException(
            status_code=503,
            detail="AI outfit service is not ready yet."
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

        if not image_bytes:
            raise HTTPException(status_code=400, detail="Uploaded image is empty")
        
        logger.info(f"Generating outfit suggestions from image for user: {user_id}")
        
        # Generate outfit using AI model
        response = await ai_outfit_service.generate_outfit_from_image(
            image_bytes=image_bytes,
            user_id=user_id
        )
        
        logger.info(f"Generated outfit with {len(response.item_ids)} suggested items")
        
        return response
        
    except ValueError as e:
        logger.warning(f"Invalid AI outfit request: {e}")
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Failed to generate outfit: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to generate outfit: {str(e)}")
