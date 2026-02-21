"""Qdrant repository for wearable items."""
import logging
from qdrant_client import QdrantClient
from qdrant_client.http import models
from typing import List, Dict, Any, Tuple
from collections import Counter
import ast

from models import Wearable

logger = logging.getLogger(__name__)


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
                logger.info(f"Deleted existing collection: {self.collection_name}")
            except Exception as e:
                logger.info(f"Collection doesn't exist or couldn't be deleted: {e}")

        try:
            self.client.create_collection(
                collection_name=self.collection_name,
                vectors_config=models.VectorParams(
                    size=self.embedding_dim,
                    distance=models.Distance.COSINE
                )
            )
            logger.info(f"Created collection: {self.collection_name}")
        except Exception as e:
            logger.info(f"Collection already exists or error: {e}")
    
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
        logger.info(f"Inserted {len(points)} items into {self.collection_name}")
    
    def insert_single(self, item_id: int, wearable: Wearable) -> int:
        """
        Insert or update a single wearable item.

        Args:
            item_id: Unique ID for the item in Qdrant
            wearable: Wearable object to insert

        Returns:
            The item_id (useful for tracking)
        """
        point = models.PointStruct(
            id=item_id,
            vector=wearable.embedding,
            payload=wearable.to_dict()
        )
        
        self.client.upsert(
            collection_name=self.collection_name,
            points=[point]
        )
        logger.info(f"Inserted item {item_id} into {self.collection_name}")
        return item_id
    
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
        # Use query_points (modern Qdrant API)
        results = self.client.query_points(
            collection_name=self.collection_name,
            query=query_embedding,
            limit=limit,
            score_threshold=score_threshold
        )
        
        return [(hit.payload, hit.score) for hit in results.points]

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

    def get_next_id(self) -> int:
        """
        Get the next available ID for a new item.

        Returns:
            Next ID (points_count + 1)
        """
        info = self.get_collection_info()
        return info.points_count + 1

    def find_by_user_and_item(self, user_id: str, item_id: str) -> Tuple[int, Dict[str, Any], List[float]] | None:
        """
        Find a point by user_id and item_id.

        Args:
            user_id: User identifier
            item_id: Item identifier

        Returns:
            Tuple of (point_id, payload, vector) or None if not found
        """
        try:
            # Use scroll to iterate through all points
            points, next_offset = self.client.scroll(
                collection_name=self.collection_name,
                limit=100,
                with_vectors=True
            )
            
            while points:
                for point in points:
                    p_user = point.payload.get('user_id')
                    p_id = point.payload.get('id')
                    if p_user == user_id and p_id == item_id:
                        return (point.id, point.payload, point.vector)

                # Get next batch
                points, next_offset = self.client.scroll(
                    collection_name=self.collection_name,
                    offset=next_offset,
                    limit=100,
                    with_vectors=True
                )

            return None

        except Exception as e:
            import traceback
            traceback.print_exc()
            return None

    def get_item_debug(self, user_id: str, item_id: str):
        """
        Debug helper: Print item details (vector + metadata) to console.

        Args:
            user_id: User identifier
            item_id: Item identifier
        """
        result = self.find_by_user_and_item(user_id, item_id)
        
        if not result:
            logger.debug(f"Item not found: user_id='{user_id}', item_id='{item_id}'")
            return

        point_id, payload, vector = result
        
        logger.debug(f"Item Details: {item_id}")
        logger.debug(f"Point ID (Qdrant): {point_id}")
        logger.debug(f"User ID: {payload.get('user_id')}")
        logger.debug(f"Item ID: {payload.get('id')}")
        logger.debug(f"Category: {payload.get('category')}")
        logger.debug(f"Tags: {payload.get('tags')}")
        logger.debug(f"Image Path: {payload.get('image_path')}")
        logger.debug(f"Deleted: {payload.get('deleted', False)}")
        logger.debug(f"Vector (first 10 dimensions): {vector[:10]}")
        logger.debug(f"Vector Length: {len(vector)}")

    def update_item(self, user_id: str, item_id: str, wearable: Wearable) -> bool:
        """
        Update an existing wearable item.

        Args:
            user_id: User identifier
            item_id: Item identifier
            wearable: Updated Wearable object

        Returns:
            True if updated, False if not found
        """
        result = self.find_by_user_and_item(user_id, item_id)
        if not result:
            return False

        point_id, _, _ = result

        # Update the point with new vector and payload
        point = models.PointStruct(
            id=point_id,
            vector=wearable.embedding,
            payload=wearable.to_dict()
        )
        
        self.client.upsert(
            collection_name=self.collection_name,
            points=[point]
        )
        
        logger.info(f"Updated item {item_id} for user {user_id}")
        return True

    def delete_item(self, user_id: str, item_id: str) -> bool:
        """
        Mark an item as deleted by setting deleted=True in metadata.

        Args:
            user_id: User identifier
            item_id: Item identifier

        Returns:
            True if deleted, False if not found
        """
        result = self.find_by_user_and_item(user_id, item_id)
        if not result:
            return False

        point_id, payload, vector = result

        # Mark as deleted in metadata
        payload['deleted'] = True
        
        # Update the point
        point = models.PointStruct(
            id=point_id,
            vector=vector,
            payload=payload
        )
        
        self.client.upsert(
            collection_name=self.collection_name,
            points=[point]
        )
        
        logger.info(f"Deleted item {item_id} for user {user_id}")
        return True
