# Security Copilot

AI-powered browser security assistant — phishing detection, dark pattern analysis, and real-time trust scoring.

## Stack

| Layer | Technology |
|---|---|
| Dashboard | Next.js 15, TypeScript, TailwindCSS, shadcn/ui, React Query |
| Extension | Chrome MV3, TypeScript, React |
| Backend | FastAPI, Python 3.12, Pydantic, async SQLAlchemy |
| Database | PostgreSQL 16 |
| Cache | Redis 7 |
| AI | OpenAI GPT-4o-mini |
| Infra | Docker, Docker Compose, GitHub Actions |

## Project Structure

```
security-copilot/
├── apps/web/          # Next.js dashboard
├── apps/extension/    # Chrome MV3 extension
├── services/api/      # FastAPI backend
├── packages/
│   └── shared-types/  # TypeScript API contract (consumed by web + extension)
├── infra/             # Dockerfiles, nginx
└── docker-compose.yml
```

## Quick Start

### Prerequisites
- Docker + Docker Compose
- Node.js 22 + pnpm 9
- Python 3.12

### 1. Environment setup

```bash
cp services/api/.env.example services/api/.env
# Fill in SECRET_KEY and OPENAI_API_KEY
```

### 2. Start infrastructure

```bash
docker compose up postgres redis -d
```

### 3. Run database migrations

```bash
cd services/api
pip install uv
uv pip install --system -e ".[dev]"
alembic upgrade head
```

### 4. Start services

```bash
# Terminal 1 — API
docker compose up api

# Terminal 2 — Dashboard
pnpm install
pnpm dev:web

# Terminal 3 — Extension (then load dist/ as unpacked extension in Chrome)
pnpm dev:extension
```

### Or: run everything via Docker Compose

```bash
OPENAI_API_KEY=sk-... docker compose up
```

## Architecture

See [ARCHITECTURE.md](./ARCHITECTURE.md) for full design decisions and communication flow.

## Development Phases

- [x] Phase 1 — Folder structure, Docker, shared types
- [ ] Phase 2 — Auth (JWT, bcrypt, user model)
- [ ] Phase 3 — Analysis engine (heuristics)
- [ ] Phase 4 — Trust scorer + scan persistence
- [ ] Phase 5 — Extension content script + popup
- [ ] Phase 6 — AI explainer (OpenAI)
- [ ] Phase 7 — Dashboard auth + scan history
- [ ] Phase 8 — Analytics charts
- [ ] Phase 9 — Redis caching + rate limiting
- [ ] Phase 10 — CI/CD + production hardening
