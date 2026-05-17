import time
from typing import Annotated
from urllib.parse import urlparse

from fastapi import APIRouter, Query

from app.api.deps import CacheDep, DBSession
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

router = APIRouter()

# --------------------------------------------------
# TEMPORARY MVP MODE
# Auth bypass enabled for pipeline verification
# --------------------------------------------------


@router.post("", response_model=ScanResponse, status_code=201)
async def create_scan(
    body: ScanRequest,
    db: DBSession,
    cache: CacheDep,
) -> ScanResponse:
    start_time = time.time()

    # --------------------------------------------------
    # Build Scan Context
    # --------------------------------------------------
    scan_context = ScanContext(
        url=str(body.url),
        page_text=body.page_text,
        page_title=body.page_title,
        external_link_count=body.external_link_count or 0,
        form_count=body.form_count or 0,
    )

    # --------------------------------------------------
    # Run Intelligence Pipeline
    # --------------------------------------------------
    intelligence_result = await run_intelligence_scan(
        scan_context,
        cache=cache,
    )

    # --------------------------------------------------
    # Convert To Frontend-Compatible Trust Schema
    # --------------------------------------------------
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

    duration_ms = int(
        (time.time() - start_time) * 1000
    )

    domain = (
        urlparse(str(body.url)).netloc
        or str(body.url)
    )

    # --------------------------------------------------
    # TEMPORARY MVP DATABASE PERSISTENCE
    # user_id bypassed temporarily
    # --------------------------------------------------
    repo = ScanRepository(db)

    new_scan = ScanResult(
        user_id=None,
        url=str(body.url),
        domain=domain,
        trust_score=trust_score.score,
        risk_level=trust_score.level,
        dominant_category=trust_score.dominant_category,
        analysis_payload=trust_score.model_dump(
            mode="json"
        ),
        analysis_duration_ms=duration_ms,
        was_cached=False,
    )

    try:
        await repo.create(new_scan)
        await db.commit()

    except Exception as exc:
        # Graceful persistence degradation
        print(
            f"[DB] Failed to persist scan: {str(exc)}"
        )

    # --------------------------------------------------
    # Return Response
    # --------------------------------------------------
    return ScanResponse(
        id=(
            str(new_scan.id)
            if getattr(new_scan, "id", None)
            else "temporary-scan-id"
        ),
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
    )


@router.get("", response_model=PaginatedScans)
async def list_scans(
    db: DBSession,
    page: Annotated[int, Query(ge=1)] = 1,
    page_size: Annotated[int, Query(ge=1, le=100)] = 20,
) -> PaginatedScans:
    raise NotImplementedError


@router.get("/{scan_id}", response_model=ScanResponse)
async def get_scan(
    scan_id: str,
    db: DBSession,
) -> ScanResponse:
    raise NotImplementedError