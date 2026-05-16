import time
from typing import Annotated
from urllib.parse import urlparse

from fastapi import APIRouter, Query

from app.api.deps import DBSession
from app.schemas.scan import (
    PaginatedScans,
    ScanRequest,
    ScanResponse,
    TrustScoreSchema,
)
from app.services.analysis.engine import AnalysisInput, run_analysis
from app.services.trust.scorer import compute_trust_score

router = APIRouter()


# TEMPORARY MVP AUTH + DATABASE BYPASS
# TODO:
# - Restore JWT authentication
# - Restore persistent scan storage
# - Re-enable ScanRepository integration


@router.post("", response_model=ScanResponse, status_code=201)
async def create_scan(
    body: ScanRequest,
    db: DBSession,
) -> ScanResponse:
    start_time = time.time()

    analysis_input = AnalysisInput(
        url=str(body.url),
        page_text=body.page_text,
        page_title=body.page_title,
        external_link_count=body.external_link_count or 0,
        form_count=body.form_count or 0,
    )

    analysis_result = await run_analysis(analysis_input)

    trust_score_dict = compute_trust_score(analysis_result)

    duration_ms = int((time.time() - start_time) * 1000)
    domain = urlparse(str(body.url)).netloc or str(body.url)

    # TEMPORARY:
    # We are NOT saving scans to DB during MVP mode
    # because auth/user relationships are disabled.

    return ScanResponse(
        id="mvp-temp-scan-id",
        url=str(body.url),
        domain=domain,
        scanned_at=str(int(time.time())),
        trust_score=TrustScoreSchema(**trust_score_dict),
        cached=False,
        analysis_duration_ms=duration_ms,
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