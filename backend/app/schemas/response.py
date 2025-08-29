from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, ConfigDict

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"

class PageMeta(BaseModel):
    page: int
    per_page: int
    total: int
    total_pages: int
    has_next: bool
    has_prev: bool

class ResumeOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    title: str
    content: str

class ResumePage(BaseModel):
    items: List[ResumeOut]
    meta: PageMeta

class ResumeRevisionOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    resume_id: int
    version: int
    content: str
    comment: Optional[str] = None
    created_at: datetime

class ResumeRevisionPage(BaseModel):
    items: List[ResumeRevisionOut]
    meta: PageMeta
