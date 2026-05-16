from uuid import UUID

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.scan import ScanResult
from app.repositories.base import BaseRepository


class ScanRepository(BaseRepository[ScanResult]):
    model = ScanResult

    def __init__(self, db: AsyncSession) -> None:
        super().__init__(db)

    async def list_for_user(
        self,
        user_id: UUID,
        page: int = 1,
        page_size: int = 20,
    ) -> tuple[list[ScanResult], int]:
        offset = (page - 1) * page_size

        count_q = select(func.count()).select_from(ScanResult).where(
            ScanResult.user_id == user_id
        )
        total: int = (await self._db.execute(count_q)).scalar_one()

        rows_q = (
            select(ScanResult)
            .where(ScanResult.user_id == user_id)
            .order_by(ScanResult.created_at.desc())
            .offset(offset)
            .limit(page_size)
        )
        items = list((await self._db.execute(rows_q)).scalars().all())

        return items, total

    async def list_flagged_for_user(
        self,
        user_id: UUID,
        min_risk_level: str = "high",
        limit: int = 50,
    ) -> list[ScanResult]:
        risk_order = {"critical": 0, "high": 1, "medium": 2, "low": 3, "safe": 4}
        cutoff = risk_order.get(min_risk_level, 1)
        risky_levels = [k for k, v in risk_order.items() if v <= cutoff]

        q = (
            select(ScanResult)
            .where(
                ScanResult.user_id == user_id,
                ScanResult.risk_level.in_(risky_levels),
            )
            .order_by(ScanResult.trust_score.asc())
            .limit(limit)
        )
        return list((await self._db.execute(q)).scalars().all())
