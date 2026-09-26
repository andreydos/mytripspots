import { beforeEach, describe, expect, it, vi } from "vitest";
import { probeSameOriginReachable } from "@/lib/offline/reachability";

describe("probeSameOriginReachable", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("returns true when same-origin /api/ping succeeds", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async (url: string) => {
        expect(url).toBe("https://app.example/api/ping");
        return new Response(JSON.stringify({ ok: true }), { status: 200 });
      })
    );

    await expect(probeSameOriginReachable("https://app.example")).resolves.toBe(true);
  });

  it("returns false when same-origin /api/ping fails", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response("", { status: 503 }))
    );

    await expect(probeSameOriginReachable("https://app.example")).resolves.toBe(false);
  });
});
