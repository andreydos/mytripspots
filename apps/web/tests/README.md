# Web tests

## Layout

| Path | Layer | Runner |
|------|--------|--------|
| `tests/unit/` | Pure helpers (`lib/place-display`) | Vitest |
| `tests/component/` | React + Apollo + MSW | Vitest + jsdom |
| `tests/mocks/` | GraphQL handlers | MSW |
| `tests/fixtures/` | Seed IDs aligned with `infra/sql/0002_seed.sql` | — |
| `e2e/` | Browser flows | Playwright |

## Commands (from repo root)

```bash
pnpm test:web          # Vitest unit + component
pnpm --filter web test:watch
pnpm test:e2e          # Playwright (starts dev server on :3001)
pnpm --filter web test:e2e:ui
```

E2E mocks GraphQL in the browser (no Clerk/API required for place page tests).

## Adding a test

1. Add or extend `.graphql` operations and run `pnpm codegen`.
2. Add MSW handler in `tests/mocks/graphql-handlers.ts` if needed.
3. Component test: `renderWithProviders(<YourComponent />)`.
4. E2E: reuse `e2e/helpers/graphql-mock.ts` or extend route mocks.
