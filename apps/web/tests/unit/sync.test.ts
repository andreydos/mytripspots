import { afterEach, describe, expect, it, vi } from "vitest";
import { getDrafts, putDraft, removeDraft } from "@/lib/offline/drafts";
import { syncDrafts } from "@/lib/offline/sync";
import { SEED_TRIP_ID } from "../fixtures/place";

afterEach(() => {
  localStorage.clear();
});

describe("syncDrafts", () => {
  it("calls onSync for each draft newest first", async () => {
    putDraft({
      localId: "older",
      tripId: SEED_TRIP_ID,
      title: "Older",
      lat: 1,
      lng: 2,
      updatedAt: 1
    });
    putDraft({
      localId: "newer",
      tripId: SEED_TRIP_ID,
      title: "Newer",
      lat: 3,
      lng: 4,
      updatedAt: 2
    });

    const order: string[] = [];
    await syncDrafts(async (localId) => {
      order.push(localId);
    });

    expect(order).toEqual(["newer", "older"]);
  });

  it("does nothing when offline", async () => {
    const onSync = vi.fn();
    Object.defineProperty(window.navigator, "onLine", { value: false, configurable: true });
    putDraft({
      localId: "draft",
      tripId: SEED_TRIP_ID,
      title: "Draft",
      lat: 0,
      lng: 0,
      updatedAt: 1
    });

    await syncDrafts(onSync);

    expect(onSync).not.toHaveBeenCalled();
    Object.defineProperty(window.navigator, "onLine", { value: true, configurable: true });
  });
});

describe("removeDraft", () => {
  it("removes a draft by localId", () => {
    putDraft({
      localId: "keep",
      tripId: SEED_TRIP_ID,
      title: "Keep",
      lat: 0,
      lng: 0,
      updatedAt: 1
    });
    putDraft({
      localId: "drop",
      tripId: SEED_TRIP_ID,
      title: "Drop",
      lat: 1,
      lng: 1,
      updatedAt: 2
    });

    removeDraft("drop");

    expect(getDrafts()).toHaveLength(1);
    expect(getDrafts()[0]?.localId).toBe("keep");
  });
});
