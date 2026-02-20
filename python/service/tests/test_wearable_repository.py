from types import SimpleNamespace

from repositories.wearable_repository import WearableRepository


def test_search_similar_uses_query_points_when_available():
    repo = WearableRepository()

    class QueryClient:
        def query_points(
            self,
            collection_name,
            query,
            limit,
            score_threshold,
            with_payload,
            with_vectors,
        ):
            assert collection_name == repo.collection_name
            assert isinstance(query, list)
            assert limit == 10
            assert score_threshold == 0.7
            assert with_payload is True
            assert with_vectors is False
            return SimpleNamespace(
                points=[SimpleNamespace(payload={"category": "Shoes"}, score=0.92)]
            )

    repo.client = QueryClient()
    results = repo.search_similar([0.1, 0.2], limit=10, score_threshold=0.7)

    assert results == [({"category": "Shoes"}, 0.92)]


def test_search_similar_falls_back_to_search():
    repo = WearableRepository()

    class LegacyClient:
        def search(self, collection_name, query_vector, limit, score_threshold):
            assert collection_name == repo.collection_name
            assert isinstance(query_vector, list)
            assert limit == 5
            assert score_threshold == 0.6
            return [SimpleNamespace(payload={"category": "Shoes"}, score=0.88)]

    repo.client = LegacyClient()
    results = repo.search_similar([0.1, 0.2], limit=5, score_threshold=0.6)

    assert results == [({"category": "Shoes"}, 0.88)]
