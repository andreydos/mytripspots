from tests.conftest import SEED_PLACE_ID, SEED_TRIP_ID, UNKNOWN_ID, graphql

TRIP_PLACES_QUERY = """
query TripPlaces($tripId: String!, $search: String) {
  tripPlaces(tripId: $tripId, search: $search) {
    id
    title
    notes
  }
}
"""


def test_trip_places_returns_seed_place(client):
    response = graphql(client, TRIP_PLACES_QUERY, {"tripId": SEED_TRIP_ID})
    assert response.status_code == 200
    body = response.json()
    assert "errors" not in body
    places = body["data"]["tripPlaces"]
    assert len(places) >= 1
    london = next((p for p in places if p["id"] == SEED_PLACE_ID), None)
    assert london is not None
    assert london["title"] == "London"


def test_trip_places_search_matches_title(client):
    response = graphql(
        client,
        TRIP_PLACES_QUERY,
        {"tripId": SEED_TRIP_ID, "search": "London"},
    )
    assert response.status_code == 200
    body = response.json()
    assert "errors" not in body
    places = body["data"]["tripPlaces"]
    assert any(p["id"] == SEED_PLACE_ID for p in places)


def test_trip_places_search_no_match_returns_empty(client):
    response = graphql(
        client,
        TRIP_PLACES_QUERY,
        {"tripId": SEED_TRIP_ID, "search": "nomatch"},
    )
    assert response.status_code == 200
    body = response.json()
    assert "errors" not in body
    assert body["data"]["tripPlaces"] == []


def test_trip_places_rejects_foreign_trip(client):
    response = graphql(client, TRIP_PLACES_QUERY, {"tripId": UNKNOWN_ID})
    assert response.status_code == 200
    body = response.json()
    assert body.get("errors")
    assert any("Trip not found" in err.get("message", "") for err in body["errors"])
