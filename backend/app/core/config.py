import os
from pathlib import Path

from pydantic_settings import BaseSettings

# Manually parse .env so we control case-normalisation and encoding.
# This runs before Settings() so pydantic-settings finds uppercase keys.
_env_path = Path(__file__).resolve().parent.parent.parent / ".env"
if _env_path.exists():
    with open(_env_path, encoding="utf-8-sig") as _f:   # utf-8-sig strips Windows BOM
        for _line in _f:
            _line = _line.strip()
            if not _line or _line.startswith("#") or "=" not in _line:
                continue
            _key, _, _val = _line.partition("=")
            _key = _key.strip().upper()          # DATABASE_URL regardless of original case
            _val = _val.strip().strip('"').strip("'")
            if _key:
                os.environ[_key] = _val          # always set — no setdefault


class Settings(BaseSettings):
    DATABASE_URL: str
    SECRET_KEY: str
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    GEMINI_API_KEY: str = ""
    GROQ_API_KEY: str = ""

    model_config = {"extra": "ignore"}


settings = Settings()
