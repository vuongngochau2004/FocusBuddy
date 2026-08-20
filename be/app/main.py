from fastapi import FastAPI
from fastapi.responses import RedirectResponse
from fastapi.middleware.cors import CORSMiddleware
from app.api.router import api_router
from app.core.config import settings
from app.services.module_5_ai_chatbot.ai.tools import register_all_tools

# Khởi tạo Tools
register_all_tools()

app = FastAPI(
    title="FocusBuddy API",
    description="Backend API for FocusBuddy Application",
    version="1.0.0",
)

# CORS Middleware Setup
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, replace with specific origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include Master API Router
app.include_router(api_router, prefix="/api")

@app.get("/", include_in_schema=False)
async def root():
    return RedirectResponse(url="/docs")

@app.get("/health", tags=["Health Check"])
async def health_check():
    """
    Check the health status of the application.
    """
    return {"status": "ok", "message": "FocusBuddy API is running"}
