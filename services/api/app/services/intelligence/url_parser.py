from urllib.parse import urlparse
from pydantic import BaseModel
import re

class ParsedUrl(BaseModel):
    raw_url: str
    scheme: str
    domain: str
    path: str
    query: str
    is_ip: bool
    tld: str | None

def parse_url(url: str) -> ParsedUrl:
    if not url.startswith("http"):
        url = "http://" + url
    parsed = urlparse(url)
    domain = parsed.netloc.split(":")[0] if ":" in parsed.netloc else parsed.netloc
    
    # Check if domain is IP
    is_ip = bool(re.match(r"^(?:[0-9]{1,3}\.){3}[0-9]{1,3}$", domain))
    
    parts = domain.split(".")
    tld = parts[-1] if len(parts) > 1 and not is_ip else None

    return ParsedUrl(
        raw_url=url,
        scheme=parsed.scheme,
        domain=domain,
        path=parsed.path,
        query=parsed.query,
        is_ip=is_ip,
        tld=tld
    )
