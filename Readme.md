# MoveInSync Billing & Reporting Stack

Complete local blueprint for a MoveInSync-style multi-tenant commute billing platform. The scope satisfies the uploaded brief stored at `/mnt/data/829fce11-206d-46cd-bea4-697572afbfc0.pdf`, covering authentication, billing models, reports, caching, monitoring, and error-handling trade-offs.

## Repository layout

```
backend/
  app/
    __init__.py
    auth.py
    billing.py
    config.py
    crud.py
    db.py
    deps.py
    main.py
    models.py
    reporting.py
    schemas.py
    tasks/seed.py
  Dockerfile
  requirements.txt
  .env.example
frontend/
  app/
    layout.tsx
    page.tsx
  components/
    billing-config-form.tsx
    dashboard.tsx
    reports-export.tsx
  lib/api.ts
  Dockerfile
  package.json
  .env.local.example
docker-compose.yml
README.md
```

## Chronological quick start

1. **Clone & prerequisites** – Install Docker + Compose v2, Node 20+, and Python 3.11. `git clone <repo> && cd moviesync2`.
2. **Copy environment files**  
   ```bash
   cp backend/.env.example backend/.env
   cp frontend/.env.local.example frontend/.env.local
   ```
3. **Boot the stack**  
   ```bash
   docker compose up --build
   ```
   Services: FastAPI API (`http://localhost:8000` with `/docs`), Next.js dashboard (`http://localhost:3000`), Postgres (5432), Redis (6379).
4. **Run migrations (optional)**  
   ```bash
   docker compose exec backend alembic upgrade head
   ```
5. **Seed sample data**  
   ```bash
   docker compose exec backend python -m app.tasks.seed
   ```
   Seeds tenant `AcmeCorp`, admin `admin@acme.com` / `password`, vendor, and sample trips.
6. **Sign in & explore** – Use the seeded credentials in the frontend login card, view KPIs, tweak billing configs, and export vendor CSVs.

## Backend overview

- FastAPI + Uvicorn (async SQLAlchemy via `asyncpg`).
- Configuration handled through `pydantic.BaseSettings` (`app/config.py`).
- JWT auth (`python-jose`) and password hashing (`passlib`). Dependencies in `app/deps.py` enforce tenant isolation and role checks.
- `app/billing.py`: supports trip/package/hybrid vendor billing, per-trip invoice rows stored for auditability.
- `app/reporting.py`: generates vendor monthly CSV/JSON statements and dashboard summaries, caching expensive results in Redis for one hour.
- Complexity: trip billing O(1); vendor monthly statements O(n) in trips per vendor-month with cache amortization; dashboard summary O(1) thanks to indexed aggregates.
- Monitoring & resilience: structured error responses, Redis cache fallbacks, hooks for Prometheus/Sentry; guidance on retrying failed billing jobs and backing up Postgres.

## Frontend overview

- Next.js App Router + Tailwind v4 utilities + shadcn-compatible styling.
- `lib/api.ts` centralizes fetch helpers (login, dashboard summary, vendor report downloads) using `NEXT_PUBLIC_API_URL`.
- `Dashboard` component renders KPI cards once authenticated; `BillingConfigForm` visualizes per-km/hour configs; `ReportsExport` triggers CSV downloads for vendor-month combos.
- `app/page.tsx` orchestrates login, monitoring, billing adjustments, and exports, mirroring the assignment UX requirements.

## Database schema snapshot

Tables: `tenants`, `users`, `vendors`, `trips`, `invoice_rows`, each containing `tenant_id` for multi-tenant scoping. Vendors store `billing_model` + JSON `billing_config`; trips keep payloads for replay/debug; invoice rows capture computed amounts for auditing and downstream billing.

## docker-compose services

| Service  | Description                              | Ports |
|----------|------------------------------------------|-------|
| db       | PostgreSQL 15 + named volume `db_data`    | 5432  |
| redis    | Redis 7 cache                             | 6379  |
| backend  | FastAPI + Uvicorn reload (`backend/`)     | 8000  |
| frontend | Next.js dev server (`frontend/`)          | 3000  |

## Monitoring, caching, trade-offs

- Redis caches vendor reports/dashboard aggregates; invalidate keys when new trips/invoice rows post for the same vendor-period.
- Structured logs ready for ELK/Azure Monitor; add Prometheus or OpenTelemetry middleware via `app.main` for deeper observability.
- Trade-offs documented inline (real-time per-trip billing vs batch, cache freshness vs latency, tenant isolation vs admin overrides).
- Failure handling: HTTP errors include actionable messages; add retry queues / workers for large ingest pipelines.

## Testing hooks

```bash
docker compose exec backend pytest -q          # backend tests
npm run lint --prefix frontend                 # frontend lint/Tailwind validation
```

## Suggested next steps

1. Generate Alembic migrations instead of relying on `Base.metadata.create_all`.
2. Wire billing-config mutations to the backend and persist vendor overrides.
3. Add Prometheus/OpenTelemetry exporters + dashboards.
4. Implement role-based front-end routing (admin/vendor/employee) and secure cookie storage for JWTs.
5. Harden auth with refresh tokens, password resets, and production-ready secret management.
