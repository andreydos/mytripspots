import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const caddyExample = readFileSync(
  join(__dirname, "../../../../deploy/vps/Caddyfile.example"),
  "utf8"
);

describe("VPS Caddy same-origin API proxy", () => {
  it("proxies only GraphQL, not all /api/* (Next serves /api/ping)", () => {
    expect(caddyExample).not.toMatch(/handle\s+\/api\/\*/);
    expect(caddyExample).toMatch(/handle\s+\/api\/graphql/);
  });
});