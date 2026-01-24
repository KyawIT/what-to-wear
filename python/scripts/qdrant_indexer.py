#!/usr/bin/env python3
"""
Standalone Qdrant Indexer Script

Index preprocessed wearable images with their categories and tags into Qdrant.
All dependencies are included inline - no external imports from service/ needed.

Usage:
    python qdrant_indexer_standalone.py \
        --csv-path /path/to/dataset.csv \
        --images-path /path/to/images \
        --collection-name wearables \
        --qdrant-host localhost \
        --qdrant-port 6333 \
        --batch-size 32 \
        --recreate
"""

import argparse
import sys
from pathlib import Path
import pandas as pd
from tqdm import tqdm
import ast
from typing import List, Dict, Any, Tuple, Optional
from dataclasses import dataclass
from collections import Counter

# SentenceTransformer für CLIP Embeddings
from sentence_transformers import SentenceTransformer
from PIL import Image

# Qdrant Client
from qdrant_client import QdrantClient
from qdrant_client.http import models


# ============================================================================
# Inline Classes (from service/)
# ============================================================================

@dataclass
class Wearable:
    """Represents a wearable item with embeddings and metadata."""
    
    id: str  # Image filename
    embedding: List[float]
    category: str
    tags: List[str]
    image_path: Optional[str] = None
    
    def to_dict(self):
        """Convert to dictionary for Qdrant payload."""
        payload = {
            "id": self.id,
            "category": self.category,
            "tags": self.tags,
        }
        if self.image_path:
            payload["image_path"] = self.image_path
        return payload


class ImageEmbedder:
    """Generate image embeddings using SentenceTransformers CLIP."""
    
    def __init__(self, model_name: str = 'clip-ViT-B-32'):
        """
        Initialize the image embedder.
        
        Args:
            model_name: Name of the SentenceTransformer model
        """
        self.model_name = model_name
        self.model = SentenceTransformer(model_name)
        # Robust detection of embedding dimension
        dim = None
        try:
            dim = self.model.get_sentence_embedding_dimension()
        except Exception:
            pass
        if dim is None:
            try:
                dummy = Image.new('RGB', (1, 1))
                dim = len(self.model.encode(dummy))
            except Exception:
                dim = 512  # fallback for CLIP-ViT-B-32
        self.embedding_dim = dim
    
    def embed_image(self, image_path: Path) -> List[float]:
        """
        Generate embedding for a single image.
        
        Args:
            image_path: Path to image file
            
        Returns:
            Embedding vector as list of floats
        """
        img = Image.open(image_path).convert('RGB')
        embedding = self.model.encode(img)
        return embedding.tolist()
    
    def embed_images(self, image_paths: List[Path], batch_size: int = 32) -> List[List[float]]:
        """
        Generate embeddings for multiple images in batches.
        
        Args:
            image_paths: List of image file paths
            batch_size: Number of images to process at once
            
        Returns:
            List of embedding vectors
        """
        images = [Image.open(p).convert('RGB') for p in image_paths]
        embeddings = self.model.encode(images, batch_size=batch_size, show_progress_bar=False)
        return [emb.tolist() for emb in embeddings]


class WearableRepository:
    """Repository for managing wearable items in Qdrant."""
    
    def __init__(
        self,
        collection_name: str = "wearables",
        host: str = "localhost",
        port: int = 6333,
        embedding_dim: int = 512
    ):
        """
        Initialize the repository.
        
        Args:
            collection_name: Name of the Qdrant collection
            host: Qdrant host
            port: Qdrant port
            embedding_dim: Dimension of embeddings
        """
        self.collection_name = collection_name
        self.client = QdrantClient(host=host, port=port)
        self.embedding_dim = embedding_dim
        
    def create_collection(self, recreate: bool = False):
        """Create or recreate the Qdrant collection reliably."""
        try:
            if recreate:
                # atomic recreate - delete & create
                self.client.recreate_collection(
                    collection_name=self.collection_name,
                    vectors_config=models.VectorParams(
                        size=self.embedding_dim,
                        distance=models.Distance.COSINE
                    )
                )
                print(f"Recreated collection: {self.collection_name}")
            else:
                self.client.create_collection(
                    collection_name=self.collection_name,
                    vectors_config=models.VectorParams(
                        size=self.embedding_dim,
                        distance=models.Distance.COSINE
                    )
                )
                print(f"Created collection: {self.collection_name}")
        except Exception as e:
            # If already exists and not recreating, continue
            if not recreate and "already exists" in str(e):
                print(f"Collection already exists: {self.collection_name}")
            else:
                print(f"Error (create_collection): {e}")
                raise
    
    def insert_batch(self, wearables: List[Wearable], start_id: int = 0):
        """
        Insert a batch of wearable items.
        
        Args:
            wearables: List of Wearable objects
            start_id: Starting ID for this batch
        """
        points = []
        for i, item in enumerate(wearables):
            points.append(
                models.PointStruct(
                    id=start_id + i,
                    vector=item.embedding,
                    payload=item.to_dict()
                )
            )
        
        self.client.upsert(
            collection_name=self.collection_name,
            points=points
        )
    
    def get_collection_info(self) -> Dict[str, Any]:
        """Get information about the collection."""
        return self.client.get_collection(self.collection_name)


# ============================================================================
# Helper Functions
# ============================================================================

def parse_tags(tags_str):
    """Parse tags from string representation."""
    if pd.isna(tags_str):
        return []
    
    if isinstance(tags_str, list):
        return tags_str
    
    try:
        # Try to parse as Python literal
        tags = ast.literal_eval(str(tags_str))
        return tags if isinstance(tags, list) else []
    except:
        return []


# ============================================================================
# Main
# ============================================================================

def main():
    parser = argparse.ArgumentParser(description='Index wearables into Qdrant')
    parser.add_argument('--csv-path', type=Path, required=True, help='Path to CSV file with image metadata')
    parser.add_argument('--images-path', type=Path, required=True, help='Path to images directory')
    parser.add_argument('--collection-name', type=str, default='wearables', help='Qdrant collection name')
    parser.add_argument('--qdrant-host', type=str, default='localhost', help='Qdrant host')
    parser.add_argument('--qdrant-port', type=int, default=6333, help='Qdrant port')
    parser.add_argument('--batch-size', type=int, default=32, help='Batch size for embedding generation')
    parser.add_argument('--model-name', type=str, default='clip-ViT-B-32', help='SentenceTransformer model name')
    parser.add_argument('--recreate', action='store_true', help='Recreate collection (deletes existing data)')
    
    args = parser.parse_args()
    
    # Validate inputs
    if not args.csv_path.exists():
        print(f"Error: CSV file not found: {args.csv_path}")
        sys.exit(1)
    
    if not args.images_path.exists():
        print(f"Error: Images directory not found: {args.images_path}")
        sys.exit(1)
    
    print("="*60)
    print("Qdrant Indexer (Standalone)")
    print("="*60)
    print(f"CSV: {args.csv_path}")
    print(f"Images: {args.images_path}")
    print(f"Collection: {args.collection_name}")
    print(f"Qdrant: {args.qdrant_host}:{args.qdrant_port}")
    print(f"Batch size: {args.batch_size}")
    print(f"Model: {args.model_name}")
    print(f"Recreate: {args.recreate}")
    print("="*60)
    
    # Load CSV
    print("\nLoading CSV...")
    df = pd.read_csv(args.csv_path)
    print(f"Loaded {len(df)} items")
    
    # Parse tags
    df['tags_parsed'] = df['tags'].apply(parse_tags)
    
    # Initialize embedder
    print("\nInitializing image embedder...")
    embedder = ImageEmbedder(model_name=args.model_name)
    embedding_dim = embedder.embedding_dim
    print(f"Embedding dimension: {embedding_dim}")
    
    # Initialize repository
    print("\nConnecting to Qdrant...")
    repository = WearableRepository(
        collection_name=args.collection_name,
        host=args.qdrant_host,
        port=args.qdrant_port,
        embedding_dim=embedding_dim
    )
    
    # Create collection
    print(f"\nCreating collection (recreate={args.recreate})...")
    repository.create_collection(recreate=args.recreate)

    # Verify collection exists
    try:
        info = repository.get_collection_info()
        print(f"Collection ready. Vector size: {info.config.params.vectors.size}")
    except Exception as e:
        print(f"Collection verification failed: {e}")
        sys.exit(1)
    
    # Process in batches
    print("\nGenerating embeddings and indexing...")
    total_batches = (len(df) + args.batch_size - 1) // args.batch_size
    total_indexed = 0
    
    for batch_idx in tqdm(range(0, len(df), args.batch_size), total=total_batches, desc="Processing batches"):
        batch_df = df.iloc[batch_idx:batch_idx + args.batch_size]
        
        # Get image paths
        image_paths = [args.images_path / row['image'] for _, row in batch_df.iterrows()]
        
        # Filter out missing images
        valid_indices = []
        valid_paths = []
        for i, path in enumerate(image_paths):
            if path.exists():
                valid_indices.append(batch_idx + i)
                valid_paths.append(path)
        
        if not valid_paths:
            continue
        
        # Generate embeddings
        try:
            embeddings = embedder.embed_images(valid_paths, batch_size=len(valid_paths))
        except Exception as e:
            print(f"\nError generating embeddings for batch {batch_idx}: {e}")
            continue
        
        # Create Wearable objects (image_path not stored)
        wearables = []
        for idx, embedding in zip(valid_indices, embeddings):
            row = df.iloc[idx]
            wearable = Wearable(
                id=row['image'],
                embedding=embedding,
                category=row['category'],
                tags=row['tags_parsed']
            )
            wearables.append(wearable)
        
        # Insert batch
        try:
            repository.insert_batch(wearables, start_id=total_indexed)
            total_indexed += len(wearables)
        except Exception as e:
            print(f"\nError inserting batch {batch_idx}: {e}")
    
    # Get collection info
    print("\n" + "="*60)
    print("Indexing completed!")
    print("="*60)
    try:
        info = repository.get_collection_info()
        print(f"Collection: {args.collection_name}")
        print(f"Total vectors indexed: {total_indexed}")
        print(f"Total vectors in Qdrant: {info.points_count}")
        print(f"Vector dimension: {info.config.params.vectors.size}")
    except Exception as e:
        print(f"Could not retrieve collection info: {e}")
    
    print("\nDone!")


if __name__ == '__main__':
    main()
