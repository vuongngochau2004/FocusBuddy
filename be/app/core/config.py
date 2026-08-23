from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    DATABASE_URL : str
    REDIS_URL: str | None = None
    CELERY_BROKER_URL: str | None = None
    CELERY_RESULT_BACKEND: str | None = None
    LLM_PROVIDER: str = "ollama"
    OLLAMA_BASE_URL: str
    OLLAMA_MODEL_QWEN: str
    LLM_BASE_URL: str
    LLM_MODEL: str
    LLM_API_KEY: str
    LLM_TIMEOUT: int = 60
    LLM_TEMPERATURE: float = 0.7
    
    # Environment & Authentication Settings
    ENVIRONMENT: str = "development"
    AUTH_SECRET_KEY: str = "focusbuddy_super_secret_jwt_key_32_characters_long_min"
    AUTH_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440
    ALLOW_DEV_HEADER_AUTH: bool = True
    
    class Config:
        env_file = ".env"
        extra = "ignore"

settings = Settings()