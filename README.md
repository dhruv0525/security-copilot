# Security Copilot

Security Copilot is an adaptive browser-security intelligence platform built with a Chrome Extension + FastAPI backend architecture.

The system performs real-time phishing detection, URL reputation analysis, domain intelligence analysis, and explainable trust scoring to help users identify malicious or suspicious websites before interacting with them.

Unlike traditional DOM-only browser scanners, Security Copilot uses a URL-first adaptive threat intelligence pipeline capable of functioning even on modern CSP-protected websites.

---

# Core Features

## Implemented

### Browser Security Intelligence

* Real-time website threat analysis
* Adaptive URL-first intelligence pipeline
* Explainable trust scoring engine
* Confidence-based risk classification
* Suspicious URL heuristic analysis
* Domain-age intelligence (WHOIS)
* Google Safe Browsing integration
* Reputation-provider orchestration system
* Graceful degradation for protected websites

### Backend Infrastructure

* FastAPI async backend
* JWT authentication system
* Protected API routes
* PostgreSQL persistence layer
* Redis intelligence caching
* Async SQLAlchemy integration
* Dockerized infrastructure
* Swagger/OpenAPI documentation

### Chrome Extension

* Chrome Manifest V3 architecture
* Popup-based website scanning
* Background service worker
* Content script integration
* Browser-to-backend scan orchestration
* Real-time trust score rendering

---

# Live Threat Intelligence Pipeline

```text
Chrome Extension
        ↓
Extract URL + Optional DOM Metadata
        ↓
FastAPI Backend
        ↓
Adaptive Intelligence Engine
        ├── URL Heuristics
        ├── Google Safe Browsing
        ├── WHOIS / Domain Intelligence
        ├── Reputation Analysis
        └── DOM Enrichment (Optional)
        ↓
Explainable ScoreSignal Engine
        ↓
Trust Score + Risk Classification
        ↓
Structured Security Response
        ↓
Extension Popup Warning UI
```

---

# Detection Capabilities

* Phishing detection
* Malicious URL reputation checks
* Suspicious domain analysis
* Young-domain detection
* Credential harvesting indicators
* URL anomaly heuristics
* Social engineering threat detection
* Risk confidence scoring

---

# Example Detection Output

```json
{
  "level": "critical",
  "confidence": "high",
  "signals": [
    {
      "name": "google_flagged_phishing",
      "severity": "critical",
      "reason": "Google Safe Browsing flagged this URL for phishing activity"
    }
  ],
  "recommendation": "Avoid entering credentials or sensitive information."
}
```

---

# Tech Stack

| Layer               | Technology                                       |
| ------------------- | ------------------------------------------------ |
| Dashboard           | Next.js 15, TypeScript, TailwindCSS, shadcn/ui   |
| Extension           | Chrome Manifest V3, React, TypeScript            |
| Backend             | FastAPI, Python 3.12, Pydantic, async SQLAlchemy |
| Database            | PostgreSQL 16                                    |
| Cache               | Redis 7                                          |
| Threat Intelligence | Google Safe Browsing API                         |
| Infra               | Docker, Docker Compose, GitHub Actions           |

---

# Project Structure

```text
security-copilot/
├── apps/web/               # Next.js dashboard
├── apps/extension/         # Chrome extension
├── services/api/           # FastAPI backend
├── packages/shared-types/  # Shared TypeScript contracts
├── infra/                  # Docker + infrastructure configs
└── docker-compose.yml
```

---

# Architecture Design

Security Copilot evolved from a DOM-first browser scanner into an adaptive intelligence platform.

Current architecture principles:

* URL-first analysis
* Modular provider orchestration
* Explainable threat scoring
* Async intelligence providers
* Graceful degradation
* Real-time browser integration
* Scalable provider abstraction system

This allows the platform to continue functioning even on heavily protected modern websites where DOM extraction is limited.

---

# Quick Start

## Prerequisites

* Docker + Docker Compose
* Node.js 22+
* pnpm
* Python 3.12+

---

# Environment Setup

```bash
cp services/api/.env.example services/api/.env
```

Configure:

```env
SECRET_KEY=your_secret_key
DATABASE_URL=postgresql+asyncpg://postgres:postgres@localhost:5432/seccopilot
GOOGLE_SAFE_BROWSING_API_KEY=your_gsb_api_key
```

---

# Start Infrastructure

```bash
docker compose up postgres redis -d
```

---

# Run Database Migrations

```bash
cd services/api

alembic upgrade head
```

---

# Start Backend

```bash
uvicorn app.main:app --reload
```

Swagger docs:

```text
http://localhost:8000/docs
```

---

# Run Chrome Extension

```bash
pnpm build
```

Then:

1. Open `chrome://extensions`
2. Enable Developer Mode
3. Click “Load unpacked”
4. Select:
   `apps/extension/dist`

---

# Example Scan Request

```json
{
  "url": "https://testsafebrowsing.appspot.com/s/phishing.html"
}
```

---

# Current Project Status

Functional MVP completed:

* End-to-end extension scanning
* Real-time phishing detection
* Google Safe Browsing integration
* Explainable scoring pipeline
* WHOIS intelligence integration
* Redis-backed caching
* Backend orchestration operational
* Browser-extension integration working

---

# Future Improvements

* SSL/TLS certificate intelligence
* AI-generated threat explanations
* Historical scan analytics
* Threat intelligence provider expansion
* Browser-side lightweight scanning
* Real-time scan dashboards
* Distributed intelligence workers
* Advanced DOM-based phishing analysis

---

# Why This Project?

Modern phishing attacks increasingly rely on:

* social engineering
* cloned branding
* deceptive UI flows
* disposable domains
* credential harvesting techniques

Security Copilot aims to provide real-time browser-native protection through explainable and adaptive threat intelligence rather than opaque black-box scoring.

---

# License

MIT
