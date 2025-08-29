from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.db.deps import get_session
from app.db.models import User
from app.schemas.requests import RegisterRequest
from app.schemas.response import TokenResponse
from app.utils.auth import verify_password, make_access_token, hash_password
import logging
logger = logging.getLogger(__name__)

router = APIRouter()


@router.post(
    "/register",
    response_model=TokenResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Register a new user",
    description="""
    Create a new user account with email and password.
    Returns a JWT access token after successful registration.
    """,
    tags=["auth"],
)
async def register(
    data: RegisterRequest,
    db: AsyncSession = Depends(get_session),
):
    logger.info("Register attempt: %s", data.email)

    stmt = select(User).where(User.email == data.email)
    result = await db.execute(stmt)
    existing = result.scalars().first()
    if existing:
        logger.warning("Registration failed, email already registered: %s", data.email)
        raise HTTPException(status_code=400, detail="Email already registered")

    user = User(email=data.email, password_hash=hash_password(data.password))
    db.add(user)
    await db.flush()

    token = make_access_token(user.email)
    logger.info("User registered successfully: %s", data.email)

    return TokenResponse(access_token=token)


@router.post(
    "/login",
    response_model=TokenResponse,
    summary="User login",
    description="""
    Authenticate a user with email and password.
    Returns a JWT access token if the credentials are valid.
    """,
    tags=["auth"],
)
async def login(
    data: RegisterRequest,
    db: AsyncSession = Depends(get_session),
):
    logger.info("Login attempt: %s", data.email)

    stmt = select(User).where(User.email == data.email)
    result = await db.execute(stmt)
    user = result.scalars().first()

    if not user or not verify_password(data.password, user.password_hash):
        logger.warning("Login failed for: %s", data.email)
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid credentials",
        )

    token = make_access_token(user.email)
    logger.info("Login successful: %s", data.email)

    return TokenResponse(access_token=token)
