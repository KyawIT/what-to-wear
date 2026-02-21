"""Image upload endpoint."""
from fastapi import APIRouter, File, UploadFile, Form, HTTPException
from pydantic import BaseModel
from PIL import Image
import io
from pathlib import Path

from models import Wearable
from dto import (
    WearableUploadResponse,
    PredictionResponse,
    UpdateWearableResponse,
    DeleteWearableResponse
)

router = APIRouter()

# Will be injected by app.py
embedder = None
repository = None


# ============================================================================
# Data Models
# ============================================================================

class UpdateWearableRequest(BaseModel):
    """Request model for updating a wearable item."""
    user_id: str
    item_id: str
    category: str
    tags: str  # Comma-separated tags


class DeleteWearableRequest(BaseModel):
    """Request model for deleting a wearable item."""
    user_id: str
    item_id: str


# ============================================================================
# Endpoints
# ============================================================================


@router.post("/upload", response_model=WearableUploadResponse)
async def upload_wearable(
    file: UploadFile = File(...),
    category: str = Form(...),
    tags: str = Form(...),
    user_id: str = Form(...),
    item_id: str = Form(...)
):
    """
    Upload a wearable image with metadata.
    
    Args:
        file: Image file (multipart/form-data)
        category: Item category (e.g., "shirt", "shoes", "jacket")
        tags: Comma-separated tags (e.g., "casual,cotton,blue")
        user_id: User identifier for ownership
        item_id: Unique item identifier
    
    Returns:
        JSON response via WearableUploadResponse DTO
    """
    if embedder is None or repository is None:
        raise HTTPException(status_code=503, detail="Service not initialized")
    
    # Validate file type
    if not file.content_type.startswith('image/'):
        raise HTTPException(status_code=400, detail="File must be an image")
    
    try:
        # Read and validate image
        contents = await file.read()
        image = Image.open(io.BytesIO(contents)).convert('RGB')
        
        # Save temporarily to disk for embedding
        temp_path = Path("/tmp") / f"{item_id}_{file.filename}"
        image.save(temp_path)
        
        # Generate embedding
        embedding = embedder.embed_image(temp_path)
        
        # Parse tags (convert "tag1,tag2" to ["tag1", "tag2"])
        tags_list = [tag.strip() for tag in tags.split(",") if tag.strip()]
        
        # Normalize category to uppercase
        normalized_category = category.upper()
        
        # Create Wearable object
        wearable = Wearable(
            id=item_id,
            embedding=embedding,
            category=normalized_category,
            tags=tags_list,
            image_path=str(temp_path),
            user_id=user_id
        )
        
        # Get next ID for Qdrant storage
        next_id = repository.get_next_id()
        
        # Store in Qdrant
        repository.insert_single(next_id, wearable)
        
        # Create and return response
        response = WearableUploadResponse(
            item_id=item_id,
            category=normalized_category,
            tags=tags_list,
            user_id=user_id
        )
        
        return response
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Upload failed: {str(e)}")


@router.put("/update", response_model=UpdateWearableResponse)
async def update_wearable(request: UpdateWearableRequest):
    """
    Update a wearable item's metadata in Qdrant.
    
    Args:
        user_id: User identifier
        item_id: Item identifier
        category: Updated category
        tags: Updated tags (comma-separated)
    
    Returns:
        JSON response with update status
    """
    if embedder is None or repository is None:
        raise HTTPException(status_code=503, detail="Service not initialized")
    
    try:
        # Find the existing item
        result = repository.find_by_user_and_item(request.user_id, request.item_id)
        if not result:
            raise HTTPException(status_code=404, detail="Item not found")
        
        _, old_payload, vector = result
        
        # Parse tags
        tags_list = [tag.strip() for tag in request.tags.split(",") if tag.strip()]
        
        # Create updated Wearable (keep the same vector/embedding)
        wearable = Wearable(
            id=request.item_id,
            embedding=vector,  # Keep existing embedding
            category=request.category,
            tags=tags_list,
            image_path=old_payload.get('image_path'),
            user_id=request.user_id
        )
        
        # Update in Qdrant
        success = repository.update_item(request.user_id, request.item_id, wearable)
        
        if not success:
            raise HTTPException(status_code=404, detail="Item not found")
        
        return UpdateWearableResponse(
            item_id=request.item_id,
            user_id=request.user_id,
            category=request.category,
            tags=tags_list
        )
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Update failed: {str(e)}")


@router.delete("/delete", response_model=DeleteWearableResponse)
async def delete_wearable(request: DeleteWearableRequest):
    """
    Delete a wearable item by marking it as deleted in metadata.
    
    Soft delete: Sets deleted=True in metadata instead of removing the vector.
    This preserves the embedding for potential recovery while marking it as deleted.
    
    Args:
        user_id: User identifier
        item_id: Item identifier
    
    Returns:
        JSON response with delete status
    """
    if embedder is None or repository is None:
        raise HTTPException(status_code=503, detail="Service not initialized")
    
    try:
        # Delete (soft delete with deleted=True in metadata)
        success = repository.delete_item(request.user_id, request.item_id)
        
        if not success:
            raise HTTPException(status_code=404, detail="Item not found")
        
        return DeleteWearableResponse(
            item_id=request.item_id,
            user_id=request.user_id,
            deleted=True
        )
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Delete failed: {str(e)}")


@router.post("/predict", response_model=PredictionResponse)
async def predict_wearable(
    file: UploadFile = File(...)
):
    """
    Predict category and tags for a wearable image.
    
    Uses vector similarity search to find similar items and predict
    category and tags based on them.
    
    Args:
        file: Image file (multipart/form-data)
    
    Returns:
        PredictionResponse with predicted category, tags, and confidence
    """
    if embedder is None or repository is None:
        raise HTTPException(status_code=503, detail="Service not initialized")
    
    # Validate file type
    if not file.content_type.startswith('image/'):
        raise HTTPException(status_code=400, detail="File must be an image")
    
    try:
        # Read and validate image
        contents = await file.read()
        image = Image.open(io.BytesIO(contents)).convert('RGB')
        
        # Save temporarily to disk for embedding
        temp_path = Path("/tmp") / f"predict_{file.filename}"
        image.save(temp_path)
        
        # Generate embedding
        embedding = embedder.embed_image(temp_path)
        
        # Predict category and tags using Qdrant vector search
        predicted_category, predicted_tags, avg_confidence = repository.predict_category_and_tags(
            query_embedding=embedding,
            limit=20,
            score_threshold=0.7,
            max_tags=5,
            tag_confidence_threshold=0.5
        )
        
        # Clean up
        temp_path.unlink(missing_ok=True)
        
        return PredictionResponse(
            category=predicted_category,
            tags=predicted_tags,
            confidence=avg_confidence
        )
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Prediction failed: {str(e)}")
