from tests.conftest import SEED_PLACE_ID, graphql


PLACE_QUERY = """
query Place($id: String!) {
  place(id: $id) {
    id
    title
    tripId
    lat
    lng
    notes
  }
}
"""


def test_place_returns_owned_place(client):
    response = graphql(client, PLACE_QUERY, {"id": SEED_PLACE_ID})
    assert response.status_code == 200
    body = response.json()
    assert "errors" not in body
    place = body["data"]["place"]
    assert place is not None
    assert place["id"] == SEED_PLACE_ID
    assert place["title"] == "London"
    assert place["notes"] == "Seed place"


def test_place_returns_null_for_unknown_id(client):
    response = graphql(
        client,
        PLACE_QUERY,
        {"id": "00000000-0000-0000-0000-000000000099"},
    )
    assert response.status_code == 200
    body = response.json()
    assert body["data"]["place"] is None


def test_place_requires_authorization(client):
    response = graphql(
        client,
        PLACE_QUERY,
        {"id": SEED_PLACE_ID},
        authenticated=False,
    )
    assert response.status_code == 200
    body = response.json()
    assert body.get("errors")
