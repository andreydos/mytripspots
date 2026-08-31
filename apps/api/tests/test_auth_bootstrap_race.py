from concurrent.futures import ThreadPoolExecutor

from app.services.auth import bootstrap_user_from_claims


def test_bootstrap_user_from_claims_handles_concurrent_create():
    clerk_user_id = "race_test_user_concurrent"
    claims = {
        "sub": clerk_user_id,
        "email": f"{clerk_user_id}@test.local",
        "name": "Race Test",
    }

    def create_user():
        return bootstrap_user_from_claims(claims)

    with ThreadPoolExecutor(max_workers=4) as pool:
        results = list(pool.map(lambda _: create_user(), range(4)))

    user_ids = {user.id for user in results}
    assert len(user_ids) == 1
    assert all(user.clerk_user_id == clerk_user_id for user in results)
