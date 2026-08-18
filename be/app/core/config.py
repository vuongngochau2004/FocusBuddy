from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    DATABASE_URL : str
    REDIS_URL: str | None = None
    CELERY_BROKER_URL: str | None = None
    CELERY_RESULT_BACKEND: str | None = None
    LLM_BASE_URL : str | None = None
    LLM_MODEL : str | None = None
    LLM_API_KEY : str | None = None
    LLM_TIMEOUT : int = 60
    LLM_TEMPERATURE : float = 0.7
    
    class Config:
        env_file = ".env"
        extra = "ignore"

settings = Settings()