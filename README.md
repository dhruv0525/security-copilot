# Security Copilot

AI-powered browser security assistant for phishing detection, scam analysis, dark pattern detection, and real-time website trust scoring.

Security Copilot combines a FastAPI backend, Chrome extension, AI-assisted analysis pipeline, and real-time risk scoring engine to help users identify suspicious websites before interacting with them.

---

# Features

## Implemented
- JWT authentication system
- User signup/login flow
- Protected API routes
- PostgreSQL persistence layer
- Scan analysis endpoint
- Trust scoring architecture
- Dockerized backend infrastructure
- Swagger/OpenAPI documentation
- Async SQLAlchemy integration
- Redis infrastructure setup

## Planned
- Chrome extension popup UI
- Real-time browser scanning
- AI-generated threat explanations
- Dashboard analytics
- Scan history timeline
- Threat intelligence feeds
- Redis caching + rate limiting
- CI/CD pipeline

---

# Tech Stack

| Layer | Technology |
|---|---|
| Dashboard | Next.js 15, TypeScript, TailwindCSS, shadcn/ui |
| Extension | Chrome Manifest V3, TypeScript, React |
| Backend | FastAPI, Python 3.12, Pydantic, async SQLAlchemy |
| Database | PostgreSQL 16 |
| Cache | Redis 7 |
| AI | OpenAI GPT-4o-mini |
| Infra | Docker, Docker Compose, GitHub Actions |

---

# Architecture

```text
Browser Extension
        ↓
Extract Page Metadata
        ↓
FastAPI Backend
        ↓
Threat Analysis Engine
        ↓
Trust Score Generation
        ↓
PostgreSQL Persistence
        ↓
Risk Result Returned
        ↓
Extension Popup Warning
```

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

# Quick Start

## Prerequisites

- Docker + Docker Compose
- Node.js 22+
- pnpm
- Python 3.12+

---

# Environment Setup

```bash
cp services/api/.env.example services/api/.env
```

Configure:

```env
SECRET_KEY=your_secret_key
OPENAI_API_KEY=your_openai_key
DATABASE_URL=postgresql+asyncpg://postgres:postgres@localhost:5432/seccopilot
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

# Development Workflow

## Backend

```bash
cd services/api
uvicorn app.main:app --reload
```

## Dashboard

```bash
pnpm dev:web
```

## Extension

```bash
pnpm dev:extension
```

---

# Current Backend Capabilities

## Authentication
- JWT access token generation
- Secure bcrypt password hashing
- Protected route authorization
- User persistence

## Scan Engine
- URL submission endpoint
- Risk scoring pipeline
- Scan persistence
- Structured scan response schema

---

# Example Scan Request

```json
{
  "url": "https://free-iphone-giveaway.xyz",
  "page_text": "WIN FREE IPHONE NOW LIMITED OFFER",
  "page_title": "Free iPhone Giveaway",
  "external_link_count": 15,
  "form_count": 3
}
```

---

# Future Improvements

- ML-based phishing classification
- Browser-side lightweight scanning
- Threat intelligence integration
- Community-driven reputation scoring
- Admin moderation dashboard
- WebSocket live threat updates
- Distributed scan workers

---

# Why This Project?

Modern phishing and scam websites increasingly use:
- social engineering
- deceptive UI patterns
- fake urgency
- cloned branding

Security Copilot aims to provide real-time browser-native protection and explainable risk analysis for everyday users.

---

# License

MIT