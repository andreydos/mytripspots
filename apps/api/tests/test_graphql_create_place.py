from uuid import uuid4

from tests.conftest import SEED_TRIP_ID, UNKNOWN_ID, graphql

CREATE_PLACE_MUTATION = """
mutation CreatePlace($tripId: String!, $title: String!, $lat: Float!, $lng: Float!, $notes: String) {
  createPlace(tripId: $tripId, title: $title, lat: $lat, lng: $lng, notes: $notes) {
    id
    tripId
    title
    lat
    lng
    notes
  }
}
"""


def test_create_place_on_owned_trip(client):
    title = f"Test place {uuid4().hex[:8]}"
    response = graphql(
        client,
        CREATE_PLACE_MUTATION,
        {
            "tripId": SEED_TRIP_ID,
            "title": title,
            "lat": 48.8566,
            "lng": 2.3522,
            "notes": "Created in test",
        },
    )
    assert response.status_code == 200
    body = response.json()
    assert "errors" not in body
    place = body["data"]["createPlace"]
    assert place["tripId"] == SEED_TRIP_ID
    assert place["title"] == title
    assert place["notes"] == "Created in test"
    assert place["lat"] == 48.8566
    assert place["lng"] == 2.3522


def test_create_place_rejects_foreign_trip(client):
    response = graphql(
        client,
        CREATE_PLACE_MUTATION,
        {
            "tripId": UNKNOWN_ID,
            "title": "Should fail",
            "lat": 0.0,
            "lng": 0.0,
        },
    )
    assert response.status_code == 200
    body = response.json()
    assert body.get("errors")
    assert any("Trip not found" in err.get("message", "") for err in body["errors"])
