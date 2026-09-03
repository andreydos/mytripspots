import { afterEach, describe, expect, it } from "vitest";
import {
  clearOfflineDataCache,
  clearSessionSnapshot,
  getPlacesCache,
  getSessionSnapshot,
  getTripsCache,
  savePlacesCache,
  saveSessionSnapshot,
  saveTripsCache
} from "@/lib/offline/app-cache";
import { SEED_PLACE_ID, SEED_TRIP_ID } from "../fixtures/place";

const USER_A = "user-a";
const USER_B = "user-b";

afterEach(() => {
  localStorage.clear();
});

describe("app-cache", () => {
  it("round-trips trips cache for the owning user", () => {
    const trips = [{ id: SEED_TRIP_ID, title: "Demo Trip", visibility: "private" }];
    saveTripsCache(USER_A, trips);
    expect(getTripsCache(USER_A)).toEqual(trips);
  });

  it("returns null when trips cache belongs to a different user", () => {
    const trips = [{ id: SEED_TRIP_ID, title: "Demo Trip", visibility: "private" }];
    saveTripsCache(USER_A, trips);
    expect(getTripsCache(USER_B)).toBeNull();
  });

  it("returns null for legacy unscoped trips cache arrays", () => {
    localStorage.setItem("mytripspots_cached_trips", JSON.stringify([{ id: SEED_TRIP_ID }]));
    expect(getTripsCache(USER_A)).toBeNull();
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

  it("clears session snapshot", () => {
    saveSessionSnapshot({ signedIn: true, userId: USER_A });
    clearSessionSnapshot();
    expect(getSessionSnapshot()).toBeNull();
  });

  it("returns null when trips cache is not an array", () => {
    localStorage.setItem(
      "mytripspots_cached_trips",
      JSON.stringify({ userId: USER_A, trips: { bad: true } })
    );
    expect(getTripsCache(USER_A)).toBeNull();
  });

  it("round-trips places cache per user and trip", () => {
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
    savePlacesCache(USER_A, SEED_TRIP_ID, places);
    expect(getPlacesCache(USER_A, SEED_TRIP_ID)).toEqual(places);
    expect(getPlacesCache(USER_B, SEED_TRIP_ID)).toBeNull();
  });

  it("clearOfflineDataCache removes trips and places for all users", () => {
    saveTripsCache(USER_A, [{ id: SEED_TRIP_ID, title: "Trip", visibility: "private" }]);
    savePlacesCache(USER_A, SEED_TRIP_ID, []);
    clearOfflineDataCache();
    expect(getTripsCache(USER_A)).toBeNull();
    expect(getPlacesCache(USER_A, SEED_TRIP_ID)).toBeNull();
  });
});
