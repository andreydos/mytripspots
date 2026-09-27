from starlette.requests import Request

from main import _client_ip


def _request(peer: str, forwarded: str | None = None) -> Request:
    headers: list[tuple[bytes, bytes]] = []
    if forwarded is not None:
        headers.append((b"x-forwarded-for", forwarded.encode()))
    return Request(
        {
            "type": "http",
            "method": "GET",
            "path": "/graphql",
            "headers": headers,
            "client": (peer, 0),
        }
    )


def test_client_ip_uses_forwarded_for_when_peer_is_local_proxy():
    req = _request("127.0.0.1", "203.0.113.10, 198.51.100.2")
    assert _client_ip(req) == "203.0.113.10"


def test_client_ip_ignores_forwarded_for_from_untrusted_peer():
    req = _request("203.0.113.99", "1.2.3.4")
    assert _client_ip(req) == "203.0.113.99"


def test_client_ip_falls_back_to_peer_without_forwarded_header():
    req = _request("127.0.0.1")
    assert _client_ip(req) == "127.0.0.1"
