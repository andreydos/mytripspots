import jwt
import pytest

from app.services.auth import authenticate
from tests.conftest import SEED_CLERK_USER, TEST_AUTH_HEADER


def test_authenticate_accepts_test_token(client):
    response = client.post(
        "/graphql",
        json={"query": "{ me { clerkUserId } }"},
        headers=TEST_AUTH_HEADER,
    )
    assert response.status_code == 200
    body = response.json()
    assert "errors" not in body
    assert body["data"]["me"]["clerkUserId"] == SEED_CLERK_USER


@pytest.mark.parametrize(
    "auth_header",
    [
        None,
        {"Authorization": "Basic abc"},
        {"Authorization": "Bearer"},
        {"Authorization": "Bearer   "},
    ],
)
def test_authenticate_rejects_invalid_auth_headers(auth_header):
    with pytest.raises(PermissionError):
        header_value = auth_header["Authorization"] if auth_header else None
        authenticate(header_value)


def test_test_token_ignored_when_auth_testing_disabled(monkeypatch):
    monkeypatch.setattr("app.services.auth.settings.auth_testing_enabled", False)
    with pytest.raises((PermissionError, jwt.exceptions.PyJWTError)):
        authenticate(f"Bearer test:{SEED_CLERK_USER}")
