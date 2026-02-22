"""Wearables endpoints for upload, update, delete, and prediction."""
from __future__ import annotations

import io
import logging
import tempfile
from pathlib import Path

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile
from PIL import Image
from pydantic import BaseModel

from core.dependencies import get_embedder, get_repository
from core.dto import (
    DeleteWearableResponse,
    PredictionResponse,
    UpdateWearableResponse,
    WearableUploadResponse,
)
from core.models import Wearable
from core.repositories import WearableRepository
from core.utils import ImageEmbedder

logger = logging.getLogger(__name__)
router = APIRouter()


class UpdateWearableRequest(BaseModel):
    """Request model for updating a wearable item."""

    user_id: str
    item_id: str
    category: str
    tags: str


class DeleteWearableRequest(BaseModel):
    """Request model for deleting a wearable item."""

    user_id: str
    item_id: str


def _require_image_content_type(upload: UploadFile) -> None:
    if not upload.content_type or not upload.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="File must be an image")


def _parse_tags(raw_tags: str) -> list[str]:
    return [tag.strip() for tag in raw_tags.split(",") if tag.strip()]


def _save_image_to_temp_file(image: Image.Image, prefix: str) -> Path:
    with tempfile.NamedTemporaryFile(prefix=prefix, suffix=".png", delete=False) as tmp_file:
        temp_path = Path(tmp_file.name)
    image.save(temp_path)
    return temp_path


@router.post("/upload", response_model=WearableUploadResponse)
async def upload_wearable(
    file: UploadFile = File(...),
    category: str = Form(...),
    tags: str = Form(...),
    user_id: str = Form(...),
    item_id: str = Form(...),
    embedder: ImageEmbedder = Depends(get_embedder),
    repository: WearableRepository = Depends(get_repository),
) -> WearableUploadResponse:
    """Upload a wearable image and persist its embedding with metadata."""
    _require_image_content_type(file)

    temp_path: Path | None = None
    try:
        image_bytes = await file.read()
        image = Image.open(io.BytesIO(image_bytes)).convert("RGB")
        temp_path = _save_image_to_temp_file(image=image, prefix=f"wearable_{item_id}_")

        embedding = embedder.embed_image(temp_path)
        tags_list = _parse_tags(tags)
        normalized_category = category.upper()

        wearable = Wearable(
            id=item_id,
            embedding=embedding,
            category=normalized_category,
            tags=tags_list,
            image_path=str(temp_path),
            user_id=user_id,
        )

        repository.insert_single(repository.get_next_id(), wearable)

        return WearableUploadResponse(
            item_id=item_id,
            category=normalized_category,
            tags=tags_list,
            user_id=user_id,
        )
    except HTTPException:
        raise
    except Exception as exc:
        logger.exception("Failed to upload wearable", extra={"item_id": item_id, "user_id": user_id})
        raise HTTPException(status_code=500, detail=f"Upload failed: {exc}") from exc
    finally:
        if temp_path is not None:
            temp_path.unlink(missing_ok=True)


@router.put("/update", response_model=UpdateWearableResponse)
async def update_wearable(
    request: UpdateWearableRequest,
    repository: WearableRepository = Depends(get_repository),
) -> UpdateWearableResponse:
    """Update category and tags for an existing wearable."""
    try:
        existing = repository.find_by_user_and_item(request.user_id, request.item_id)
        if not existing:
            raise HTTPException(status_code=404, detail="Item not found")

        _, old_payload, vector = existing
        wearable = Wearable(
            id=request.item_id,
            embedding=vector,
            category=request.category,
            tags=_parse_tags(request.tags),
            image_path=old_payload.get("image_path"),
            user_id=request.user_id,
        )

        if not repository.update_item(request.user_id, request.item_id, wearable):
            raise HTTPException(status_code=404, detail="Item not found")

        return UpdateWearableResponse(
            item_id=request.item_id,
            user_id=request.user_id,
            category=request.category,
            tags=wearable.tags,
        )
    except HTTPException:
        raise
    except Exception as exc:
        logger.exception("Failed to update wearable", extra={"item_id": request.item_id, "user_id": request.user_id})
        raise HTTPException(status_code=500, detail=f"Update failed: {exc}") from exc


@router.delete("/delete", response_model=DeleteWearableResponse)
async def delete_wearable(
    request: DeleteWearableRequest,
    repository: WearableRepository = Depends(get_repository),
) -> DeleteWearableResponse:
    """Soft-delete a wearable item by marking metadata as deleted."""
    try:
        if not repository.delete_item(request.user_id, request.item_id):
            raise HTTPException(status_code=404, detail="Item not found")

        return DeleteWearableResponse(item_id=request.item_id, user_id=request.user_id, deleted=True)
    except HTTPException:
        raise
    except Exception as exc:
        logger.exception("Failed to delete wearable", extra={"item_id": request.item_id, "user_id": request.user_id})
        raise HTTPException(status_code=500, detail=f"Delete failed: {exc}") from exc


@router.post("/predict", response_model=PredictionResponse)
async def predict_wearable(
    file: UploadFile = File(...),
    embedder: ImageEmbedder = Depends(get_embedder),
    repository: WearableRepository = Depends(get_repository),
) -> PredictionResponse:
    """Predict category and tags for an image using vector similarity search."""
    _require_image_content_type(file)

    temp_path: Path | None = None
    try:
        image_bytes = await file.read()
        image = Image.open(io.BytesIO(image_bytes)).convert("RGB")
        temp_path = _save_image_to_temp_file(image=image, prefix="predict_")

        embedding = embedder.embed_image(temp_path)
        predicted_category, predicted_tags, avg_confidence = repository.predict_category_and_tags(
            query_embedding=embedding,
            limit=20,
            score_threshold=0.7,
            max_tags=5,
            tag_confidence_threshold=0.5,
        )

        return PredictionResponse(
            category=predicted_category,
            tags=predicted_tags,
            confidence=avg_confidence,
        )
    except HTTPException:
        raise
    except Exception as exc:
        logger.exception("Failed to predict wearable")
        raise HTTPException(status_code=500, detail=f"Prediction failed: {exc}") from exc
    finally:
        if temp_path is not None:
            temp_path.unlink(missing_ok=True)
