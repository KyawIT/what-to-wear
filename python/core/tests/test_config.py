"""Unit tests for runtime settings parsing."""

from core.config import Settings


def test_settings_from_env_parses_typed_values(monkeypatch):
    monkeypatch.setenv("APP_NAME", "WTW API")
    monkeypatch.setenv("QDRANT_PORT", "7000")
    monkeypatch.setenv("AI_MAX_SUGGESTIONS", "9")
    monkeypatch.setenv("CORS_ALLOW_ORIGINS", "https://a.test, https://b.test")

    settings = Settings.from_env()

    assert settings.app_name == "WTW API"
    assert settings.qdrant_port == 7000
    assert settings.ai_max_suggestions == 9
    assert settings.cors_origins() == ["https://a.test", "https://b.test"]


def test_settings_from_env_allows_wildcard_cors(monkeypatch):
    monkeypatch.setenv("CORS_ALLOW_ORIGINS", "*")

    settings = Settings.from_env()

    assert settings.cors_origins() == ["*"]
