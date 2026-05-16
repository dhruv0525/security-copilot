from fastapi import APIRouter

from app.api.deps import CurrentUser, DBSession

router = APIRouter()


@router.get("")
async def list_flagged(user: CurrentUser, db: DBSession) -> list:
    raise NotImplementedError
