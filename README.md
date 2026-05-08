# Travel PWA

Monorepo with Next.js PWA frontend and FastAPI GraphQL backend.

## Structure
- `apps/web` — frontend (Vercel target)
- `apps/api` — backend (Railway target)
- `infra/sql` — migrations/seeds
- `docs` — architecture and scope docs

## Local Run
1. Start database:
   - `docker compose up -d`
2. Web:
   - copy `apps/web/.env.example` to `apps/web/.env.local`
   - `pnpm install`
   - `pnpm dev:web`
3. API:
   - copy `apps/api/.env.example` to `apps/api/.env`
   - `pip install -e ./apps/api`
   - `cd apps/api && uvicorn main:app --reload --port 8000`

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
- root directory: `apps/web`
- use `apps/web/vercel.json` (install runs from monorepo root so `pnpm` workspace + `next` resolve correctly)
- commit `pnpm-lock.yaml` at repo root (do not gitignore it)

### Railway (api)
- root directory: `apps/api`
- apply `apps/api/railway.json`
- start command handled by config
