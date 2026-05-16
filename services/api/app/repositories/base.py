from typing import Generic, TypeVar
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.base import Base

ModelT = TypeVar("ModelT", bound=Base)


class BaseRepository(Generic[ModelT]):
    """
    Generic async CRUD repository.
    Subclass and set `model` to get typed get/create/delete for free.
    """

    model: type[ModelT]

    def __init__(self, db: AsyncSession) -> None:
        self._db = db

    async def get_by_id(self, id: UUID | str) -> ModelT | None:
        result = await self._db.execute(
            select(self.model).where(self.model.id == id)  # type: ignore[attr-defined]
        )
        return result.scalar_one_or_none()

    async def create(self, instance: ModelT) -> ModelT:
        self._db.add(instance)
        await self._db.flush()
        await self._db.refresh(instance)
        return instance

    async def delete(self, instance: ModelT) -> None:
        await self._db.delete(instance)
        await self._db.flush()
