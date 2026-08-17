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
    CUSTOM_LLM_BASE_URL: str = os.getenv("CUSTOM_LLM_BASE_URL", "https://llm2.dutai.site/v1")
    CUSTOM_LLM_MODEL: str = os.getenv("CUSTOM_LLM_MODEL", "ggml-org/gemma-4-e4b-it-GGUF:Q4_0")
    CUSTOM_LLM_API_KEY: str = os.getenv("CUSTOM_LLM_API_KEY", "not-needed")

    # Default Extractor Engine: "gemini_vision" | "custom_llm" | "paddle_ocr"
    TRANSCRIPT_EXTRACTOR_TYPE: str = os.getenv("TRANSCRIPT_EXTRACTOR_TYPE", "custom_llm")

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

settings = Settings()
