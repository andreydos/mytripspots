from sqlalchemy import select

from app.db.models import User
from app.db.session import SessionLocal
from app.services.auth import bootstrap_user_from_claims
from tests.conftest import SEED_CLERK_USER


def test_bootstrap_preserves_profile_when_claims_omit_fields():
    clerk_user_id = f"{SEED_CLERK_USER}_profile_preserve"

    bootstrap_user_from_claims(
        {
            "sub": clerk_user_id,
            "email": "alice@example.com",
            "name": "Alice",
            "picture": "https://example.com/a.png",
        }
    )

    bootstrap_user_from_claims({"sub": clerk_user_id})

    with SessionLocal() as session:
        user = session.scalar(select(User).where(User.clerk_user_id == clerk_user_id))
        assert user is not None
        assert user.email == "alice@example.com"
        assert user.display_name == "Alice"
        assert user.avatar_url == "https://example.com/a.png"
