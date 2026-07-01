import pytest

from app.services.storage import validate_upload_request


def test_validate_upload_rejects_unsupported_mime():
    with pytest.raises(ValueError, match="Unsupported mime type"):
        validate_upload_request(mime="application/pdf", size_bytes=1024)


def test_validate_upload_rejects_oversized_file(monkeypatch):
    monkeypatch.setattr("app.services.storage.settings.upload_max_mb", 4)
    over_limit = 4 * 1024 * 1024 + 1
    with pytest.raises(ValueError, match="exceeds 4 MB"):
        validate_upload_request(mime="image/webp", size_bytes=over_limit)


def test_validate_upload_accepts_allowed_image():
    validate_upload_request(mime="image/webp", size_bytes=1024)
