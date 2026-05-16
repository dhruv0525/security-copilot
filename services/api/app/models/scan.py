import uuid

from sqlalchemy import Float, ForeignKey, Integer, String, Text
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, TimestampMixin


class ScanResult(Base, TimestampMixin):
    __tablename__ = "scan_results"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    url: Mapped[str] = mapped_column(Text, nullable=False)
    domain: Mapped[str] = mapped_column(String(255), nullable=False, index=True)

    # Trust score summary (denormalised for fast list queries)
    trust_score: Mapped[float] = mapped_column(Float, nullable=False)
    risk_level: Mapped[str] = mapped_column(String(20), nullable=False)
    dominant_category: Mapped[str | None] = mapped_column(String(50))

    # Full analysis payload stored as JSONB — avoids complex joins for detail view
    analysis_payload: Mapped[dict] = mapped_column(JSONB, nullable=False)

    analysis_duration_ms: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    was_cached: Mapped[bool] = mapped_column(default=False, nullable=False)

    user: Mapped["User"] = relationship("User", back_populates="scans")  # noqa: F821

    def __repr__(self) -> str:
        return f"<ScanResult id={self.id} domain={self.domain} score={self.trust_score}>"
