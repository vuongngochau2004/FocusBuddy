import os

try:
    from pydantic_settings import BaseSettings
    class Settings(BaseSettings):
        PROJECT_NAME: str = "FocusBuddy AI Service"
        PORT: int = 8001
        OCR_LANG: str = "vi"
        PADDLE_SHOW_LOG: bool = False

        class Config:
            env_file = ".env"
            extra = "ignore"
except ImportError:
    from pydantic import BaseModel
    class Settings(BaseModel):
        PROJECT_NAME: str = os.getenv("PROJECT_NAME", "FocusBuddy AI Service")
        PORT: int = int(os.getenv("PORT", "8001"))
        OCR_LANG: str = os.getenv("OCR_LANG", "vi")
        PADDLE_SHOW_LOG: bool = os.getenv("PADDLE_SHOW_LOG", "False").lower() in ("true", "1")

settings = Settings()

