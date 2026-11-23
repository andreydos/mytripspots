"""Rate limiter uses proxied client IP when the API is behind Caddy on localhost."""

from fastapi.testclient import TestClient

from main import app, rate_windows


def _clear_rate_windows() -> None:
    rate_windows.clear()


def test_client_ip_honors_x_forwarded_for_from_loopback_peer():
    from main import _client_ip
    from starlette.requests import Request

    scope = {
        "type": "http",
        "headers": [(b"x-forwarded-for", b"203.0.113.10, 198.51.100.2")],
        "client": ("127.0.0.1", 12345),
        "method": "POST",
        "path": "/graphql",
        "query_string": b"",
        "server": ("test", 80),
        "scheme": "http",
    }
    request = Request(scope)
    assert _client_ip(request) == "203.0.113.10"


def test_rate_limit_buckets_by_x_forwarded_for_behind_local_peer():
    _clear_rate_windows()
    client = TestClient(app, client=("127.0.0.1", 12345))
    query = {"query": "{ __typename }"}
    local_peer_headers = {
        "X-Forwarded-For": "203.0.113.10",
    }

    for _ in range(30):
        response = client.post("/graphql", json=query, headers=local_peer_headers)
        assert response.status_code == 200

    response = client.post("/graphql", json=query, headers=local_peer_headers)
    assert response.status_code == 429

    other_client_headers = {"X-Forwarded-For": "203.0.113.11"}
    response = client.post("/graphql", json=query, headers=other_client_headers)
    assert response.status_code == 200