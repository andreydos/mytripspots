# MyTripSpots

Monorepo with Next.js PWA frontend and FastAPI GraphQL backend.

## Structure
- `apps/web` — frontend (Vercel target)
- `apps/api` — backend (Railway target)
- `infra/sql` — migrations/seeds
- `docs` — architecture and scope docs

## GraphQL (web + API)

- Operations live in `apps/web/graphql/**/*.graphql`.
- Committed API schema: `apps/api/schema.graphql` (source of truth for codegen on Vercel).
- Generated types and documents: `apps/web/graphql/generated/graphql.ts`.

When you change the Strawberry schema or add operations:

1. After API schema changes (API venv active): `pnpm schema:export` — refreshes `apps/api/schema.graphql`, then `pnpm codegen` (or one shot: `pnpm codegen:all`).
2. `pnpm codegen` — regenerates TypeScript from the committed schema (also runs automatically before `pnpm --filter web build`; no Python required).

Watch mode during frontend work: `pnpm --filter web codegen:watch`.

## Local Run
1. Database: use your **Supabase** Postgres URL in `apps/api/.env` as `DATABASE_URL` (Session pooler or direct connection from the Supabase dashboard). Optionally, for a fully local Postgres instead, run `docker compose up -d` — default DB name in compose is `mytripspots`.
2. Web:
   - copy `apps/web/.env.example` to `apps/web/.env.local`
   - `pnpm install`
   - `pnpm dev:web`
3. API:
   - copy `apps/api/.env.example` to `apps/api/.env`
   - use a **venv** (recommended; on Debian/Ubuntu system Python often blocks `pip install` without a venv):
     - from repo root: `python3 -m venv .venv` then `source .venv/bin/activate`
     - `pip install -e ./apps/api`
   - run from `apps/api` (so `.env` is picked up): `uvicorn main:app --reload --port 8000`  
     or without activating venv: `../.venv/bin/python -m uvicorn main:app --reload --port 8000`

## Migrations
Apply SQL files in order:
1. `infra/sql/0001_init.sql`
2. `infra/sql/0002_seed.sql`

## Required Env Vars
### Web
- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
- `CLERK_SECRET_KEY`
- `NEXT_PUBLIC_API_GRAPHQL_URL`

### API
- `DATABASE_URL`
- `CLERK_JWKS_URL`
- `CLERK_ISSUER`
- `CORS_ALLOWED_ORIGINS` (required when `APP_ENV=production` — your Vercel / site origin(s), comma-separated)
- `R2_ACCESS_KEY_ID`
- `R2_SECRET_ACCESS_KEY`
- `R2_BUCKET`
- `R2_ENDPOINT_URL`
- `UPLOAD_MAX_MB`

Recommended media settings:
- `UPLOAD_MAX_MB=4` (server hard cap)
- web client auto-compresses images to WebP near 3MB before upload

## Deploy
### Vercel (web)
- **Project → Settings → General**
  - **Root Directory**: `apps/web` (обязательно; не корень монорепы)
  - **Framework Preset**: **Next.js** (авто или вручную)
  - **Output Directory**: оставь **пустым** (для Next.js Vercel сам использует `.next`). Если там стоит `public` — сотри: иначе будет ошибка *No Output Directory named "public"*.
- **Build & Development**: команды можно не переопределять — берутся из [`apps/web/vercel.json`](apps/web/vercel.json) (`install` из корня репо + `pnpm --filter web build`).
- Закоммить [`pnpm-lock.yaml`](pnpm-lock.yaml) в корне репозитория.

**CLI:** запускай из каталога приложения, чтобы подтянулся Next-проект: `cd apps/web && npx vercel` (или после линка с корректным Root Directory в дашборде).

### Railway (api)
- root directory: `apps/api`
- apply `apps/api/railway.json`
- start command handled by config
