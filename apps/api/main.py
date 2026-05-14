import time
import uuid
from collections import defaultdict, deque

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from strawberry.fastapi import GraphQLRouter

from app.graphql.schema import schema
from app.settings import settings


app = FastAPI(title="MyTripSpots API", version="0.1.0")

if settings.app_env.lower() in ("development", "dev"):
    # Localhost: any port via regex. Also honor CORS_ALLOWED_ORIGINS (e.g. a prod
    # frontend URL on Render if APP_ENV was left at the default "development").
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origins_list(),
        allow_origin_regex=r"http://(localhost|127\.0\.0\.1)(:\d+)?",
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )
else:
    _origins = settings.cors_origins_list()
    if not _origins:
        raise RuntimeError(
            "Set CORS_ALLOWED_ORIGINS when APP_ENV is production (comma-separated frontend origins, e.g. https://your-app.vercel.app)."
        )
    app.add_middleware(
        CORSMiddleware,
        allow_origins=_origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )
graphql_app = GraphQLRouter(schema)
app.include_router(graphql_app, prefix="/graphql")
rate_windows: dict[str, deque[float]] = defaultdict(deque)


@app.middleware("http")
async def request_id_and_logging(request: Request, call_next):
    request_id = str(uuid.uuid4())
    start = time.time()
    response = await call_next(request)
    latency_ms = int((time.time() - start) * 1000)
    response.headers["x-request-id"] = request_id
    print(
        {
            "request_id": request_id,
            "endpoint": request.url.path,
            "status_code": response.status_code,
            "latency_ms": latency_ms,
            "user_id": request.headers.get("x-user-id"),
        }
    )
    return response


@app.middleware("http")
async def rate_limiter(request: Request, call_next):
    if request.method == "OPTIONS":
        return await call_next(request)
    ip = request.client.host if request.client else "unknown"
    key = f"{ip}:{request.url.path}"
    now = time.time()
    window = rate_windows[key]
    while window and now - window[0] > 60:
        window.popleft()

    limit = 30 if request.headers.get("Authorization") is None else 120
    if request.url.path.startswith("/graphql") and request.method == "POST":
        limit = min(limit, 60)
    if len(window) >= limit:
        return JSONResponse({"error": "rate limit exceeded"}, status_code=429)
    window.append(now)
    return await call_next(request)


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


@app.get("/ready")
def ready() -> dict[str, str]:
    return {"status": "ready"}
