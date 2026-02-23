"""Unit tests for WearableRepository collection bootstrap behavior."""

from core.repositories.wearable_repository import WearableRepository


class _FakeClient:
    def __init__(self, exists: bool):
        self.exists = exists
        self.create_called = False
        self.get_called = False

    def collection_exists(self, _name: str) -> bool:
        return self.exists

    def create_collection(self, *args, **kwargs):
        self.create_called = True

    def get_collection(self, _name: str):
        self.get_called = True
        if not self.exists:
            raise RuntimeError("missing")


def test_ensure_collection_exists_skips_when_present():
    repo = WearableRepository()
    fake = _FakeClient(exists=True)
    repo.client = fake

    repo.ensure_collection_exists()

    assert fake.create_called is False


def test_ensure_collection_exists_creates_when_missing():
    repo = WearableRepository()
    fake = _FakeClient(exists=False)
    repo.client = fake

    repo.ensure_collection_exists()

    assert fake.create_called is True
