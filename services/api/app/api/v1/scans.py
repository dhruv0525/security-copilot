import time
from typing import Annotated
from urllib.parse import urlparse

from fastapi import APIRouter, Query

from app.api.deps import CurrentUser, DBSession
from app.models.scan import ScanResult
from app.repositories.scan_repo import ScanRepository
from app.schemas.scan import PaginatedScans, ScanRequest, ScanResponse, TrustScoreSchema
from app.services.analysis.engine import AnalysisInput, run_analysis
from app.services.trust.scorer import compute_trust_score

router = APIRouter()


@router.post("", response_model=ScanResponse, status_code=201)
async def create_scan(
    body: ScanRequest,
    user: CurrentUser,
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

    scan_result = ScanResult(
        user_id=user.id,
        url=str(body.url),
        domain=domain,
        trust_score=trust_score_dict["score"],
        risk_level=trust_score_dict["level"],
        dominant_category=trust_score_dict["dominant_category"],
        analysis_payload=trust_score_dict,
        analysis_duration_ms=duration_ms,
        was_cached=False,
    )

    scan_repo = ScanRepository(db)
    scan_result = await scan_repo.create(scan_result)

    return ScanResponse(
        id=str(scan_result.id),
        url=scan_result.url,
        domain=scan_result.domain,
        scanned_at=scan_result.created_at.isoformat() if hasattr(scan_result.created_at, "isoformat") else str(scan_result.created_at),
        trust_score=TrustScoreSchema(**trust_score_dict),
        cached=scan_result.was_cached,
        analysis_duration_ms=scan_result.analysis_duration_ms,
    )


@router.get("", response_model=PaginatedScans)
async def list_scans(
    user: CurrentUser,
    db: DBSession,
    page: Annotated[int, Query(ge=1)] = 1,
    page_size: Annotated[int, Query(ge=1, le=100)] = 20,
) -> PaginatedScans:
    raise NotImplementedError


@router.get("/{scan_id}", response_model=ScanResponse)
async def get_scan(
    scan_id: str,
    user: CurrentUser,
    db: DBSession,
) -> ScanResponse:
    raise NotImplementedError
