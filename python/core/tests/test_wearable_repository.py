"""Unit tests for WearableRepository collection bootstrap behavior."""

import pytest

from core.repositories.wearable_repository import WearableRepository


class _FakeClient:
    def __init__(self, exists: bool):
        self.exists = exists
        self.create_called = False

    def collection_exists(self, _name: str) -> bool:
        return self.exists

    def create_collection(self, *args, **kwargs):
        self.create_called = True
        self.exists = True

    def get_collection(self, _name: str):
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


class _AlwaysFailClient:
    def collection_exists(self, _name: str) -> bool:
        raise RuntimeError("qdrant unavailable")

    def create_collection(self, *args, **kwargs):
        raise RuntimeError("still unavailable")

    def get_collection(self, _name: str):
        raise RuntimeError("still unavailable")


def test_ensure_collection_exists_raises_when_qdrant_unavailable(monkeypatch):
    repo = WearableRepository()
    repo.client = _AlwaysFailClient()
    monkeypatch.setattr("core.repositories.wearable_repository.time.sleep", lambda _seconds: None)

    with pytest.raises(RuntimeError, match="Unable to ensure Qdrant collection"):
        repo.ensure_collection_exists()
