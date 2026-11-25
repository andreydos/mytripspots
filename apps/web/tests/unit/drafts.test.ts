import { afterEach, describe, expect, it } from "vitest";
import { getDrafts, mergePlacesWithDrafts, putDraft } from "@/lib/offline/drafts";
import { SEED_TRIP_ID } from "../fixtures/place";

afterEach(() => {
  localStorage.clear();
});

describe("drafts", () => {
  it("returns empty list when no drafts stored", () => {
    expect(getDrafts()).toEqual([]);
  });

  it("upserts drafts by localId", () => {
    const localId = "draft-1";
    putDraft({
      localId,
      tripId: SEED_TRIP_ID,
      title: "First title",
      lat: 1,
      lng: 2,
      updatedAt: 1
    });
    putDraft({
      localId,
      tripId: SEED_TRIP_ID,
      title: "Updated title",
      lat: 3,
      lng: 4,
      updatedAt: 2
    });

    const drafts = getDrafts();
    expect(drafts).toHaveLength(1);
    expect(drafts[0]?.title).toBe("Updated title");
    expect(drafts[0]?.lat).toBe(3);
  });

  it("keeps separate drafts for different localIds", () => {
    putDraft({
      localId: "a",
      tripId: SEED_TRIP_ID,
      title: "A",
      lat: 0,
      lng: 0,
      updatedAt: 1
    });
    putDraft({
      localId: "b",
      tripId: SEED_TRIP_ID,
      title: "B",
      lat: 1,
      lng: 1,
      updatedAt: 2
    });

    expect(getDrafts()).toHaveLength(2);
  });

  it("mergePlacesWithDrafts appends draft pins not already in the server list", () => {
    putDraft({
      localId: "draft-99",
      tripId: SEED_TRIP_ID,
      title: "Offline pin",
      notes: "draft",
      lat: 10,
      lng: 20,
      updatedAt: 1
    });
    const merged = mergePlacesWithDrafts(SEED_TRIP_ID, [
      { id: "server-1", title: "Server", lat: 0, lng: 0, notes: null }
    ]);
    expect(merged).toHaveLength(2);
    expect(merged[1]).toMatchObject({ id: "draft-99", title: "Offline pin", lat: 10, lng: 20 });
  });
});
