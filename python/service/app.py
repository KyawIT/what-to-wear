"""
FastAPI Application for Wearable Classification

Provides REST API endpoint for classifying wearable images.
"""
from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from PIL import Image
import io
import os
import sys
from pathlib import Path
from typing import Dict

# Add parent directory to path for imports
sys.path.insert(0, str(Path(__file__).parent))

from utils import ImageEmbedder
from repositories import WearableRepository
from dto import PredictionResponse

# Initialize FastAPI app
app = FastAPI(
    title="Wearable Classification API",
    description="API for classifying wearable items by category and tags",
    version="1.0.0"
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure this properly for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global instances (initialized on startup)
embedder: ImageEmbedder = None
repository: WearableRepository = None

# Configuration
QDRANT_HOST = os.getenv("QDRANT_HOST", "localhost")
QDRANT_PORT = int(os.getenv("QDRANT_PORT", "6333"))
COLLECTION_NAME = "wearables"
MODEL_NAME = "clip-ViT-B-32"
SCORE_THRESHOLD = 0.7  # Minimum similarity score
MAX_TAGS = 5
SEARCH_LIMIT = 20  # Number of similar items to consider


@app.on_event("startup")
async def startup_event():
    """Initialize models and connections on startup."""
    global embedder, repository
    
    print("Initializing application...")
    
    # Initialize embedder
    print(f"Loading embedding model: {MODEL_NAME}")
    embedder = ImageEmbedder(model_name=MODEL_NAME)
    print(f"Embedding dimension: {embedder.embedding_dim}")
    
    # Initialize repository
    print(f"Connecting to Qdrant at {QDRANT_HOST}:{QDRANT_PORT}")
    repository = WearableRepository(
        collection_name=COLLECTION_NAME,
        host=QDRANT_HOST,
        port=QDRANT_PORT,
        embedding_dim=embedder.embedding_dim
    )
    
    print("Application ready!")


@app.get("/")
async def root():
    """Health check endpoint."""
    return {
        "status": "ok",
        "service": "Wearable Classification API",
        "version": "1.0.0"
    }


@app.get("/health")
async def health_check():
    """Detailed health check."""
    try:
        # Check Qdrant connection
        info = repository.get_collection_info()
        return {
            "status": "healthy",
            "qdrant": {
                "connected": True,
                "collection": COLLECTION_NAME,
                "vectors_count": info.points_count
            },
            "model": {
                "loaded": embedder is not None,
                "name": MODEL_NAME,
                "dimension": embedder.embedding_dim if embedder else None
            }
        }
    except Exception as e:
        raise HTTPException(status_code=503, detail=f"Service unhealthy: {str(e)}")


@app.post("/predict", response_model=Dict)
async def predict(file: UploadFile = File(...)):
    """
    Classify a wearable image.
    
    Args:
        file: Image file (multipart/form-data)
    
    Returns:
        JSON response with category, tags, and confidence
    """
    if embedder is None or repository is None:
        raise HTTPException(status_code=503, detail="Service not initialized")
    
    # Validate file type
    if not file.content_type.startswith('image/'):
        raise HTTPException(status_code=400, detail="File must be an image")
    
    try:
        # Read image
        contents = await file.read()
        image = Image.open(io.BytesIO(contents)).convert('RGB')
        
        # Generate embedding
        # Save temporarily to disk for embedding
        temp_path = Path("/tmp") / file.filename
        image.save(temp_path)
        
        embedding = embedder.embed_image(temp_path)
        
        # Clean up temp file
        temp_path.unlink()
        
        # Predict category and tags
        category, tags, confidence = repository.predict_category_and_tags(
            query_embedding=embedding,
            limit=SEARCH_LIMIT,
            score_threshold=SCORE_THRESHOLD,
            max_tags=MAX_TAGS
        )
        
        # Check if confidence is high enough
        if confidence < SCORE_THRESHOLD:
            raise HTTPException(
                status_code=422,
                detail=f"Low confidence ({confidence:.2f}). Unable to classify with certainty."
            )
        
        # Create response
        response = PredictionResponse(
            category=category,
            tags=tags,
            confidence=confidence
        )
        
        return response.to_dict()
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Prediction failed: {str(e)}")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
