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
  package.json
  .env.local.example
README.md
```

## Chronological quick start

1. **Clone & prerequisites** – Install Node 20+, pnpm/npm, and ensure you have Python 3.12 via Conda (e.g., `conda create -n moviesync2 python=3.12`). Also provision Postgres 15 and Redis 7 locally (default ports 5432/6379). `git clone <repo> && cd moviesync2`.
2. **Copy environment files**  
   ```bash
   cp backend/.env.example backend/.env
   cp frontend/.env.local.example frontend/.env.local
   ```
3. **Start backing services** – Run Postgres and Redis locally (Docker, Homebrew, system service, etc.) using the credentials from `.env` (`mov_user/mov_pass`, db `moviesync`).
4. **Install backend deps & run API**  
  ```bash
  conda activate moviesync2
  pip install -r backend/requirements.txt
  cd backend
  uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
  ```
  API available at `http://localhost:8000` (Swagger at `/docs`).
5. **Install frontend deps & run UI**  
  ```bash
  cd frontend
  npm install
  npm run dev -- --hostname 0.0.0.0 --port 3000
  ```
  UI available at `http://localhost:3000`.
6. **Run migrations (optional)** – Once Alembic is configured, run `alembic upgrade head` inside the activated Conda env.
7. **Seed sample data**  
  ```bash
  cd backend
  conda activate moviesync2
  python -m app.tasks.seed
  ```
  Seeds tenant `AcmeCorp`, admin `admin@acme.com` / `password`, vendor, and sample trips.
8. **Sign in & explore** – Use the seeded credentials in the frontend login card, view KPIs, tweak billing configs, and export vendor CSVs.

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

## Monitoring, caching, trade-offs

- Redis caches vendor reports/dashboard aggregates; invalidate keys when new trips/invoice rows post for the same vendor-period.
- Structured logs ready for ELK/Azure Monitor; add Prometheus or OpenTelemetry middleware via `app.main` for deeper observability.
- Trade-offs documented inline (real-time per-trip billing vs batch, cache freshness vs latency, tenant isolation vs admin overrides).
- Failure handling: HTTP errors include actionable messages; add retry queues / workers for large ingest pipelines.

## Testing hooks

```bash
conda activate moviesync2 && cd backend && pytest -q
cd frontend && npm run lint
```

## Suggested next steps

1. Generate Alembic migrations instead of relying on `Base.metadata.create_all`.
2. Wire billing-config mutations to the backend and persist vendor overrides.
3. Add Prometheus/OpenTelemetry exporters + dashboards.
4. Implement role-based front-end routing (admin/vendor/employee) and secure cookie storage for JWTs.
5. Harden auth with refresh tokens, password resets, and production-ready secret management.
