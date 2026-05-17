from fastapi import APIRouter
from sqlalchemy import func, select, case
from datetime import datetime, timedelta, date

from app.api.deps import CurrentUser, DBSession
from app.models.scan import ScanResult

router = APIRouter()


@router.get("/summary")
async def get_summary(user: CurrentUser, db: DBSession) -> dict:
    # 1. Count scans grouped by risk level
    q = (
        select(ScanResult.risk_level, func.count(ScanResult.id))
        .where(ScanResult.user_id == user.id)
        .group_by(ScanResult.risk_level)
    )
    results = (await db.execute(q)).all()
    counts = {r[0]: r[1] for r in results}

    total_scans = sum(counts.values())
    threats_detected = counts.get("critical", 0) + counts.get("high", 0)
    safe_sites = counts.get("safe", 0) + counts.get("low", 0)
    high_risk_domains = counts.get("critical", 0) + counts.get("high", 0)
    ssl_issues = counts.get("medium", 0)  # Using medium risk as proxy for SSL anomalies

    # 2. Average confidence score (represented by average trust score for user's scans)
    score_q = select(func.avg(ScanResult.trust_score)).where(ScanResult.user_id == user.id)
    avg_score = (await db.execute(score_q)).scalar() or 0.0

    # Model confidence proxy (average score normalized to standard confidence range)
    avg_confidence = round(min(100.0, max(0.0, avg_score * 0.9 + 10)), 1) if total_scans > 0 else 85.0

    return {
      "totalScans": total_scans,
      "threatsDetected": threats_detected,
      "safeSites": safe_sites,
      "highRiskDomains": high_risk_domains,
      "avgConfidence": avg_confidence,
      "sslIssues": ssl_issues
    }


@router.get("/trends")
async def get_trends(user: CurrentUser, db: DBSession) -> list:
    today = date.today()
    start_date = today - timedelta(days=13)  # Last 14 days including today

    # Fetch daily aggregates
    q = (
        select(
            func.date(ScanResult.created_at).label("day"),
            func.count(ScanResult.id).label("scans"),
            func.sum(
                case(
                    (ScanResult.risk_level.in_(["critical", "high"]), 1),
                    else_=0
                )
            ).label("threats")
        )
        .where(ScanResult.user_id == user.id, ScanResult.created_at >= start_date)
        .group_by(func.date(ScanResult.created_at))
        .order_by(func.date(ScanResult.created_at))
    )
    rows = (await db.execute(q)).all()

    # Create map of day string -> row data
    db_data = {}
    for r in rows:
        day_val = r[0]
        if isinstance(day_val, (datetime, date)):
            key = day_val.strftime("%Y-%m-%d")
        else:
            key = str(day_val)
        db_data[key] = {
            "scans": int(r[1] or 0),
            "threats": int(r[2] or 0)
        }

    # Generate continuous 14-day history
    trends = []
    for i in range(14):
        current_day = start_date + timedelta(days=i)
        day_key = current_day.strftime("%Y-%m-%d")
        day_display = current_day.strftime("%b %d")

        day_data = db_data.get(day_key, {"scans": 0, "threats": 0})
        trends.append({
            "date": day_display,
            "scans": day_data["scans"],
            "threats": day_data["threats"]
        })

    return trends
