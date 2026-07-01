import { afterEach, describe, expect, it } from "vitest";
import {
  getPlacesCache,
  getSessionSnapshot,
  getTripsCache,
  savePlacesCache,
  saveSessionSnapshot,
  saveTripsCache
} from "@/lib/offline/app-cache";
import { SEED_PLACE_ID, SEED_TRIP_ID } from "../fixtures/place";

afterEach(() => {
  localStorage.clear();
});

describe("app-cache", () => {
  it("round-trips trips cache", () => {
    const trips = [{ id: SEED_TRIP_ID, title: "Demo Trip", visibility: "private" }];
    saveTripsCache(trips);
    expect(getTripsCache()).toEqual(trips);
  });

  it("returns null for invalid session snapshot JSON", () => {
    localStorage.setItem("mytripspots_offline_session", "{not-json");
    expect(getSessionSnapshot()).toBeNull();
  });

  it("returns null when session snapshot lacks signedIn boolean", () => {
    localStorage.setItem("mytripspots_offline_session", JSON.stringify({ userId: "x" }));
    expect(getSessionSnapshot()).toBeNull();
  });

  it("returns signed-in session snapshot", () => {
    saveSessionSnapshot({ signedIn: true, displayName: "Demo User" });
    const snapshot = getSessionSnapshot();
    expect(snapshot?.signedIn).toBe(true);
    expect(snapshot?.displayName).toBe("Demo User");
    expect(typeof snapshot?.savedAt).toBe("number");
  });

  it("returns null when trips cache is not an array", () => {
    localStorage.setItem("mytripspots_cached_trips", JSON.stringify({ bad: true }));
    expect(getTripsCache()).toBeNull();
  });

  it("round-trips places cache per trip", () => {
    const places = [
      {
        id: SEED_PLACE_ID,
        tripId: SEED_TRIP_ID,
        title: "London",
        lat: 51.5072,
        lng: -0.1276,
        notes: "Seed place",
        visitedAt: null,
        createdAt: "2026-01-15T12:00:00+00:00",
        photos: []
      }
    ];
    savePlacesCache(SEED_TRIP_ID, places);
    expect(getPlacesCache(SEED_TRIP_ID)).toEqual(places);
  });
});
