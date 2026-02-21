"""Health check endpoints."""
from fastapi import APIRouter, HTTPException
import os

router = APIRouter()

# Will be injected by app.py
repository = None


@router.get("/")
async def root():
    """Health check endpoint."""
    return {
        "status": "ok",
        "service": "Wearable Classification API",
        "version": "1.0.0"
    }


@router.get("/health")
async def health_check():
    """Detailed health check."""
    try:
        # Check Qdrant connection
        COLLECTION_NAME = os.getenv("QDRANT_COLLECTION", "wearables")
        MODEL_NAME = os.getenv("MODEL_NAME", "clip-ViT-B-32")
        
        info = repository.get_collection_info()
        return {
            "status": "healthy",
            "qdrant": {
                "connected": True,
                "collection": COLLECTION_NAME,
                "vectors_count": info.points_count
            },
            "model": {
                "loaded": True,
                "name": MODEL_NAME,
                "dimension": repository.embedding_dim if repository else None
            }
        }
    except Exception as e:
        raise HTTPException(status_code=503, detail=f"Service unhealthy: {str(e)}")
