from fastapi import FastAPI
from app.middleware import setup_middleware
from app.routers import auth_router, resume_router

app = FastAPI(title="Resume App")

setup_middleware(app)

app.include_router(auth_router.router, prefix="/auth", tags=["auth"])
app.include_router(resume_router.router, prefix="/resume", tags=["resume"])
