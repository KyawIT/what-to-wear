"""Service for AI outfit generation based on user wearables."""
from __future__ import annotations

from collections import defaultdict
import io
import logging
from pathlib import Path
import tempfile
from typing import Dict, List, Optional, Sequence, Tuple

from core.dto import AIOutfitResponse
from PIL import Image

logger = logging.getLogger(__name__)


class AIOutfitService:
    """Generate outfit item suggestions from an uploaded image."""

    def __init__(
        self,
        embedder=None,
        repository=None,
        max_suggestions: int = 6,
    ):
        """Initialize dependencies for AI outfit generation."""
        self.embedder = embedder
        self.repository = repository
        self.max_suggestions = max_suggestions

    async def generate_outfit_from_image(
        self,
        image_bytes: bytes,
        user_id: str
    ) -> AIOutfitResponse:
        """
        Generate outfit suggestions from an image.

        Args:
            image_bytes: Image file bytes
            user_id: User ID

        Returns:
            AIOutfitResponse with suggested user-owned wearable IDs.
        """
        if not self.is_ready():
            raise RuntimeError("AI outfit service dependencies are not initialized")

        if not image_bytes:
            return AIOutfitResponse(user_id=user_id, item_ids=[])

        query_embedding = self._embed_image_bytes(image_bytes)
        similar_items = self.repository.search_similar_for_user(
            query_embedding=query_embedding,
            user_id=user_id,
            limit=50,
            score_threshold=0.0,
            include_deleted=False,
        )

        if not similar_items:
            logger.info("No similar items found for user '%s'", user_id)
            return AIOutfitResponse(user_id=user_id, item_ids=[])

        item_ids = self._select_outfit_item_ids(similar_items, self.max_suggestions)
        return AIOutfitResponse(user_id=user_id, item_ids=item_ids)

    def _embed_image_bytes(self, image_bytes: bytes) -> List[float]:
        """Convert raw image bytes into an embedding via the shared embedder."""
        image = Image.open(io.BytesIO(image_bytes)).convert("RGB")
        with tempfile.NamedTemporaryFile(suffix=".png", delete=False) as tmp:
            tmp_path = Path(tmp.name)
            image.save(tmp_path)

        try:
            return self.embedder.embed_image(tmp_path)
        finally:
            tmp_path.unlink(missing_ok=True)

    @staticmethod
    def _main_category(raw_category: Optional[str]) -> str:
        """Normalize category to one of the main groups."""
        category = (raw_category or "").upper().strip()
        if any(token in category for token in ("TOP", "SHIRT", "HOODIE", "JACKET")):
            return "TOP"
        if any(token in category for token in ("BOTTOM", "PANT", "JEAN", "SKIRT", "DRESS")):
            return "BOTTOM"
        if "SHOE" in category or "SNEAKER" in category or "BOOT" in category:
            return "SHOES"
        if "SWIM" in category:
            return "SWIMWEAR"
        return "ACCESSORY"

    def _select_outfit_item_ids(
        self,
        similar_items: Sequence[Tuple[Dict, float]],
        max_items: int,
    ) -> List[str]:
        """
        Build a balanced outfit candidate list from nearest user wearables.

        Priority:
        1) One TOP, one BOTTOM, one SHOES if available
        2) Fill with remaining best-scoring items
        """
        by_category: Dict[str, List[Tuple[str, float]]] = defaultdict(list)
        all_candidates: List[Tuple[str, float]] = []

        for payload, score in similar_items:
            item_id = payload.get("id")
            if not item_id:
                continue
            main_category = self._main_category(payload.get("category"))
            by_category[main_category].append((item_id, float(score)))
            all_candidates.append((item_id, float(score)))

        selected: List[str] = []
        selected_set = set()

        for required in ("TOP", "BOTTOM", "SHOES"):
            candidates = by_category.get(required, [])
            if not candidates:
                continue
            best_item = candidates[0][0]
            if best_item not in selected_set:
                selected.append(best_item)
                selected_set.add(best_item)

        for item_id, _score in all_candidates:
            if len(selected) >= max_items:
                break
            if item_id in selected_set:
                continue
            selected.append(item_id)
            selected_set.add(item_id)

        return selected[:max_items]

    def configure(self, embedder=None, repository=None):
        """Inject dependencies after service construction."""
        if embedder is not None:
            self.embedder = embedder
        if repository is not None:
            self.repository = repository
        logger.info(
            "AIOutfitService configured: embedder=%s repository=%s",
            self.embedder is not None,
            self.repository is not None,
        )

    def is_ready(self) -> bool:
        """Check if required dependencies are available."""
        return self.embedder is not None and self.repository is not None
