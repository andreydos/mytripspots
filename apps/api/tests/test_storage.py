import pytest

from app.services.storage import validate_upload_request, validate_uploaded_object


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


def test_validate_uploaded_object_rejects_oversized_file(monkeypatch):
    monkeypatch.setattr("app.services.storage.settings.upload_max_mb", 4)
    over_limit = 4 * 1024 * 1024 + 1
    with pytest.raises(ValueError, match="exceeds 4 MB"):
        validate_uploaded_object({"ContentType": "image/webp", "ContentLength": over_limit}, "image/webp")


def test_validate_uploaded_object_rejects_disallowed_content_type():
    with pytest.raises(ValueError, match="Unsupported mime type"):
        validate_uploaded_object({"ContentType": "application/pdf", "ContentLength": 1024}, "image/webp")
