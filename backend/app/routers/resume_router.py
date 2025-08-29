from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.deps import get_session
from app.db.models import User, Resume, ResumeRevision
from app.schemas.requests import ResumeCreate, ResumeUpdate
from app.schemas.response import (
    ResumeOut, ResumePage, PageMeta,
    ResumeRevisionPage,
)
from app.utils.current import get_user
import logging
logger = logging.getLogger(__name__)
router = APIRouter()
@router.post(
    "",
    response_model=ResumeOut,
    status_code=status.HTTP_201_CREATED,
    summary="Create a resume",
    description="Create a new resume for the current user and return the created entity."
)
async def create_resume(
    data: ResumeCreate,
    db: AsyncSession = Depends(get_session),
    user: User = Depends(get_user),
):
    logger.info("Create resume requested by user=%s, title=%r", user.id, data.title)
    r = Resume(title=data.title, content=data.content, user_id=user.id)
    db.add(r)
    await db.flush()
    await db.refresh(r)
    logger.info("Resume created: id=%s by user=%s", r.id, user.id)
    return r


@router.get(
    "",
    response_model=ResumePage,
    summary="List resumes (with search & pagination)",
    description="List current user's resumes with optional title search (`q`) and pagination (`page`, `per_page`)."
)
async def list_resumes(
    page: int = Query(1, ge=1),
    per_page: int = Query(10, ge=1, le=100),
    q: str | None = Query(None, description="Title search (case-insensitive)"),
    db: AsyncSession = Depends(get_session),
    user: User = Depends(get_user),
):
    offset = (page - 1) * per_page

    filters = [Resume.user_id == user.id]
    if q:
        filters.append(Resume.title.ilike(f"%{q}%"))

    total = await db.scalar(
        select(func.count()).select_from(Resume).where(*filters)
    ) or 0

    stmt = (
        select(Resume)
        .where(*filters)
        .order_by(Resume.id.desc())
        .limit(per_page)
        .offset(offset)
    )
    items = (await db.execute(stmt)).scalars().all()

    total_pages = (total + per_page - 1) // per_page if per_page else 1
    meta = PageMeta(
        page=page, per_page=per_page, total=total, total_pages=total_pages,
        has_next=page < total_pages, has_prev=page > 1,
    )

    logger.info(
        "List resumes: user=%s q=%r page=%s per_page=%s total=%s returned=%s",
        user.id, q, page, per_page, total, len(items)
    )
    return {"items": items, "meta": meta}


@router.get(
    "/{resume_id}/history",
    response_model=ResumeRevisionPage,
    summary="Get resume history (paginated)",
    description="Return paginated change history (revisions) for the given resume belonging to the current user."
)
async def list_resume_history(
    resume_id: int,
    page: int = Query(1, ge=1),
    per_page: int = Query(10, ge=1, le=100),
    db: AsyncSession = Depends(get_session),
    user: User = Depends(get_user),
):
    exists_stmt = select(func.count()).select_from(Resume).where(
        Resume.id == resume_id, Resume.user_id == user.id
    )
    if not await db.scalar(exists_stmt):
        logger.warning("History requested for non-owned/missing resume: user=%s resume_id=%s", user.id, resume_id)
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Not found")

    offset = (page - 1) * per_page

    total = await db.scalar(
        select(func.count()).select_from(ResumeRevision).where(ResumeRevision.resume_id == resume_id)
    ) or 0

    items_stmt = (
        select(ResumeRevision)
        .where(ResumeRevision.resume_id == resume_id)
        .order_by(ResumeRevision.version.desc())
        .limit(per_page)
        .offset(offset)
    )
    items = (await db.execute(items_stmt)).scalars().all()

    total_pages = (total + per_page - 1) // per_page if per_page else 1
    meta = PageMeta(
        page=page, per_page=per_page, total=total, total_pages=total_pages,
        has_next=page < total_pages, has_prev=page > 1
    )

    logger.info(
        "History: user=%s resume_id=%s page=%s per_page=%s total=%s returned=%s",
        user.id, resume_id, page, per_page, total, len(items)
    )
    return {"items": items, "meta": meta}


@router.get(
    "/{resume_id}",
    response_model=ResumeOut,
    summary="Get a single resume",
    description="Return a single resume by id for the current user."
)
async def get_resume(
    resume_id: int,
    db: AsyncSession = Depends(get_session),
    user: User = Depends(get_user),
):
    stmt = select(Resume).where(Resume.id == resume_id, Resume.user_id == user.id)
    r = (await db.execute(stmt)).scalars().first()
    if not r:
        logger.warning("Get resume: not found or not owned; user=%s resume_id=%s", user.id, resume_id)
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Not found")
    logger.info("Get resume: user=%s resume_id=%s", user.id, resume_id)
    return r


@router.patch(
    "/{resume_id}",
    response_model=ResumeOut,
    summary="Update a resume (with history snapshot)",
    description="Update title/content of a resume. The previous content is snapshotted into history and the version is incremented."
)
async def update_resume(
    resume_id: int,
    data: ResumeUpdate,
    db: AsyncSession = Depends(get_session),
    user: User = Depends(get_user),
):
    stmt = (
        select(Resume)
        .where(Resume.id == resume_id, Resume.user_id == user.id)
        .with_for_update()
    )
    r = (await db.execute(stmt)).scalars().first()
    if not r:
        logger.warning("Update resume: not found or not owned; user=%s resume_id=%s", user.id, resume_id)
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Not found")

    db.add(
        ResumeRevision(
            resume_id=r.id,
            version=r.version,
            content=r.content,
        )
    )

    before_title, before_len = r.title, len(r.content or "")

    if data.title is not None:
        r.title = data.title
    if data.content is not None:
        r.content = data.content

    r.version += 1
    await db.flush()
    await db.refresh(r)

    logger.info(
        "Updated resume: user=%s resume_id=%s v->%s title %r→%r content_len %s→%s",
        user.id, resume_id, r.version, before_title, r.title, before_len, len(r.content or "")
    )
    return r


@router.delete(
    "/{resume_id}",
    summary="Delete a resume",
    description="Delete a resume owned by the current user."
)
async def delete_resume(
    resume_id: int,
    db: AsyncSession = Depends(get_session),
    user: User = Depends(get_user),
):
    stmt = select(Resume).where(Resume.id == resume_id, Resume.user_id == user.id)
    r = (await db.execute(stmt)).scalars().first()
    if not r:
        logger.warning("Delete resume: not found or not owned; user=%s resume_id=%s", user.id, resume_id)
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Not found")

    await db.delete(r)
    logger.info("Deleted resume: user=%s resume_id=%s", user.id, resume_id)
    return {"ok": True}


@router.post(
    "/{resume_id}/improve",
    response_model=ResumeOut,
    summary="Improve a resume (and snapshot previous)",
    description="Apply an automatic improvement to the resume content. The previous content is stored as a new revision and the version is incremented."
)
async def improve_resume(
    resume_id: int,
    db: AsyncSession = Depends(get_session),
    user: User = Depends(get_user),
):
    stmt = (
        select(Resume)
        .where(Resume.id == resume_id, Resume.user_id == user.id)
        .with_for_update()
    )
    r = (await db.execute(stmt)).scalars().first()
    if not r:
        logger.warning("Improve resume: not found or not owned; user=%s resume_id=%s", user.id, resume_id)
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Not found")

    db.add(ResumeRevision(
        resume_id=r.id,
        version=r.version,
        content=r.content,
    ))

    before_len = len(r.content or "")
    r.content = (r.content or "") + " [Improved]"
    r.version += 1

    await db.flush()
    await db.refresh(r)

    logger.info(
        "Improved resume: user=%s resume_id=%s v->%s content_len %s→%s",
        user.id, resume_id, r.version, before_len, len(r.content or "")
    )
    return r