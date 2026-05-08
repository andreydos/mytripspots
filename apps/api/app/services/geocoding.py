from collections.abc import Mapping
from functools import lru_cache

import httpx

from app.settings import settings


@lru_cache(maxsize=512)
def geocode(query: str) -> list[Mapping]:
    with httpx.Client(timeout=8.0) as client:
        response = client.get(
            f"{settings.nominatim_base_url}/search",
            params={"q": query, "format": "jsonv2", "limit": 5},
            headers={"User-Agent": "travel-pwa/0.1"},
        )
        response.raise_for_status()
        return response.json()


@lru_cache(maxsize=512)
def reverse_geocode(lat: float, lng: float) -> Mapping:
    with httpx.Client(timeout=8.0) as client:
        response = client.get(
            f"{settings.nominatim_base_url}/reverse",
            params={"lat": lat, "lon": lng, "format": "jsonv2"},
            headers={"User-Agent": "travel-pwa/0.1"},
        )
        response.raise_for_status()
        return response.json()
