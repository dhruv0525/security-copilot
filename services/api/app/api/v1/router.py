from fastapi import APIRouter

from app.api.v1 import auth, scans, analytics, flagged

router = APIRouter()

router.include_router(auth.router, prefix="/auth", tags=["auth"])
router.include_router(scans.router, prefix="/scans", tags=["scans"])
router.include_router(analytics.router, prefix="/analytics", tags=["analytics"])
router.include_router(flagged.router, prefix="/flagged", tags=["flagged"])
