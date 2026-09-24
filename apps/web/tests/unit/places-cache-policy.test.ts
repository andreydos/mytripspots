import { describe, expect, it } from "vitest";
import { shouldPersistPlacesCache } from "@/lib/offline/app-cache";

describe("shouldPersistPlacesCache", () => {
  it("skips cache write when a search filter is active", () => {
    expect(shouldPersistPlacesCache("cafe")).toBe(false);
    expect(shouldPersistPlacesCache("  ")).toBe(false);
  });

  it("persists cache for unfiltered loads", () => {
    expect(shouldPersistPlacesCache("")).toBe(true);
  });
});
