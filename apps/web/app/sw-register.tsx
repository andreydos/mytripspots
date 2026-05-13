"use client";

import { useEffect } from "react";

/**
 * In `next dev`, chunk URLs change often; a cached document can reference old `/_next/static/*`
 * files that no longer exist, so offline reload fails to load JS (no React, no routing logs).
 * Test offline *reload* with `pnpm build && pnpm start`, or opt in: `NEXT_PUBLIC_ENABLE_SW_IN_DEV=true`.
 */
const swEnabled =
  process.env.NODE_ENV === "production" || process.env.NEXT_PUBLIC_ENABLE_SW_IN_DEV === "true";

export function ServiceWorkerRegister() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;
    if (!swEnabled) {
      void navigator.serviceWorker.getRegistrations().then((regs) => {
        for (const r of regs) void r.unregister();
      });
      return;
    }
    void navigator.serviceWorker.register("/sw.js").catch(() => undefined);
  }, []);
  return null;
}
