import asyncio
import re
from datetime import datetime, timezone
from typing import Optional
from pydantic import BaseModel
import structlog
from app.services.cache.redis_client import CacheService
from .models import ScoreSignal

logger = structlog.get_logger(__name__)

class WhoisResult(BaseModel):
    registrar: Optional[str] = None
    country: Optional[str] = None
    created_at: Optional[datetime] = None
    days_old: Optional[int] = None

async def _run_whois_cmd(domain: str) -> str:
    """Run the system whois command asynchronously."""
    try:
        proc = await asyncio.create_subprocess_exec(
            "whois", domain,
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.PIPE
        )
        stdout, stderr = await asyncio.wait_for(proc.communicate(), timeout=5.0)
        if proc.returncode == 0 and stdout:
            return stdout.decode(errors="ignore")
    except asyncio.TimeoutError:
        logger.warning("whois_timeout", domain=domain)
    except Exception as e:
        logger.warning("whois_cmd_error", domain=domain, error=str(e))
    return ""

def _parse_whois_output(output: str) -> WhoisResult:
    result = WhoisResult()
    
    # Try to extract Creation Date
    creation_match = re.search(r"(?i)(?:Creation Date|Created On|Registration Time|Registered on):\s*([a-zA-Z0-9\-:TZ\. ]+)", output)
    if creation_match:
        date_str = creation_match.group(1).strip()
        try:
            # handle some common formats
            # 1995-08-14T04:00:00Z
            if "T" in date_str and "Z" in date_str:
                dt = datetime.strptime(date_str, "%Y-%m-%dT%H:%M:%SZ")
            elif re.match(r"\d{2}-[A-Za-z]{3}-\d{4}", date_str):
                dt = datetime.strptime(date_str, "%d-%b-%Y")
            else:
                formats = [
                    "%Y-%m-%d %H:%M:%S",
                    "%Y-%m-%d",
                    "%d-%b-%Y",
                    "%Y.%m.%d",
                ]
                dt = None
                for fmt in formats:
                    try:
                        dt = datetime.strptime(date_str, fmt)
                        break
                    except ValueError:
                        continue
                if not dt:
                    raise ValueError(f"Could not parse date: {date_str}")
            
            # Ensure timezone aware
            if dt.tzinfo is None:
                dt = dt.replace(tzinfo=timezone.utc)
                
            result.created_at = dt
            delta = datetime.now(timezone.utc) - dt
            result.days_old = max(0, delta.days)
        except Exception as e:
            logger.debug("whois_date_parse_error", date_str=date_str, error=str(e))
            
    # Try to extract Registrar
    registrar_match = re.search(r"(?i)Registrar:\s*([^\n]+)", output)
    if registrar_match:
        result.registrar = registrar_match.group(1).strip()
        
    # Try to extract Country
    country_match = re.search(r"(?i)Registrant Country:\s*([A-Z]{2})", output)
    if country_match:
        result.country = country_match.group(1).strip()
        
    return result

async def fetch_whois(domain: str, cache: Optional[CacheService] = None) -> Optional[WhoisResult]:
    """
    Fetch WHOIS data for a domain.
    Uses Redis caching if available.
    """
    cache_key = f"whois:v1:{domain}"
    
    if cache:
        try:
            cached_data = await cache.get_json(cache_key)
            if cached_data:
                # Need to parse datetime string back to datetime
                if cached_data.get("created_at"):
                    cached_data["created_at"] = datetime.fromisoformat(cached_data["created_at"])
                return WhoisResult(**cached_data)
        except Exception as e:
            logger.warning("whois_cache_read_error", domain=domain, error=str(e))
            
    # Fallback to executing whois command
    raw_output = await _run_whois_cmd(domain)
    if not raw_output:
        return None
        
    parsed_result = _parse_whois_output(raw_output)
    
    if cache and (parsed_result.created_at or parsed_result.registrar):
        try:
            dump_data = parsed_result.model_dump()
            if dump_data.get("created_at"):
                dump_data["created_at"] = dump_data["created_at"].isoformat()
            await cache.set_json(cache_key, dump_data, 3600 * 12) # Cache for 12 hours
        except Exception as e:
            logger.warning("whois_cache_write_error", domain=domain, error=str(e))
            
    return parsed_result

def evaluate_whois_signals(whois_result: WhoisResult | None) -> list[ScoreSignal]:
    signals: list[ScoreSignal] = []
    if not whois_result or whois_result.days_old is None:
        return signals

    if whois_result.days_old < 7:
        signals.append(
            ScoreSignal(
                name="very_young_domain",
                weight=40,
                severity="critical",
                reason="Domain registered extremely recently (less than 7 days ago)."
            )
        )
    elif whois_result.days_old < 30:
        signals.append(
            ScoreSignal(
                name="young_domain",
                weight=25,
                severity="high",
                reason=f"Domain registered only {whois_result.days_old} days ago."
            )
        )

    if whois_result.registrar:
        suspicious_registrars = ["freenom", "namecheap", "hostinger"] # Configurable in practice
        if any(sr in whois_result.registrar.lower() for sr in suspicious_registrars):
            signals.append(
                ScoreSignal(
                    name="suspicious_registrar",
                    weight=15,
                    severity="medium",
                    reason=f"Domain registered via commonly abused registrar: {whois_result.registrar}."
                )
            )

    return signals

