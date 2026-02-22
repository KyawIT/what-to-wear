import asyncio

from core.service.ai_outfit_service import AIOutfitService


class FakeRepository:
    """Minimal repository stub for AIOutfitService tests."""

    def __init__(self, results):
        self.results = results
        self.last_call = None

    def search_similar_for_user(
        self,
        query_embedding,
        user_id,
        limit=20,
        score_threshold=0.0,
        include_deleted=False,
    ):
        self.last_call = {
            "query_embedding": query_embedding,
            "user_id": user_id,
            "limit": limit,
            "score_threshold": score_threshold,
            "include_deleted": include_deleted,
        }
        return self.results


def test_generate_outfit_from_image_returns_empty_when_no_hits():
    service = AIOutfitService(embedder=object(), repository=FakeRepository(results=[]))
    service._embed_image_bytes = lambda _img: [0.1, 0.2]  # noqa: SLF001

    response = asyncio.run(service.generate_outfit_from_image(b"img", "user-1"))

    assert response.user_id == "user-1"
    assert response.item_ids == []


def test_generate_outfit_from_image_prioritizes_required_categories():
    results = [
        ({"id": "acc-1", "category": "belt"}, 0.98),
        ({"id": "top-1", "category": "shirt"}, 0.95),
        ({"id": "shoe-1", "category": "sneakers"}, 0.94),
        ({"id": "bottom-1", "category": "jeans"}, 0.93),
        ({"id": "acc-2", "category": "watch"}, 0.92),
    ]
    repo = FakeRepository(results=results)
    service = AIOutfitService(embedder=object(), repository=repo, max_suggestions=5)
    service._embed_image_bytes = lambda _img: [1.0]  # noqa: SLF001

    response = asyncio.run(service.generate_outfit_from_image(b"img", "user-42"))

    assert response.user_id == "user-42"
    assert response.item_ids[:3] == ["top-1", "bottom-1", "shoe-1"]
    assert "acc-1" in response.item_ids
    assert repo.last_call["user_id"] == "user-42"
    assert repo.last_call["include_deleted"] is False


def test_select_outfit_item_ids_deduplicates_and_limits():
    service = AIOutfitService(max_suggestions=4)
    similar = [
        ({"id": "top-1", "category": "shirt"}, 0.99),
        ({"id": "top-1", "category": "shirt"}, 0.98),
        ({"id": "bottom-1", "category": "pants"}, 0.97),
        ({"id": "shoe-1", "category": "boots"}, 0.96),
        ({"id": "acc-1", "category": "hat"}, 0.95),
        ({"id": "acc-2", "category": "watch"}, 0.94),
    ]

    selected = service._select_outfit_item_ids(similar, max_items=4)  # noqa: SLF001

    assert selected == ["top-1", "bottom-1", "shoe-1", "acc-1"]
