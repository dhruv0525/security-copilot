from pydantic import BaseModel


class ErrorResponse(BaseModel):
    error: str
    detail: str | None = None
    request_id: str | None = None


class PaginationMeta(BaseModel):
    page: int
    page_size: int
    total: int
    has_next: bool
