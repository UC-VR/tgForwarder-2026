from pydantic_settings import BaseSettings
from typing import Optional

class Settings(BaseSettings):
    PROJECT_NAME: str = "tgForwarder-2026"
    
    # Database
    # Allow full URL override (common in cloud environments like Render)
    DATABASE_URL: Optional[str] = None

    POSTGRES_USER: str = "postgres"
    POSTGRES_PASSWORD: str = "password"
    POSTGRES_DB: str = "tgforwarder"
    POSTGRES_HOST: str = "db"
    POSTGRES_PORT: str = "5432"
    
    def get_database_url(self) -> str:
        if self.DATABASE_URL:
             # Ensure asyncpg driver is used if not specified
             if self.DATABASE_URL.startswith("postgresql://"):
                 return self.DATABASE_URL.replace("postgresql://", "postgresql+asyncpg://")
             return self.DATABASE_URL

        return f"postgresql+asyncpg://{self.POSTGRES_USER}:{self.POSTGRES_PASSWORD}@{self.POSTGRES_HOST}:{self.POSTGRES_PORT}/{self.POSTGRES_DB}"
    
    # Telegram
    TELEGRAM_API_ID: Optional[str] = None
    TELEGRAM_API_HASH: Optional[str] = None
    TELEGRAM_SESSION_STRING: Optional[str] = None
    
    class Config:
        env_file = ".env"
        case_sensitive = True

settings = Settings()
