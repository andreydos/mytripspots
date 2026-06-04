import { config as loadEnv } from "dotenv";
import { defineConfig, devices } from "@playwright/test";
import { resolve } from "node:path";

loadEnv({ path: resolve(__dirname, ".env.local") });

if (!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY || !process.env.CLERK_SECRET_KEY) {
  throw new Error(
    "E2E requires NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY and CLERK_SECRET_KEY (apps/web/.env.local or CI secrets)."
  );
}

const port = Number(process.env.PLAYWRIGHT_PORT ?? 3001);
const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? `http://127.0.0.1:${port}`;

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: process.env.CI ? [["github"], ["html", { open: "never" }]] : [["list"], ["html", { open: "on-failure" }]],
  use: {
    baseURL,
    trace: "on-first-retry",
    screenshot: "only-on-failure"
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: {
    command: process.env.CI ? "pnpm start" : "pnpm dev",
    url: baseURL,
    reuseExistingServer: !process.env.CI,
    timeout: process.env.CI ? 60_000 : 120_000,
    env: {
      PORT: String(port),
      HOSTNAME: "127.0.0.1",
      NEXT_PUBLIC_API_GRAPHQL_URL:
        process.env.NEXT_PUBLIC_API_GRAPHQL_URL ?? "http://localhost:8000/graphql",
      NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY,
      CLERK_SECRET_KEY: process.env.CLERK_SECRET_KEY
    }
  }
});
