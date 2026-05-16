from fastapi import APIRouter

from app.api.deps import CurrentUser, DBSession
from app.schemas.scan import PaginatedScans

router = APIRouter()


@router.get("/summary")
async def get_summary(user: CurrentUser, db: DBSession) -> dict:
    raise NotImplementedError


@router.get("/trends")
async def get_trends(user: CurrentUser, db: DBSession) -> list:
    raise NotImplementedError
