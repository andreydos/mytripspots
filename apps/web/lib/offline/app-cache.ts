import type { PlacesQuery, TripsQuery } from "@/graphql/generated/graphql";

const SESSION_KEY = "mytripspots_offline_session";
const TRIPS_KEY = "mytripspots_cached_trips";

export type CachedTrip = TripsQuery["myTrips"][number];
export type CachedPlace = PlacesQuery["tripPlaces"][number];

export type SessionSnapshot = {
  signedIn: boolean;
  userId?: string;
  displayName?: string;
  avatarUrl?: string;
  savedAt: number;
};

function placesKey(tripId: string): string {
  return `mytripspots_cached_places:${tripId}`;
}

export function saveSessionSnapshot(partial: Omit<SessionSnapshot, "savedAt">): void {
  try {
    const next: SessionSnapshot = {
      ...partial,
      savedAt: Date.now()
    };
    localStorage.setItem(SESSION_KEY, JSON.stringify(next));
  } catch {
    /* ignore quota / private mode */
  }
}

export function getSessionSnapshot(): SessionSnapshot | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as SessionSnapshot;
    if (typeof parsed?.signedIn !== "boolean") return null;
    return parsed;
  } catch {
    return null;
  }
}

type TripsCacheEnvelope = {
  userId?: string;
  trips: CachedTrip[];
};

function parseTripsCache(raw: string): TripsCacheEnvelope | CachedTrip[] | null {
  const parsed = JSON.parse(raw) as TripsCacheEnvelope | CachedTrip[];
  if (Array.isArray(parsed)) return parsed;
  if (parsed && Array.isArray(parsed.trips)) return parsed;
  return null;
}

/** Reject cached trips that belong to another signed-in user (shared-browser account switch). */
function tripsMatchUser(data: TripsCacheEnvelope | CachedTrip[], expectedUserId?: string | null): CachedTrip[] | null {
  if (Array.isArray(data)) {
    if (!expectedUserId) return data;
    const snap = getSessionSnapshot();
    if (snap?.userId && snap.userId !== expectedUserId) return null;
    if (!snap?.userId) return null;
    return data;
  }
  const trips = data.trips;
  if (!expectedUserId) return trips;
  if (data.userId && data.userId !== expectedUserId) return null;
  if (!data.userId) {
    const snap = getSessionSnapshot();
    if (snap?.userId && snap.userId !== expectedUserId) return null;
    if (!snap?.userId) return null;
  }
  return trips;
}

export function saveTripsCache(trips: CachedTrip[], userId?: string | null): void {
  try {
    const payload: TripsCacheEnvelope = { trips, ...(userId ? { userId } : {}) };
    localStorage.setItem(TRIPS_KEY, JSON.stringify(payload));
  } catch {
    /* ignore */
  }
}

export function getTripsCache(expectedUserId?: string | null): CachedTrip[] | null {
  try {
    const raw = localStorage.getItem(TRIPS_KEY);
    if (!raw) return null;
    const parsed = parseTripsCache(raw);
    if (!parsed) return null;
    return tripsMatchUser(parsed, expectedUserId);
  } catch {
    return null;
  }
}

export function savePlacesCache(tripId: string, places: CachedPlace[]): void {
  try {
    localStorage.setItem(placesKey(tripId), JSON.stringify(places));
  } catch {
    /* ignore */
  }
}

export function getPlacesCache(tripId: string): CachedPlace[] | null {
  try {
    const raw = localStorage.getItem(placesKey(tripId));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as CachedPlace[];
    return Array.isArray(parsed) ? parsed : null;
  } catch {
    return null;
  }
}
