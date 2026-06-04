import os

import pytest
from fastapi.testclient import TestClient

os.environ.setdefault("AUTH_TESTING_ENABLED", "true")
os.environ.setdefault(
    "DATABASE_URL",
    "postgresql+psycopg://postgres:postgres@127.0.0.1:5432/mytripspots",
)
os.environ.setdefault("CLERK_JWKS_URL", "https://placeholder.clerk.example/.well-known/jwks.json")
os.environ.setdefault("CLERK_ISSUER", "https://placeholder.clerk.example")
os.environ.setdefault("APP_ENV", "development")

SEED_PLACE_ID = "33333333-3333-3333-3333-333333333333"
SEED_CLERK_USER = "user_demo_1"
TEST_AUTH_HEADER = {"Authorization": f"Bearer test:{SEED_CLERK_USER}"}


@pytest.fixture(scope="session")
def client() -> TestClient:
    from main import app

    return TestClient(app)


def graphql(client: TestClient, query: str, variables: dict | None = None, headers: dict | None = None):
    payload: dict = {"query": query}
    if variables is not None:
        payload["variables"] = variables
    return client.post("/graphql", json=payload, headers=headers or TEST_AUTH_HEADER)
