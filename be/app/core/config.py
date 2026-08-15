from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    DATABASE_URL : str
    AI_PROVIDER : str | None = None
    AI_MODEL : str | None = None
    AI_API_KEY : str | None = None
    
    class Config:
        env_file = ".env"
        extra = "ignore"

settings = Settings()