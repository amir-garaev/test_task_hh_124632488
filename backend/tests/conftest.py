import sys, pathlib
import pytest
from typing import AsyncIterator

from httpx import AsyncClient, ASGITransport
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from sqlalchemy.pool import StaticPool

ROOT = pathlib.Path(__file__).resolve().parents[1]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from main import app
from app.db.connect import Base
from app.db.models import User
from app.db.deps import get_session
from app.utils.current import get_user

@pytest.fixture
def anyio_backend():
    return "asyncio"


@pytest.fixture
async def engine():
    import app.db.models

    eng = create_async_engine(
        "sqlite+aiosqlite:///:memory:",
        poolclass=StaticPool,
        connect_args={"check_same_thread": False},
    )
    async with eng.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    try:
        yield eng
    finally:
        await eng.dispose()

@pytest.fixture
async def session(engine) -> AsyncIterator[AsyncSession]:
    SessionLocal = async_sessionmaker(bind=engine, expire_on_commit=False)
    async with SessionLocal() as s:
        yield s
        await s.rollback()

def make_override_get_session(session: AsyncSession):
    async def _override_get_session():
        try:
            yield session
            await session.commit()
        except:
            await session.rollback()
            raise
    return _override_get_session

def make_override_get_user(session: AsyncSession):
    async def _override_get_user():
        user = await session.get(User, 1)
        if not user:
            user = User(id=1, email="test@example.com", password_hash="x")
            session.add(user)
            await session.flush()
        return user
    return _override_get_user


@pytest.fixture(autouse=True)
def _setup_overrides(session: AsyncSession):
    app.dependency_overrides[get_session] = make_override_get_session(session)
    app.dependency_overrides[get_user]    = make_override_get_user(session)
    yield
    app.dependency_overrides.clear()


@pytest.fixture
async def client() -> AsyncIterator[AsyncClient]:
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://testserver") as c:
        yield c
