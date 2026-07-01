from unittest.mock import patch

from tests.conftest import SEED_PLACE_ID, SEED_USER_ID, UNKNOWN_ID, graphql

INIT_UPLOAD_MUTATION = """
mutation InitUpload($mime: String!, $sizeBytes: Int!, $ext: String!) {
  initUpload(mime: $mime, sizeBytes: $sizeBytes, ext: $ext) {
    key
    presignedUrl
  }
}
"""

COMPLETE_UPLOAD_MUTATION = """
mutation CompleteUpload($placeId: String!, $key: String!, $mime: String!) {
  completeUpload(placeId: $placeId, key: $key, mime: $mime) {
    id
    r2Key
    mime
  }
}
"""


def test_init_upload_rejects_invalid_mime(client):
    response = graphql(
        client,
        INIT_UPLOAD_MUTATION,
        {"mime": "application/pdf", "sizeBytes": 1024, "ext": "pdf"},
    )
    assert response.status_code == 200
    body = response.json()
    assert body.get("errors")
    assert any("Unsupported mime type" in err.get("message", "") for err in body["errors"])


def test_init_upload_rejects_oversized_file(client, monkeypatch):
    monkeypatch.setattr("app.services.storage.settings.upload_max_mb", 4)
    response = graphql(
        client,
        INIT_UPLOAD_MUTATION,
        {"mime": "image/webp", "sizeBytes": 4 * 1024 * 1024 + 1, "ext": "webp"},
    )
    assert response.status_code == 200
    body = response.json()
    assert body.get("errors")
    assert any("exceeds 4 MB" in err.get("message", "") for err in body["errors"])


@patch("app.graphql.schema.create_presigned_put_url", return_value="https://r2.example/presigned")
def test_init_upload_returns_owner_scoped_key(mock_presign, client):
    response = graphql(
        client,
        INIT_UPLOAD_MUTATION,
        {"mime": "image/webp", "sizeBytes": 2048, "ext": "webp"},
    )
    assert response.status_code == 200
    body = response.json()
    assert "errors" not in body
    upload = body["data"]["initUpload"]
    assert upload["key"].startswith(f"user/{SEED_USER_ID}/")
    assert upload["key"].endswith(".webp")
    assert upload["presignedUrl"] == "https://r2.example/presigned"
    mock_presign.assert_called_once()


def test_complete_upload_rejects_foreign_key_prefix(client):
    response = graphql(
        client,
        COMPLETE_UPLOAD_MUTATION,
        {
            "placeId": SEED_PLACE_ID,
            "key": "user/other-user-id/photo.webp",
            "mime": "image/webp",
        },
    )
    assert response.status_code == 200
    body = response.json()
    assert body.get("errors")
    assert any("Invalid owner key prefix" in err.get("message", "") for err in body["errors"])


@patch("app.graphql.schema.head_object", return_value={"ContentType": "image/png"})
def test_complete_upload_rejects_mime_mismatch(mock_head, client):
    key = f"user/{SEED_USER_ID}/mismatch.webp"
    response = graphql(
        client,
        COMPLETE_UPLOAD_MUTATION,
        {"placeId": SEED_PLACE_ID, "key": key, "mime": "image/webp"},
    )
    assert response.status_code == 200
    body = response.json()
    assert body.get("errors")
    assert any("Mime mismatch" in err.get("message", "") for err in body["errors"])
    mock_head.assert_called_once_with(key)


@patch("app.graphql.schema.head_object", return_value={"ContentType": "image/webp"})
def test_complete_upload_rejects_foreign_place(mock_head, client):
    key = f"user/{SEED_USER_ID}/orphan.webp"
    response = graphql(
        client,
        COMPLETE_UPLOAD_MUTATION,
        {"placeId": UNKNOWN_ID, "key": key, "mime": "image/webp"},
    )
    assert response.status_code == 200
    body = response.json()
    assert body.get("errors")
    assert any("Place not found" in err.get("message", "") for err in body["errors"])


@patch("app.graphql.schema.head_object", return_value={"ContentType": "image/webp"})
def test_complete_upload_attaches_photo_to_owned_place(mock_head, client):
    key = f"user/{SEED_USER_ID}/happy.webp"
    response = graphql(
        client,
        COMPLETE_UPLOAD_MUTATION,
        {"placeId": SEED_PLACE_ID, "key": key, "mime": "image/webp"},
    )
    assert response.status_code == 200
    body = response.json()
    assert "errors" not in body
    photo = body["data"]["completeUpload"]
    assert photo["r2Key"] == key
    assert photo["mime"] == "image/webp"
    mock_head.assert_called_once_with(key)
