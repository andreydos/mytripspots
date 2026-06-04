# Testing

## Overview

```text
apps/api/tests/     → pytest (GraphQL + Postgres, test auth token)
apps/web/tests/     → Vitest (unit + component with MSW)
apps/web/e2e/       → Playwright (browser, mocked GraphQL)
```

CI runs **Vitest**, **pytest** (with Postgres service), and **Playwright** on pull requests.

## API (pytest)

Requires Postgres with migrations + seed (`infra/sql/0001_init.sql`, `0002_seed.sql`).

```bash
docker compose up -d postgres
# apply SQL once, then:
cd apps/api
set AUTH_TESTING_ENABLED=true
set DATABASE_URL=postgresql+psycopg://postgres:postgres@127.0.0.1:5432/mytripspots
pip install -e ".[dev]"   # or: pip install pytest httpx && pip install -e .
python -m pytest
```

Test auth header: `Authorization: Bearer test:user_demo_1` (matches seed user).  
Never enable `AUTH_TESTING_ENABLED` in production.

## Web unit + component (Vitest)

```bash
pnpm test:web
```

## Web E2E (Playwright)

```bash
pnpm exec playwright install chromium   # first time only
pnpm test:e2e
```

Uses `http://127.0.0.1:3001` and mocks `/graphql` for place page scenarios.

## Clerk / full stack E2E (later)

Optional future job: real API + `@clerk/testing` tokens in GitHub secrets for signed-in flows.
