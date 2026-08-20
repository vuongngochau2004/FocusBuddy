from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    DATABASE_URL : str
    REDIS_URL: str | None = None
    CELERY_BROKER_URL: str | None = None
    CELERY_RESULT_BACKEND: str | None = None
    LLM_PROVIDER: str = "ollama"
    OLLAMA_BASE_URL: str
    OLLAMA_MODEL_QWEN: str
    OLLAMA_MODEL_GEMMA: str
    LLM_TIMEOUT: int = 60
    LLM_TEMPERATURE: float = 0.7
    
    class Config:
        env_file = ".env"
        extra = "ignore"

settings = Settings()