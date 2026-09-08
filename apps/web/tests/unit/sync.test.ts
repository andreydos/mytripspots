import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { getDrafts, putDraft } from "@/lib/offline/drafts";
import { syncDrafts } from "@/lib/offline/sync";
import { SEED_TRIP_ID } from "../fixtures/place";

const sampleDraft = {
  localId: "draft-1",
  tripId: SEED_TRIP_ID,
  title: "Offline waterfall",
  notes: "Draft notes",
  lat: 64.15,
  lng: -21.67,
  updatedAt: 1
};

describe("syncDrafts", () => {
  beforeEach(() => {
    Object.defineProperty(window.navigator, "onLine", {
      value: true,
      configurable: true
    });
  });

  afterEach(() => {
    localStorage.clear();
    Object.defineProperty(window.navigator, "onLine", {
      value: true,
      configurable: true
    });
  });

  it("does nothing when navigator is offline", async () => {
    Object.defineProperty(window.navigator, "onLine", {
      value: false,
      configurable: true
    });
    putDraft(sampleDraft);

    await syncDrafts(async () => true);

    expect(getDrafts()).toHaveLength(1);
  });

  it("removes drafts after a successful sync", async () => {
    putDraft(sampleDraft);

    await syncDrafts(async () => true);

    expect(getDrafts()).toEqual([]);
  });

  it("keeps drafts when sync returns false", async () => {
    putDraft(sampleDraft);

    await syncDrafts(async () => false);

    expect(getDrafts()).toHaveLength(1);
  });

  it("keeps drafts when sync throws", async () => {
    putDraft(sampleDraft);

    await syncDrafts(async () => {
      throw new Error("network");
    });

    expect(getDrafts()).toHaveLength(1);
  });

  it("syncs drafts oldest first", async () => {
    const order: string[] = [];
    putDraft({ ...sampleDraft, localId: "older", updatedAt: 1 });
    putDraft({
      ...sampleDraft,
      localId: "newer",
      title: "Newer",
      updatedAt: 2
    });

    await syncDrafts(async (draft) => {
      order.push(draft.localId);
      return true;
    });

    expect(order).toEqual(["older", "newer"]);
    expect(getDrafts()).toEqual([]);
  });
});
