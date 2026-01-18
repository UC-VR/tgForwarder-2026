from pydantic_settings import BaseSettings
from typing import Optional
import os
from dotenv import load_dotenv

load_dotenv()

class Settings(BaseSettings):
    PROJECT_NAME: str = "tgForwarder-2026"
    
    # Database
    POSTGRES_USER: str = "postgres"
    POSTGRES_PASSWORD: str = "password"
    POSTGRES_DB: str = "tgforwarder"
    POSTGRES_HOST: str = "db"
    POSTGRES_PORT: str = "5432"
    
    # Render provides DATABASE_URL directly. We can use it if available.
    # Otherwise we construct it from components.
    _DATABASE_URL: Optional[str] = None

    @property
    def DATABASE_URL(self) -> str:
        # Check if DATABASE_URL env var is set (e.g. by Render)
        url = os.getenv("DATABASE_URL")
        if url:
            # Fix for SQLAlchemy asyncpg: replace postgres:// with postgresql+asyncpg://
            if url.startswith("postgres://"):
                url = url.replace("postgres://", "postgresql+asyncpg://", 1)
            return url

        return f"postgresql+asyncpg://{self.POSTGRES_USER}:{self.POSTGRES_PASSWORD}@{self.POSTGRES_HOST}:{self.POSTGRES_PORT}/{self.POSTGRES_DB}"
    
    # Telegram
    TELEGRAM_API_ID: Optional[str] = None
    TELEGRAM_API_HASH: Optional[str] = None
    
    class Config:
        env_file = ".env"
        case_sensitive = True
        extra = "ignore" # Ignore extra env vars (like Render's platform vars)

settings = Settings()
