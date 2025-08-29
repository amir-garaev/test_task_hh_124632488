from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.ext.asyncio import AsyncSession
from app.utils.auth import decode_token
from app.db.deps import get_session
from app.db.models import User
from sqlalchemy import select
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")

async def get_user(
    token: str = Depends(oauth2_scheme),
    db: AsyncSession = Depends(get_session),
) -> User:
    try:
        payload = decode_token(token)  # sync ок
        email: str | None = payload.get("sub")
        if not email:
            raise ValueError("empty sub")
    except Exception:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")

    # 2) ищем пользователя в БД (async)
    stmt = select(User).where(User.email == email)
    result = await db.execute(stmt)
    user = result.scalars().first()

    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found")

    return user