# VPS deployment (Contabo / spotstogo.online)

Self-host MyTripSpots on a single VPS: Caddy on :80/:443, each app on `127.0.0.1` ports, shared Postgres in `/opt/infra`.

Production URLs:

| Service | URL |
|---------|-----|
| Web | `https://spotstogo.online` |
| API / GraphQL | `https://api.spotstogo.online/graphql` |
| API health | `https://api.spotstogo.online/health` |

## Architecture

| Component | VPS path / port | Image |
|-----------|-----------------|-------|
| Postgres | `/opt/infra`, `127.0.0.1:5432` | `postgres:16` |
| API | `/opt/mytripspots`, `127.0.0.1:8000` | `ghcr.io/andreydos/mytripspots-api:prod-N` |
| Web | `/opt/mytripspots`, `127.0.0.1:3001` | `ghcr.io/andreydos/mytripspots-web:prod-N` |
| Caddy | `/etc/caddy/Caddyfile` | host service |

Apps connect to Postgres via Docker network `infra` (hostname `infra-postgres`).

## 1. Shared Postgres (`/opt/infra`)

Requirements:

- Network `infra` exists (`docker network ls | grep infra`)
- Database `mytripspots` + user created
- Schema applied: `infra/sql/0001_init.sql`
- Port bound to `127.0.0.1:5432` only

## 2. Release images (GitHub Actions)

Push a tag `prod-N` (e.g. `prod-2`):

```bash
git tag prod-2
git push origin prod-2
```

Workflow [`.github/workflows/release.yml`](../.github/workflows/release.yml) builds and pushes:

- `ghcr.io/andreydos/mytripspots-web:prod-N`
- `ghcr.io/andreydos/mytripspots-api:prod-N`

### GitHub repository secrets

| Secret | Example value |
|--------|---------------|
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | `pk_test_...` |
| `NEXT_PUBLIC_API_GRAPHQL_URL` | `https://api.spotstogo.online/graphql` |

Remove `NEXT_PUBLIC_BASE_PATH` from GitHub secrets if it was set — the web app is served from the domain root (no `/mts` prefix).

`GITHUB_TOKEN` is used automatically for GHCR push.

## 3. App directory on VPS

```bash
sudo mkdir -p /opt/mytripspots
sudo chown andrew:andrew /opt/mytripspots
chmod 750 /opt/mytripspots
```

Copy [`deploy/vps/docker-compose.yml`](../deploy/vps/docker-compose.yml) to `/opt/mytripspots/docker-compose.yml`.

Create env files from examples:

- [`deploy/vps/.env.web.example`](../deploy/vps/.env.web.example) → `/opt/mytripspots/.env.web`
- [`deploy/vps/.env.api.example`](../deploy/vps/.env.api.example) → `/opt/mytripspots/.env.api`

```bash
chmod 600 /opt/mytripspots/.env.web /opt/mytripspots/.env.api
```

`DATABASE_URL` in `.env.api` must use host `infra-postgres` when API runs in Docker on network `infra`.

## 4. Deploy / update

```bash
docker login ghcr.io -u YOUR_GITHUB_USER
cd /opt/mytripspots
TAG=prod-2 docker compose pull
TAG=prod-2 docker compose up -d --force-recreate
docker compose ps
docker compose logs -f --tail=50
```

## 5. Caddy (domain + HTTPS)

DNS (GoDaddy or your registrar):

```
A  @    → 161.97.74.213
A  www  → 161.97.74.213
A  api  → 161.97.74.213
```

Example Caddyfile: [`deploy/vps/Caddyfile.example`](../deploy/vps/Caddyfile.example)

```caddy
spotstogo.online, www.spotstogo.online {
    redir /mts / 301
    redir /mts/ / 301
    reverse_proxy 127.0.0.1:3001
}

api.spotstogo.online {
    reverse_proxy 127.0.0.1:8000
}
```

Apply:

```bash
sudo cp /opt/infra/Caddyfile /etc/caddy/Caddyfile
sudo caddy validate --config /etc/caddy/Caddyfile
sudo systemctl restart caddy
```

## 6. Smoke tests

- [ ] `https://spotstogo.online/` → 200, no redirect to `/mts`
- [ ] `https://spotstogo.online/_next/static/...` → 200 (not `/mts/_next/`)
- [ ] `https://spotstogo.online/mts` → 301 → `/`
- [ ] `https://api.spotstogo.online/health` → 200
- [ ] GraphQL from browser (DevTools) → 200, no CORS errors
- [ ] Clerk sign-in works
- [ ] Trips / map / photo upload smoke test
- [ ] PWA: `manifest.json` has `"start_url": "/"`, `"scope": "/"`

## 7. External services

Still required (not on VPS):

- **Clerk** — allowed origins: `https://spotstogo.online`, `https://www.spotstogo.online`; redirect URLs without `/mts` (e.g. `https://spotstogo.online/`, `https://spotstogo.online/sign-in`)
- **Cloudflare R2** — photo uploads; bucket CORS for browser PUT
- **Nominatim** — geocoding (default public OSM)

## 8. Local Docker build (optional)

From repo root:

```bash
docker build -f apps/web/Dockerfile \
  --build-arg NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_... \
  --build-arg NEXT_PUBLIC_API_GRAPHQL_URL=http://localhost:8000/graphql \
  -t mytripspots-web:local .

docker build -f apps/api/Dockerfile apps/api -t mytripspots-api:local
```

## Port map (do not conflict)

| Port | Service |
|------|---------|
| 3000 | mwacademy |
| 3001 | mytripspots-web |
| 8000 | mytripspots-api |
| 5432 | Postgres (localhost only) |
| 80/443 | Caddy |

## Migrating from `/mts` path routing

If the site was previously served at `https://spotstogo.online/mts`:

1. Rebuild and deploy the web image **without** `NEXT_PUBLIC_BASE_PATH` (removed from the repo).
2. Set `NEXT_PUBLIC_API_GRAPHQL_URL=https://api.spotstogo.online/graphql` in GitHub secrets.
3. Update Caddy: root → web, `api.spotstogo.online` → API (see example above).
4. Update `CORS_ALLOWED_ORIGINS` in `.env.api` (origins only, no path).
5. Update Clerk dashboard: remove `/mts` from redirect URLs.
6. Add DNS `A api → VPS IP` if using the API subdomain.
7. Optional: keep `301 /mts → /` in Caddy for old bookmarks.

The service worker bumps its shell cache on each build and unregisters legacy workers scoped under `/mts`.
