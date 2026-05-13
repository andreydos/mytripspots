// Bump SHELL cache only when precache list/strategy changes — not every deploy.
const CACHE_NAME = "mytripspots-shell-v6";
// Runtime: last good HTML + hashed Next chunks (URLs change each build → safe to cache by full URL).
const RUNTIME_CACHE = "mytripspots-runtime-v1778700003";
const DOCUMENT_KEY = "mytripspots-root-doc";

const SHELL_FILES = ["/manifest.json"];

function offlineResponse() {
  return new Response("", { status: 503, statusText: "Network error", headers: { "Cache-Control": "no-store" } });
}

function offlineDocument() {
  return new Response("<!DOCTYPE html><html><body>Offline</body></html>", {
    status: 503,
    statusText: "Offline",
    headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store" }
  });
}

self.addEventListener("install", (event) => {
  self.skipWaiting();
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(SHELL_FILES)));
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME && k !== RUNTIME_CACHE).map((k) => caches.delete(k))).then(() =>
        self.clients.claim()
      )
    )
  );
});

function cacheableResponse(res) {
  return res && res.ok && res.type === "basic";
}

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;
  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin) return;

  // Let the browser handle these directly (avoids synthetic 503 for icons when offline).
  if (url.pathname === "/icon.svg" || url.pathname === "/favicon.ico") return;

  // API: never use caches.match — a stale cached 200 for /api/ping breaks offline detection.
  if (url.pathname.startsWith("/api/")) {
    event.respondWith(fetch(event.request, { cache: "no-store" }).catch(() => offlineResponse()));
    return;
  }

  // Hashed Next assets: try cache, then network, then cache successful responses (offline replay after one online visit).
  if (url.pathname.startsWith("/_next/static/")) {
    event.respondWith(
      caches.open(RUNTIME_CACHE).then((cache) =>
        cache.match(event.request).then((cached) => {
          if (cached) return cached;
          return fetch(event.request)
            .then((response) => {
              if (cacheableResponse(response)) {
                cache.put(event.request, response.clone());
              }
              return response;
            })
            .catch(() => offlineResponse());
        })
      )
    );
    return;
  }

  // Other /_next/* (HMR, dev manifests): network only — must still resolve to a Response for respondWith
  if (url.pathname.startsWith("/_next/")) {
    event.respondWith(fetch(event.request).catch(() => offlineResponse()));
    return;
  }

  // Navigation: prefer network, cache successful HTML for offline replay.
  if (event.request.mode === "navigate") {
    event.respondWith(
      fetch(event.request, { cache: "no-cache" })
        .then(async (response) => {
          if (cacheableResponse(response)) {
            const cache = await caches.open(RUNTIME_CACHE);
            cache.put(event.request, response.clone());
          }
          return response;
        })
        .catch(async () => {
          const cache = await caches.open(RUNTIME_CACHE);
          const hit = await cache.match(event.request);
          if (hit) return hit;
          return offlineDocument();
        })
    );
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached;
      return fetch(event.request).catch(() => offlineResponse());
    })
  );
});
