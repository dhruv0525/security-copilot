#!/usr/bin/env python3
"""
Standalone GSB debug script.
Run from services/api/:
  python debug_gsb.py

Tests Google Safe Browsing against the official phishing test URL
without requiring FastAPI, Redis, or PostgreSQL.
"""
import asyncio
import os
import sys

# Allow running from services/api/ without package install
sys.path.insert(0, os.path.dirname(__file__))

TEST_URL = "https://testsafebrowsing.appspot.com/s/phishing.html"
API_URL = "https://safebrowsing.googleapis.com/v4/threatMatches:find"


async def main():
    import httpx

    api_key = os.getenv("GOOGLE_SAFE_BROWSING_API_KEY", "").strip()

    print("=" * 60)
    print("Google Safe Browsing — Standalone Debug Test")
    print("=" * 60)

    if not api_key:
        # Try loading from .env manually
        env_path = os.path.join(os.path.dirname(__file__), ".env")
        if os.path.exists(env_path):
            for line in open(env_path):
                line = line.strip()
                if line.startswith("GOOGLE_SAFE_BROWSING_API_KEY="):
                    api_key = line.split("=", 1)[1].strip()
                    break

    if not api_key:
        print("\n[FAIL] No API key found.")
        print("       Add GOOGLE_SAFE_BROWSING_API_KEY=<your_key> to services/api/.env")
        print("       Get a key at: https://console.cloud.google.com")
        print("       Then enable 'Safe Browsing API' in the project.")
        return

    print(f"\n[OK]   API key loaded (length={len(api_key)})")
    print(f"[TEST] Checking URL: {TEST_URL}\n")

    payload = {
        "client": {
            "clientId": "security-copilot-debug",
            "clientVersion": "1.0.0"
        },
        "threatInfo": {
            "threatTypes": [
                "MALWARE",
                "SOCIAL_ENGINEERING",
                "UNWANTED_SOFTWARE",
                "POTENTIALLY_HARMFUL_APPLICATION",
                "THREAT_TYPE_UNSPECIFIED",
            ],
            "platformTypes": ["ANY_PLATFORM"],
            "threatEntryTypes": ["URL"],
            "threatEntries": [{"url": TEST_URL}]
        }
    }

    async with httpx.AsyncClient(timeout=10.0) as client:
        resp = await client.post(f"{API_URL}?key={api_key}", json=payload)

    print(f"[HTTP] Status: {resp.status_code}")
    print(f"[HTTP] Body:   {resp.text}\n")

    if resp.status_code == 403:
        print("[FAIL] 403 Forbidden. Likely causes:")
        print("       1. API key is invalid")
        print("       2. 'Safe Browsing API' is NOT enabled in Google Cloud Console")
        print("          → Go to: https://console.cloud.google.com/apis/library/safebrowsing.googleapis.com")
        print("          → Click 'Enable'")
        return

    if resp.status_code == 400:
        print("[FAIL] 400 Bad Request — payload may be malformed.")
        return

    if not resp.is_success:
        print(f"[FAIL] Unexpected status {resp.status_code}")
        return

    data = resp.json()
    matches = data.get("matches", [])

    if matches:
        categories = [m.get("threatType") for m in matches]
        print(f"[PASS] MALICIOUS DETECTED ✓")
        print(f"       Threat categories: {categories}")
        print(f"\n       GSB integration is working correctly.")
    else:
        print("[WARN] No matches returned. Possible causes:")
        print("       1. The test URL is no longer in the GSB database (rare)")
        print("       2. The API key lacks permission for threat detection")
        print("       3. Response body above may contain an error message")
        print("\n       Raw response:", data)


if __name__ == "__main__":
    asyncio.run(main())
