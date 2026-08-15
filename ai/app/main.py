from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.modules.ocr import ocr_router

app = FastAPI(
    title=settings.PROJECT_NAME,
    description="AI Microservice for FocusBuddy (OCR, PP-Structure, LLM, Recommendation)",
    version="1.0.0",
)

# CORS Setup
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include Routers
app.include_router(ocr_router, prefix="/api/v1")

@app.get("/health", tags=["Health Check"])
async def health_check():
    return {
        "status": "ok",
        "service": settings.PROJECT_NAME,
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=settings.PORT, reload=True)
