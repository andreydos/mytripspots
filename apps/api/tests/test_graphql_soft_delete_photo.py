from unittest.mock import patch

from tests.conftest import SEED_PLACE_ID, SEED_USER_ID, UNKNOWN_ID, graphql

PLACE_PHOTOS_QUERY = """
query PlacePhotos($id: String!) {
  place(id: $id) {
    id
    photos {
      id
      r2Key
    }
  }
}
"""

SOFT_DELETE_MUTATION = """
mutation SoftDeletePhoto($photoId: String!) {
  softDeletePhoto(photoId: $photoId)
}
"""

COMPLETE_UPLOAD_MUTATION = """
mutation CompleteUpload($placeId: String!, $key: String!, $mime: String!) {
  completeUpload(placeId: $placeId, key: $key, mime: $mime) {
    id
  }
}
"""


@patch("app.graphql.schema.head_object", return_value={"ContentType": "image/webp"})
def test_soft_delete_photo_hides_photo_from_place_query(mock_head, client):
    key = f"user/{SEED_USER_ID}/delete-me.webp"
    create = graphql(
        client,
        COMPLETE_UPLOAD_MUTATION,
        {"placeId": SEED_PLACE_ID, "key": key, "mime": "image/webp"},
    )
    assert create.status_code == 200
    create_body = create.json()
    assert "errors" not in create_body
    photo_id = create_body["data"]["completeUpload"]["id"]

    before = graphql(client, PLACE_PHOTOS_QUERY, {"id": SEED_PLACE_ID})
    before_body = before.json()
    assert "errors" not in before_body
    assert any(p["id"] == photo_id for p in before_body["data"]["place"]["photos"])

    deleted = graphql(client, SOFT_DELETE_MUTATION, {"photoId": photo_id})
    assert deleted.status_code == 200
    delete_body = deleted.json()
    assert "errors" not in delete_body
    assert delete_body["data"]["softDeletePhoto"] is True

    after = graphql(client, PLACE_PHOTOS_QUERY, {"id": SEED_PLACE_ID})
    after_body = after.json()
    assert "errors" not in after_body
    assert not any(p["id"] == photo_id for p in after_body["data"]["place"]["photos"])


def test_soft_delete_photo_returns_false_for_unknown_photo(client):
    response = graphql(client, SOFT_DELETE_MUTATION, {"photoId": UNKNOWN_ID})
    assert response.status_code == 200
    body = response.json()
    assert "errors" not in body
    assert body["data"]["softDeletePhoto"] is False
