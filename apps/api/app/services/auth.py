from dataclasses import dataclass
from datetime import datetime, timezone
from typing import Any

import httpx
import jwt
from jwt import PyJWKClient
from sqlalchemy import select

from app.db.models import User
from app.db.session import SessionLocal
from app.settings import settings


@dataclass
class RequestUser:
    id: str
    clerk_user_id: str
    email: str | None
    display_name: str | None


def _extract_bearer_token(auth_header: str | None) -> str:
    if not auth_header:
        raise PermissionError("Missing Authorization header")
    if not auth_header.lower().startswith("bearer "):
        raise PermissionError("Invalid auth scheme")
    return auth_header.split(" ", 1)[1].strip()


def _decode_clerk_token(token: str) -> dict[str, Any]:
    jwk_client = PyJWKClient(settings.clerk_jwks_url)
    signing_key = jwk_client.get_signing_key_from_jwt(token)
    return jwt.decode(
        token,
        signing_key.key,
        algorithms=["RS256"],
        issuer=settings.clerk_issuer,
        options={"verify_aud": False},
    )


def bootstrap_user_from_claims(claims: dict[str, Any]) -> RequestUser:
    clerk_user_id = claims.get("sub")
    if not clerk_user_id:
        raise PermissionError("Token missing sub claim")

    primary_email = claims.get("email")
    display_name = claims.get("name") or claims.get("preferred_username")
    avatar_url = claims.get("picture")

    with SessionLocal() as session:
        existing = session.scalar(select(User).where(User.clerk_user_id == clerk_user_id))
        if existing:
            existing.email = primary_email
            existing.display_name = display_name
            existing.avatar_url = avatar_url
            existing.last_seen_at = datetime.now(timezone.utc)
            session.add(existing)
            session.commit()
            session.refresh(existing)
            return RequestUser(
                id=str(existing.id),
                clerk_user_id=existing.clerk_user_id,
                email=existing.email,
                display_name=existing.display_name,
            )

        created = User(
            clerk_user_id=clerk_user_id,
            email=primary_email,
            display_name=display_name,
            avatar_url=avatar_url,
            last_seen_at=datetime.now(timezone.utc),
        )
        session.add(created)
        session.commit()
        session.refresh(created)
        return RequestUser(
            id=str(created.id),
            clerk_user_id=created.clerk_user_id,
            email=created.email,
            display_name=created.display_name,
        )


def authenticate(auth_header: str | None) -> RequestUser:
    token = _extract_bearer_token(auth_header)
    claims = _decode_clerk_token(token)
    return bootstrap_user_from_claims(claims)
