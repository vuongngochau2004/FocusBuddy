import os
from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    PROJECT_NAME: str = "FocusBuddy AI Microservice"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api/v1"

    # API Keys
    GEMINI_API_KEY: str = os.getenv("GEMINI_API_KEY", "")
    OPENAI_API_KEY: str = os.getenv("OPENAI_API_KEY", "")

    # Custom OpenAI-compatible Server Settings (e.g. llm2.dutai.site)
    LLM_BASE_URL: str = os.getenv("LLM_BASE_URL", "")
    LLM_MODEL: str = os.getenv("LLM_MODEL", "")
    LLM_API_KEY: str = os.getenv("LLM_API_KEY", "")

    # Default Extractor Engine: "gemini_vision" | "custom_llm" | "paddle_ocr"
    TRANSCRIPT_EXTRACTOR_TYPE: str = os.getenv("TRANSCRIPT_EXTRACTOR_TYPE", "custom_llm")

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

settings = Settings()
