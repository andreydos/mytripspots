from pydantic_settings import BaseSettings, SettingsConfigDict


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


settings = Settings()
