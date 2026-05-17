# Security Copilot

Security Copilot is a full-stack browser security intelligence platform built using a Chrome Extension (Manifest V3) and a FastAPI async backend.

The platform performs real-time phishing detection, malicious URL analysis, SSL/TLS intelligence analysis, domain legitimacy verification, and explainable trust scoring to help users identify suspicious or dangerous websites before interacting with them.

Unlike traditional DOM-only browser scanners, Security Copilot uses an adaptive URL-first intelligence pipeline. This allows it to function flawlessly even on modern, CSP-protected websites where DOM extraction is heavily restricted—because naturally, the modern internet decided every browser extension should negotiate with five CSP headers before reading a button label.

---

## Architecture Design & Philosophy

Security Copilot prioritizes reliability, explainability, and deterministic security reasoning over opaque black-box AI classification systems.

### Core Architectural Principles

* URL-First Analysis: Ensures graceful degradation when DOM access is restricted.
* Deterministic Threat Scoring: Keeps threat scoring predictable and reproducible.
* Explainable Security Reasoning: Delivers human-readable, zero-hallucination threat explanations.
* Async Provider Orchestration: Scalable, non-blocking pipeline fetching data concurrently from multiple intelligence providers.

### Live Threat Intelligence Pipeline

Chrome Extension
│
▼
Extract URL + Optional DOM Metadata
│
▼
FastAPI Intelligence API
│
▼
Adaptive Intelligence Engine
├── URL Heuristics
├── Google Safe Browsing
├── WHOIS / Domain Intelligence
├── SSL/TLS Intelligence
├── Reputation Analysis
└── DOM Enrichment (Optional)
│
▼
Explainable Score/Signal Engine
│
▼
Trust Score + Confidence Classification
│
▼
Deterministic Explanation Synthesis
│
▼
Structured Security Response ──► [ Extension Popup + Dashboard UI ]

---

## Tech Stack

* Dashboard: Next.js 15, TypeScript, TailwindCSS, shadcn/ui
* Extension: Chrome Manifest V3, React, TypeScript
* Backend: FastAPI, Python 3.12, Async SQLAlchemy
* Database: PostgreSQL 16
* Cache: Redis 7
* Threat Intelligence: Google Safe Browsing API, OpenSSL, WHOIS
* Analytics & Charts: Recharts
* Authentication: JWT (JSON Web Tokens)
* Infra / DevOps: Docker, Docker Compose, GitHub Actions

---

## Project Structure

security-copilot/
├── apps/
│   ├── web/               # Next.js analytics dashboard
│   └── extension/         # Manifest V3 Chrome extension (React + TS)
├── services/
│   └── api/               # FastAPI async backend pipeline
├── packages/
│   └── shared-types/      # Shared TypeScript contracts / types
├── infra/                 # Docker & environment configuration files
└── docker-compose.yml     # Local orchestration for core dependencies

---

## Core Features & Detection Capabilities

### Intelligence Modules

* Reputation Intelligence: Integrated with Google Safe Browsing and modular reputation orchestrators.
* Domain Intelligence: Extracts WHOIS domain age, registrar legitimacy, suspicious TLDs, and entropy/randomized subdomain analysis.
* SSL/TLS Intelligence: Performs active certificate analysis checking for expirations, self-signed certs, and invalid validity windows.
* Explainable Security Engine: A deterministic, signal-based synthesis engine providing zero-hallucination, human-readable threat summaries.

### Interface Packages

* Chrome Extension: Real-time trust score badges, background service-worker orchestration, and instant threat breakdown popups.
* Next.js Dashboard: Persistent scan history timelines, deep-dive intelligence pages, risk analytics cards, and visual metric breakdowns.

---

## Quick Start

### Prerequisites

Ensure you have the following installed locally:

* Docker + Docker Compose
* Node.js 22+ & pnpm
* Python 3.12+

### 1. Clone & Install Dependencies

git clone [https://github.com/dhruv0525/security-copilot.git](https://github.com/dhruv0525/security-copilot.git)
cd security-copilot
pnpm install

### 2. Environment Setup

Create a .env file in services/api/.env and configure your keys:
SECRET_KEY=your_super_secret_jwt_key
DATABASE_URL=postgresql+asyncpg://postgres:postgres@localhost:5432/seccopilot
REDIS_URL=redis://localhost:6379
GOOGLE_SAFE_BROWSING_API_KEY=your_gsb_api_key

### 3. Spin Up Infrastructure & Database

# Start Postgres and Redis

docker compose up postgres redis -d

# Run migrations via Alembic

cd services/api
alembic upgrade head

### 4. Run the Backend (FastAPI)

uvicorn app.main:app --reload

* Interactive Swagger Docs will be available at: http://localhost:8000/docs

### 5. Run the Dashboard (Next.js)

cd apps/web
pnpm dev

* Dashboard UI will be live at: http://localhost:3000

### 6. Build & Load the Chrome Extension

cd apps/extension
pnpm build

1. Open Chrome and navigate to chrome://extensions/.
2. Enable Developer Mode (top-right toggle).
3. Click Load unpacked and select the apps/extension/dist directory.
(Because browser extensions still require a ceremonial unpacking ritual before being allowed to protect lives. Humanity continues innovating.)

---

## API Reference (Key Endpoints)

### Authentication

* POST /api/v1/auth/register - Register a new user
* POST /api/v1/auth/login - Authenticate and receive a JWT token

### Scan Intelligence

* POST /api/v1/scans - Trigger an active real-time scan for a specific payload URL
* GET /api/v1/scans - Fetch historical scans (paginated)
* GET /api/v1/scans/{scan_id} - Retrieve detailed intelligence signals for a specific scan

Example Scan Request payload:
{
"url": "[suspicious link removed]"
}

Example Detection Output:
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
"ai_explanation": "This website was flagged as dangerous because Google Safe Browsing identified phishing activity.",
"recommendation": "Avoid entering credentials or sensitive information."
}

---

## Verification URLs (Testing)

Test the detection suite safely using these endpoints:

* Safe Site: [https://google.com](https://google.com)
* SSL Failure/Expired: [https://expired.badssl.com]()
* Google Safe Browsing Test Phishing: [suspicious link removed]

---

## Future Roadmap

* Threat Intelligence Expansion: Integrate VirusTotal, AbuseIPDB, PhishTank, and passive DNS mapping.
* Advanced Heuristics: Implement homoglyph detection, Unicode spoofing analysis, and brand impersonation models.
* Browser Automation: Real-time background auto-analysis and passive network monitoring.
* Enterprise Scaling: Distributed asynchronous scan workers and live real-time updates via WebSockets.

---

## License

Distributed under the MIT License. See LICENSE for more information.
