"""
FastAPI Application for Wearable Classification

Provides REST API endpoint for classifying wearable images.
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import sys
import os
from pathlib import Path

# Add parent directory to path for imports
sys.path.insert(0, str(Path(__file__).parent))

from utils import ImageEmbedder
from repositories import WearableRepository
from service import OutfitGenerator, OutfitCombiner, AIOutfitService
from routers import health_router, outfit_router, wearables_router, ai_outfit_router
import routers.health as health_module
import routers.outfit as outfit_module
import routers.wearables as wearables_module
import routers.ai_outfit as ai_outfit_module

# Initialize FastAPI app
app = FastAPI(
    title="Wearable Classification API",
    description="API for classifying wearable items by category and tags",
    version="1.0.0"
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routers
app.include_router(health_router)
app.include_router(outfit_router)
app.include_router(ai_outfit_router)
app.include_router(wearables_router, prefix="/wearables", tags=["wearables"])

# Global instances (initialized on startup)
embedder: ImageEmbedder = None
repository: WearableRepository = None
ai_outfit_service: AIOutfitService = None
outfit_generator: OutfitGenerator = None
outfit_combiner: OutfitCombiner = None


@app.on_event("startup")
async def startup_event():
    """Initialize models and connections on startup."""
    global embedder, repository, ai_outfit_service, outfit_generator, outfit_combiner
    
    print("Initializing application...")
    
    # Configuration
    QDRANT_HOST = os.getenv("QDRANT_HOST", "wtw-qdrant")
    QDRANT_PORT = int(os.getenv("QDRANT_PORT", "6333"))
    COLLECTION_NAME = os.getenv("QDRANT_COLLECTION", "wearables")
    MODEL_NAME = os.getenv("MODEL_NAME", "clip-ViT-B-32")
    
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
    
    # Initialize AI outfit service with shared embedder + repository
    ai_outfit_service = AIOutfitService(embedder=embedder, repository=repository)
    
    # Initialize outfit generator (standalone, no repository needed)
    outfit_generator = OutfitGenerator()
    
    # Initialize outfit combiner
    outfit_combiner = OutfitCombiner()
    
    # Inject dependencies into routers
    health_module.repository = repository
    outfit_module.outfit_generator = outfit_generator
    outfit_module.outfit_combiner = outfit_combiner
    ai_outfit_module.ai_outfit_service = ai_outfit_service
    wearables_module.embedder = embedder
    wearables_module.repository = repository
    
    print("Application ready!")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
