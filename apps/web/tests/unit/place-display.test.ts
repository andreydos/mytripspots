import { describe, expect, it } from "vitest";
import { formatCoord, formatWhen, shortId } from "@/lib/place-display";

describe("place-display", () => {
  it("formatCoord fixes five decimal places", () => {
    expect(formatCoord(51.5072)).toBe("51.50720");
  });

  it("formatWhen returns Not set for empty values", () => {
    expect(formatWhen(null)).toBe("Not set");
    expect(formatWhen(undefined)).toBe("Not set");
  });

  it("formatWhen formats valid ISO strings", () => {
    const result = formatWhen("2026-01-15T12:00:00.000Z");
    expect(result).not.toBe("Not set");
    expect(result.length).toBeGreaterThan(0);
  });

  it("shortId truncates long UUIDs", () => {
    expect(shortId("33333333-3333-3333-3333-333333333333")).toBe("33333333…");
    expect(shortId("short")).toBe("short");
  });
});
