import { afterEach, describe, expect, it, vi } from "vitest";
import { getDrafts, putDraft } from "@/lib/offline/drafts";
import { syncPlaceDrafts } from "@/lib/offline/sync";
import { SEED_TRIP_ID } from "../fixtures/place";

afterEach(() => {
  localStorage.clear();
});

describe("syncPlaceDrafts", () => {
  it("skips when navigator is offline", async () => {
    const publish = vi.fn();
    vi.stubGlobal("navigator", { onLine: false });
    putDraft({
      localId: "d1",
      tripId: SEED_TRIP_ID,
      title: "Draft",
      lat: 1,
      lng: 2,
      updatedAt: 1
    });

    await syncPlaceDrafts(publish);

    expect(publish).not.toHaveBeenCalled();
    expect(getDrafts()).toHaveLength(1);
    vi.unstubAllGlobals();
  });

  it("publishes drafts and removes them on success", async () => {
    vi.stubGlobal("navigator", { onLine: true });
    putDraft({
      localId: "d1",
      tripId: SEED_TRIP_ID,
      title: "First",
      lat: 1,
      lng: 2,
      updatedAt: 1
    });
    putDraft({
      localId: "d2",
      tripId: SEED_TRIP_ID,
      title: "Second",
      lat: 3,
      lng: 4,
      updatedAt: 2
    });

    const published: string[] = [];
    await syncPlaceDrafts(async (draft) => {
      published.push(draft.localId);
    });

    expect(published).toEqual(["d1", "d2"]);
    expect(getDrafts()).toHaveLength(0);
    vi.unstubAllGlobals();
  });

  it("keeps drafts that fail to publish", async () => {
    vi.stubGlobal("navigator", { onLine: true });
    putDraft({
      localId: "ok",
      tripId: SEED_TRIP_ID,
      title: "OK",
      lat: 0,
      lng: 0,
      updatedAt: 1
    });
    putDraft({
      localId: "bad",
      tripId: SEED_TRIP_ID,
      title: "Bad",
      lat: 1,
      lng: 1,
      updatedAt: 2
    });

    await syncPlaceDrafts(async (draft) => {
      if (draft.localId === "bad") throw new Error("network");
    });

    expect(getDrafts().map((d) => d.localId)).toEqual(["bad"]);
    vi.unstubAllGlobals();
  });
});
