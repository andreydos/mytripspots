from datetime import timedelta
from uuid import uuid4

import boto3
from botocore.client import Config

from app.settings import settings

ALLOWED_MIME_TYPES = {"image/jpeg", "image/png", "image/webp"}


def _s3_client():
    return boto3.client(
        "s3",
        endpoint_url=settings.r2_endpoint_url,
        aws_access_key_id=settings.r2_access_key_id,
        aws_secret_access_key=settings.r2_secret_access_key,
        region_name=settings.r2_region,
        config=Config(signature_version="s3v4"),
    )


def validate_upload_request(mime: str, size_bytes: int) -> None:
    if mime not in ALLOWED_MIME_TYPES:
        raise ValueError("Unsupported mime type")
    if size_bytes > settings.upload_max_mb * 1024 * 1024:
        raise ValueError(f"File exceeds {settings.upload_max_mb} MB limit")


def generate_owner_key(owner_id: str, ext: str) -> str:
    return f"user/{owner_id}/{uuid4()}.{ext}"


def create_presigned_put_url(key: str, mime: str, expires_minutes: int = 5) -> str:
    return _s3_client().generate_presigned_url(
        "put_object",
        Params={"Bucket": settings.r2_bucket, "Key": key, "ContentType": mime},
        ExpiresIn=int(timedelta(minutes=expires_minutes).total_seconds()),
    )


def head_object(key: str) -> dict:
    return _s3_client().head_object(Bucket=settings.r2_bucket, Key=key)
