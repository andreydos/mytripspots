# Architecture

## Core Components
- `apps/web`: MyTripSpots Next.js PWA with Clerk auth, OSM map, offline drafts and sync queue.
- `apps/api`: FastAPI + Strawberry GraphQL API, Clerk token validation, owner-scoped CRUD.
- `infra/sql`: PostgreSQL migrations for Supabase-compatible schema.
- `Cloudflare R2`: object storage for place photos via presigned upload URLs.

## Data Flow
1. Web authenticates via Clerk and gets bearer token.
2. GraphQL API validates token, bootstraps user in `users` by `clerk_user_id`.
3. CRUD operations enforce owner access with `users.id` UUID linkage.
4. Photo uploads use `init_upload` -> direct PUT to R2 -> `complete_upload`.
5. Offline drafts are stored locally and synced when connection returns.
