from pydantic_settings import BaseSettings, SettingsConfigDict

_DEV_CORS_FALLBACK = (
    "http://localhost:3000,http://127.0.0.1:3000,"
    "http://localhost:3001,http://127.0.0.1:3001"
)


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8")

    app_env: str = "development"
    api_host: str = "0.0.0.0"
    api_port: int = 8000

    database_url: str

    clerk_jwks_url: str
    clerk_issuer: str

    r2_account_id: str = ""
    r2_access_key_id: str = ""
    r2_secret_access_key: str = ""
    r2_bucket: str = ""
    r2_region: str = "auto"
    r2_endpoint_url: str = ""
    r2_public_base_url: str = ""
    upload_max_mb: int = 4

    nominatim_base_url: str = "https://nominatim.openstreetmap.org"

    # Env: CORS_ALLOWED_ORIGINS (comma-separated). Required in production. In development, local Next.js origins are always included in addition to any origins listed here.
    cors_allowed_origins: str = ""

    def cors_origins_list(self) -> list[str]:
        raw = self.cors_allowed_origins.strip()
        if self.app_env.lower() in ("production", "prod"):
            return [o.strip() for o in raw.split(",") if o.strip()]
        from_env = [o.strip() for o in raw.split(",") if o.strip()]
        dev = [o.strip() for o in _DEV_CORS_FALLBACK.split(",") if o.strip()]
        if not from_env:
            return dev
        # Merge: a production-style origin in .env should not drop local Next.js ports.
        seen: set[str] = set()
        merged: list[str] = []
        for origin in from_env + dev:
            if origin and origin not in seen:
                seen.add(origin)
                merged.append(origin)
        return merged


settings = Settings()
