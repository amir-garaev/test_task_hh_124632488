from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy import Integer, String, Text, ForeignKey, UniqueConstraint
from app.db.connect import Base
from app.db.models.mixins import TimestampMixin

class Resume(TimestampMixin, Base):
    __tablename__ = "resumes"
    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    content: Mapped[str] = mapped_column(Text, nullable=False)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), nullable=False)

    version: Mapped[int] = mapped_column(Integer, nullable=False, default=1)
    __mapper_args__ = {"version_id_col": version}

    revisions: Mapped[list["ResumeRevision"]] = relationship(
        "ResumeRevision",
        back_populates="resume",
        cascade="all, delete-orphan",
        passive_deletes=True,
        order_by="ResumeRevision.version.asc()",
    )

    owner = relationship("User", back_populates="resumes")


class ResumeRevision(TimestampMixin, Base):
    __tablename__ = "resume_revisions"
    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    resume_id: Mapped[int] = mapped_column(ForeignKey("resumes.id", ondelete="CASCADE"), index=True, nullable=False)
    version: Mapped[int] = mapped_column(Integer, nullable=False)
    content: Mapped[str] = mapped_column(Text, nullable=False)

    resume: Mapped["Resume"] = relationship("Resume", back_populates="revisions")

    __table_args__ = (
        UniqueConstraint("resume_id", "version", name="uq_resume_revisions_resume_id_version"),
    )
