"""Qdrant repository for wearable items."""
from qdrant_client import QdrantClient
from qdrant_client.http import models
from typing import List, Dict, Any, Tuple
from collections import Counter
import ast

from models import Wearable


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
        """
        Create the Qdrant collection.
        
        Args:
            recreate: If True, delete existing collection and create new one
        """
        if recreate:
            try:
                self.client.delete_collection(self.collection_name)
                print(f"Deleted existing collection: {self.collection_name}")
            except Exception as e:
                print(f"Collection doesn't exist or couldn't be deleted: {e}")
        
        try:
            self.client.create_collection(
                collection_name=self.collection_name,
                vectors_config=models.VectorParams(
                    size=self.embedding_dim,
                    distance=models.Distance.COSINE
                )
            )
            print(f"Created collection: {self.collection_name}")
        except Exception as e:
            print(f"Collection already exists or error: {e}")
    
    def insert_batch(self, wearables: List[Wearable]):
        """
        Insert a batch of wearable items.
        
        Args:
            wearables: List of Wearable objects
        """
        points = []
        for i, item in enumerate(wearables):
            points.append(
                models.PointStruct(
                    id=i,
                    vector=item.embedding,
                    payload=item.to_dict()
                )
            )
        
        self.client.upsert(
            collection_name=self.collection_name,
            points=points
        )
        print(f"Inserted {len(points)} items into {self.collection_name}")
    
    def search_similar(
        self,
        query_embedding: List[float],
        limit: int = 10,
        score_threshold: float = 0.7
    ) -> List[Tuple[Dict[str, Any], float]]:
        """
        Search for similar items.
        
        Args:
            query_embedding: Query embedding vector
            limit: Maximum number of results
            score_threshold: Minimum similarity score
            
        Returns:
            List of tuples (payload, score)
        """
        results = self.client.search(
            collection_name=self.collection_name,
            query_vector=query_embedding,
            limit=limit,
            score_threshold=score_threshold
        )
        
        return [(hit.payload, hit.score) for hit in results]
    
    def predict_category_and_tags(
        self,
        query_embedding: List[float],
        limit: int = 20,
        score_threshold: float = 0.7,
        max_tags: int = 5,
        tag_confidence_threshold: float = 0.5
    ) -> Tuple[str, List[str], float]:
        """
        Predict category and tags based on similar items.
        
        Args:
            query_embedding: Query embedding vector
            limit: Number of similar items to consider
            score_threshold: Minimum similarity score
            max_tags: Maximum number of tags to return (0-5)
            tag_confidence_threshold: Minimum fraction of results a tag must
                appear in to be included (e.g., 0.5 means tag must appear in
                at least 50% of similar items)
            
        Returns:
            Tuple of (category, tags, average_confidence)
        """
        results = self.search_similar(query_embedding, limit, score_threshold)
        
        if not results:
            return "Unknown", [], 0.0
        
        # Count categories
        categories = [payload['category'] for payload, _ in results]
        category_counts = Counter(categories)
        predicted_category, category_votes = category_counts.most_common(1)[0]
        
        # Count tags
        all_tags = []
        for payload, score in results:
            tags_str = payload.get('tags', '[]')
            # Parse tags string safely
            try:
                if isinstance(tags_str, str):
                    tags = ast.literal_eval(tags_str)
                else:
                    tags = tags_str
                all_tags.extend(tags)
            except:
                continue
        
        tag_counts = Counter(all_tags)
        # Filter tags by confidence threshold
        # Determine minimum count a tag must have to be considered
        min_tag_count = max(1, int(len(results) * tag_confidence_threshold))
        filtered = [(tag, cnt) for tag, cnt in tag_counts.most_common() if cnt >= min_tag_count]
        predicted_tags = [tag for tag, _ in filtered[:max_tags]]
        
        # Calculate average confidence
        avg_confidence = sum(score for _, score in results) / len(results)
        
        return predicted_category, predicted_tags, avg_confidence
    
    def get_collection_info(self) -> Dict[str, Any]:
        """Get information about the collection."""
        return self.client.get_collection(self.collection_name)
