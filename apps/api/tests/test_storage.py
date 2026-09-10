from unittest.mock import MagicMock, patch

import pytest
from botocore.exceptions import ClientError

from app.services.storage import head_object, validate_upload_request


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


@patch("app.services.storage._s3_client")
def test_head_object_maps_missing_key_to_value_error(mock_client_factory):
    client = MagicMock()
    client.head_object.side_effect = ClientError(
        {"Error": {"Code": "404", "Message": "Not Found"}},
        "HeadObject",
    )
    mock_client_factory.return_value = client

    with pytest.raises(ValueError, match="Upload object not found in storage"):
        head_object("user/demo/missing.webp")
