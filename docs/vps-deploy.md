# VPS deployment (Contabo)

Self-host MyTripSpots next to other apps on a single VPS: Caddy on :80/:443, each app on `127.0.0.1` ports, shared Postgres in `/opt/infra`.

## Architecture

| Component | VPS path / port | Image |
|-----------|-----------------|-------|
| Postgres | `/opt/infra`, `127.0.0.1:5432` | `postgres:16` |
| API | `/opt/mytripspots`, `127.0.0.1:8000` | `ghcr.io/andreydos/mytripspots-api:prod-N` |
| Web | `/opt/mytripspots`, `127.0.0.1:3001` | `ghcr.io/andreydos/mytripspots-web:prod-N` |
| Caddy | `/etc/caddy/Caddyfile` | host service |

Apps connect to Postgres via Docker network `infra` (hostname `infra-postgres`, container name from `/opt/infra`).

## 1. Shared Postgres (`/opt/infra`)

Already documented in the infra setup. Requirements:

- Network `infra` exists (`docker network ls | grep infra`)
- Database `mytripspots` + user created
- Schema applied: `infra/sql/0001_init.sql`
- Port bound to `127.0.0.1:5432` only

## 2. Release images (GitHub Actions)

Push a tag `prod-N` (e.g. `prod-1`):

```bash
git tag prod-1
git push origin prod-1
```

Workflow [`.github/workflows/release.yml`](../.github/workflows/release.yml) builds and pushes:

- `ghcr.io/andreydos/mytripspots-web:prod-N`
- `ghcr.io/andreydos/mytripspots-api:prod-N`

### GitHub repository secrets

| Secret | Used for |
|--------|----------|
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Web image build |
| `NEXT_PUBLIC_API_GRAPHQL_URL` | Web image build (e.g. `http://YOUR_IP/mts-api/graphql`) |
| `NEXT_PUBLIC_BASE_PATH` | Web image build (`/mts` until DNS; empty when on root domain) |

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

`DATABASE_URL` in `.env.api` must use host `infra-postgres` (container name from `/opt/infra`) when API runs in Docker on network `infra`.

## 4. Deploy / update

```bash
docker login ghcr.io -u YOUR_GITHUB_USER
cd /opt/mytripspots
TAG=prod-1 docker compose pull
TAG=prod-1 docker compose up -d
docker compose ps
docker compose logs -f --tail=50
```

## 5. Caddy (IP phase, path routing)

Until DNS is ready, add to `/etc/caddy/Caddyfile` (keep existing mwacademy routes):

```caddy
:80 {
    handle /mts-api* {
        uri strip_prefix /mts-api
        reverse_proxy 127.0.0.1:8000
    }
    handle /mts* {
        reverse_proxy 127.0.0.1:3001
    }
    handle {
        reverse_proxy 127.0.0.1:3000
    }
}
```

```bash
sudo caddy validate --config /etc/caddy/Caddyfile
sudo systemctl reload caddy
```

Smoke tests:

- Web: `http://YOUR_IP/mts`
- API health: `http://YOUR_IP/mts-api/health`
- GraphQL: `http://YOUR_IP/mts-api/graphql`

## 6. Caddy (domain + HTTPS)

When DNS points to the VPS:

```caddy
mytripspots.example.com {
    reverse_proxy 127.0.0.1:3001
}
api.mytripspots.example.com {
    reverse_proxy 127.0.0.1:8000
}
```

Rebuild web with `NEXT_PUBLIC_BASE_PATH` empty and `NEXT_PUBLIC_API_GRAPHQL_URL=https://api.mytripspots.example.com/graphql`. Update `CORS_ALLOWED_ORIGINS` in `.env.api`.

## 7. External services

Still required (not on VPS):

- **Clerk** — auth; add allowed origins for IP or domain
- **Cloudflare R2** — photo uploads; bucket CORS for browser PUT
- **Nominatim** — geocoding (default public OSM)

## 8. Local Docker build (optional)

From repo root:

```bash
docker build -f apps/web/Dockerfile \
  --build-arg NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_... \
  --build-arg NEXT_PUBLIC_API_GRAPHQL_URL=http://localhost:8000/graphql \
  --build-arg NEXT_PUBLIC_BASE_PATH= \
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
