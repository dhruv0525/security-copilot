import time
import logging
from typing import Annotated
from urllib.parse import urlparse

from fastapi import APIRouter, Query

from app.api.deps import CacheDep, CurrentUser, DBSession
from app.models.scan import ScanResult
from app.repositories.scan_repo import ScanRepository
from app.schemas.scan import (
    PaginatedScans,
    ScanRequest,
    ScanResponse,
    TrustScoreSchema,
)
from app.services.intelligence.engine import (
    ScanContext,
    run_intelligence_scan,
)

logger = logging.getLogger(__name__)
router = APIRouter()


@router.post("", response_model=ScanResponse, status_code=201)
async def create_scan(
    body: ScanRequest,
    db: DBSession,
    cache: CacheDep,
    user: CurrentUser,
) -> ScanResponse:
    start_time = time.time()
    logger.info("[SCANS] create_scan user=%s url=%s", user.id, body.url)

    scan_context = ScanContext(
        url=str(body.url),
        page_text=body.page_text,
        page_title=body.page_title,
        external_link_count=body.external_link_count or 0,
        form_count=body.form_count or 0,
    )

    intelligence_result = await run_intelligence_scan(
        scan_context,
        cache=cache,
    )

    trust_score = TrustScoreSchema(
        score=intelligence_result.trust_score,
        level=intelligence_result.risk_level,
        dominant_category=None,
        issues=[],
        explanation=intelligence_result.recommendation,
        signals=intelligence_result.signals,
        recommendation=intelligence_result.recommendation,
        confidence=intelligence_result.confidence,
    )

    duration_ms = int((time.time() - start_time) * 1000)
    domain = urlparse(str(body.url)).netloc or str(body.url)

    payload = trust_score.model_dump(mode="json")
    payload["domain_info"] = (
        intelligence_result.domain_info.model_dump()
        if intelligence_result.domain_info
        else None
    )
    payload["reputation"] = (
        intelligence_result.reputation.model_dump()
        if intelligence_result.reputation
        else None
    )
    payload["ssl_info"] = (
        intelligence_result.ssl_info.model_dump()
        if intelligence_result.ssl_info
        else None
    )

    repo = ScanRepository(db)
    new_scan = ScanResult(
        user_id=user.id,
        url=str(body.url),
        domain=domain,
        trust_score=trust_score.score,
        risk_level=trust_score.level,
        dominant_category=trust_score.dominant_category,
        analysis_payload=payload,
        analysis_duration_ms=duration_ms,
        was_cached=False,
    )

    try:
        await repo.create(new_scan)
        await db.commit()
        logger.info("[SCANS] persisted scan_id=%s", new_scan.id)
    except Exception as exc:
        logger.error("[SCANS] DB persistence failed: %s", exc)
        await db.rollback()

    return ScanResponse(
        id=str(new_scan.id) if getattr(new_scan, "id", None) else "ephemeral",
        url=str(body.url),
        domain=domain,
        scanned_at=str(int(time.time())),
        trust_score=trust_score,
        cached=False,
        analysis_duration_ms=duration_ms,
        domain_info=(
            intelligence_result.domain_info.model_dump()
            if intelligence_result.domain_info
            else None
        ),
        reputation=(
            intelligence_result.reputation.model_dump()
            if intelligence_result.reputation
            else None
        ),
        ssl_info=(
            intelligence_result.ssl_info.model_dump()
            if intelligence_result.ssl_info
            else None
        ),
    )


@router.get("", response_model=PaginatedScans)
async def list_scans(
    db: DBSession,
    user: CurrentUser,
    page: Annotated[int, Query(ge=1)] = 1,
    page_size: Annotated[int, Query(ge=1, le=100)] = 20,
) -> PaginatedScans:
    repo = ScanRepository(db)
    items, total = await repo.list_for_user(user.id, page=page, page_size=page_size)
    return PaginatedScans(
        items=[
            {
                "id": str(s.id),
                "url": s.url,
                "domain": s.domain,
                "scanned_at": str(int(s.created_at.timestamp())),
                "score": s.trust_score,
                "level": s.risk_level,
                "dominant_category": s.dominant_category,
                "confidence": (s.analysis_payload or {}).get("confidence", "medium"),
            }
            for s in items
        ],
        total=total,
        page=page,
        page_size=page_size,
        has_next=(page * page_size) < total,
    )


@router.get("/{scan_id}", response_model=ScanResponse)
async def get_scan(
    scan_id: str,
    db: DBSession,
    user: CurrentUser,
) -> ScanResponse:
    repo = ScanRepository(db)
    scan = await repo.get_by_id(scan_id)
    if scan is None or scan.user_id != user.id:
        from fastapi import HTTPException, status
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Scan not found")

    payload = scan.analysis_payload or {}
    trust_score = TrustScoreSchema(
        score=scan.trust_score,
        level=scan.risk_level,
        dominant_category=scan.dominant_category,
        issues=payload.get("issues", []),
        explanation=payload.get("explanation", ""),
        signals=payload.get("signals", []),
        recommendation=payload.get("recommendation", ""),
        confidence=payload.get("confidence", "medium"),
    )
    return ScanResponse(
        id=str(scan.id),
        url=scan.url,
        domain=scan.domain,
        scanned_at=str(int(scan.created_at.timestamp())),
        trust_score=trust_score,
        cached=True,
        analysis_duration_ms=scan.analysis_duration_ms,
        domain_info=payload.get("domain_info"),
        reputation=payload.get("reputation"),
        ssl_info=payload.get("ssl_info"),
    )