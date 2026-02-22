"""AI outfit generation endpoint."""
from __future__ import annotations

import logging

from fastapi import APIRouter, Depends, Form, HTTPException, Request

from core.dependencies import get_ai_outfit_service
from core.dto import AIOutfitResponse
from core.service import AIOutfitService

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/outfit", tags=["outfit"])


@router.post("/ai", response_model=AIOutfitResponse)
async def generate_ai_outfit(
    request: Request,
    user_id: str = Form(...),
    ai_outfit_service: AIOutfitService = Depends(get_ai_outfit_service),
) -> AIOutfitResponse:
    """Generate outfit suggestions from an uploaded image."""
    if not ai_outfit_service.is_ready():
        raise HTTPException(status_code=503, detail="AI outfit service is not ready yet.")

    try:
        form_data = await request.form()
        image_file = form_data.get("image")
        if not image_file:
            raise HTTPException(status_code=400, detail="Missing 'image' file")

        if not hasattr(image_file, "read"):
            raise HTTPException(status_code=400, detail="Invalid image file")

        image_bytes = await image_file.read()
        if not image_bytes:
            raise HTTPException(status_code=400, detail="Uploaded image is empty")

        logger.info("Generating AI outfit", extra={"user_id": user_id, "image_bytes": len(image_bytes)})
        response = await ai_outfit_service.generate_outfit_from_image(image_bytes=image_bytes, user_id=user_id)
        return response
    except HTTPException:
        raise
    except ValueError as exc:
        logger.warning("Invalid AI outfit request: %s", exc)
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    except Exception as exc:
        logger.exception("Failed to generate AI outfit")
        raise HTTPException(status_code=500, detail=f"Failed to generate outfit: {exc}") from exc
