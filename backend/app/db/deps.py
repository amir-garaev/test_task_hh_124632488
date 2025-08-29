from sqlalchemy.ext.asyncio import AsyncSession
from app.db.connect import AsyncSessionLocal
from typing import AsyncGenerator


async def get_session() -> AsyncGenerator[AsyncSession, None]:
    async with AsyncSessionLocal() as session:
        try:
            yield session
            await session.commit()
        except:
            await session.rollback()
            raise

