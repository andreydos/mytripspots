"""Concurrent first-login bootstrap must not surface duplicate-key errors."""

from concurrent.futures import ThreadPoolExecutor

from fastapi.testclient import TestClient


def test_concurrent_bootstrap_same_clerk_user(client: TestClient) -> None:
    clerk_id = "race_bootstrap_user_01"
    headers = {"Authorization": f"Bearer test:{clerk_id}"}
    query = "{ me { clerkUserId email } }"

    def request_once() -> int:
        response = client.post("/graphql", json={"query": query}, headers=headers)
        body = response.json()
        if response.status_code != 200 or body.get("errors"):
            return -1
        return 0 if body["data"]["me"]["clerkUserId"] == clerk_id else -1

    with ThreadPoolExecutor(max_workers=8) as pool:
        outcomes = list(pool.map(lambda _: request_once(), range(8)))

    assert all(code == 0 for code in outcomes), f"unexpected outcomes: {outcomes}"