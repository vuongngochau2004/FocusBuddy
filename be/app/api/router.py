from fastapi import APIRouter

api_router = APIRouter()

# TODO: Import and include module routers here later
# from app.api.v1.user_router import router as user_router
# api_router.include_router(user_router, prefix="/v1/users", tags=["Users"])

@api_router.get("/v1/ping", tags=["Health Check"])
async def ping():
    """
    Basic ping endpoint to check if API routing is working.
    """
    return {"ping": "pong!"}
