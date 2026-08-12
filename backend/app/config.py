"""
Application configuration loaded from environment variables.
Uses pydantic-settings to validate and type-check all config values.
"""

from pydantic_settings import BaseSettings
from typing import List


class Settings(BaseSettings):
    """Application settings loaded from .env file."""

    # JWT Configuration
    SECRET_KEY: str = "your-secret-key-change-this-to-a-random-string"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60

    # Database
    DATABASE_URL: str = "sqlite:///./malware_detection.db"

    # CORS
    ALLOWED_ORIGINS: str = "http://localhost:3000,http://127.0.0.1:3000,http://localhost:5173,http://127.0.0.1:5173,http://localhost:5174,http://127.0.0.1:5174,http://localhost:8080,http://127.0.0.1:8080,http://localhost:8000,http://127.0.0.1:8000"

    # VirusTotal (optional — hash lookup only when key is set)
    VIRUSTOTAL_API_KEY: str = ""
    VIRUSTOTAL_TIMEOUT_SECONDS: float = 30.0

    # YARA
    YARA_RULES_PATH: str = "app/yara_rules/demo_rules.yar"

    # File Upload
    MAX_FILE_SIZE_MB: int = 50
    ALLOWED_EXTENSIONS: str = ".exe,.dll,.bin,.com"
    UPLOAD_DIR: str = "uploads"

    # MalConv AI Scanner
    MALCONV_MODEL_REPO: str = "cycloevan/malconv"
    MALCONV_WEIGHTS_FILE: str = "models/malconv_model.h5"
    MALCONV_MAX_BYTES: int = 2000000
    ENABLE_AI_SCANNER: bool = True

    # Groq Chatbot (optional - uses httpx, no SDK)
    GROQ_API_KEY: str = ""
    GROQ_MODEL: str = "llama-3.1-8b-instant"
    GROQ_TIMEOUT_SECONDS: float = 30.0

    # GNews API (optional - for news)
    GNEWS_API_KEY: str = ""
    GNEWS_TIMEOUT_SECONDS: float = 10.0

    @property
    def database_url(self) -> str:
        """Fallback to default database URL if env var is empty."""
        if self.DATABASE_URL:
            return self.DATABASE_URL
        return "sqlite:///./malware_detection.db"

    @property
    def max_file_size_bytes(self) -> int:
        """Convert MB limit to bytes."""
        return self.MAX_FILE_SIZE_MB * 1024 * 1024

    @property
    def allowed_extensions_list(self) -> List[str]:
        """Parse comma-separated extensions into a list."""
        return [ext.strip().lower() for ext in self.ALLOWED_EXTENSIONS.split(",")]

    @property
    def allowed_origins_list(self) -> List[str]:
        """Parse comma-separated origins into a list."""
        return [origin.strip() for origin in self.ALLOWED_ORIGINS.split(",")]

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"


# Singleton settings instance
settings = Settings()
