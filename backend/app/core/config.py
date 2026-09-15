import os
from typing import List
from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    PROJECT_NAME: str = "NER-MargDarshak"
    API_V1_STR: str = "/api/v1"
    
    # JWT Secrets & Security
    SECRET_KEY: str = "ner-margdarshak-secret-super-key-2026-secure-token-engine-994ab491"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 # 1 hour
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7 # 7 days
    
    # Password Reset Token Expire
    RESET_TOKEN_EXPIRE_MINUTES: int = 15
    
    # Rate Limiting
    MAX_FAILED_LOGIN_ATTEMPTS: int = 5
    LOCKOUT_DURATION_MINUTES: int = 15
    
    # Database
    DATABASE_URL: str = "sqlite+aiosqlite:///./ner_margdarshak.db"
    
    # CORS
    BACKEND_CORS_ORIGINS: List[str] = [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:3001",
        "http://127.0.0.1:3001",
    ]

    model_config = SettingsConfigDict(case_sensitive=True, env_file=".env", extra="ignore")

settings = Settings()
