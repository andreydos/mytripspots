import time
import uuid
from collections import defaultdict, deque

from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from strawberry.fastapi import GraphQLRouter

from app.graphql.schema import schema

app = FastAPI(title="Travel PWA API", version="0.1.0")
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
