import type { PlacesQuery, TripsQuery } from "@/graphql/generated/graphql";

const SESSION_KEY = "mytripspots_offline_session";
const TRIPS_KEY = "mytripspots_cached_trips";
const PLACES_PREFIX = "mytripspots_cached_places:";

export type CachedTrip = TripsQuery["myTrips"][number];
export type CachedPlace = PlacesQuery["tripPlaces"][number];

export type SessionSnapshot = {
  signedIn: boolean;
  userId?: string;
  displayName?: string;
  avatarUrl?: string;
  savedAt: number;
};

type TripsCacheEnvelope = {
  userId: string;
  trips: CachedTrip[];
};

function placesKey(userId: string, tripId: string): string {
  return `${PLACES_PREFIX}${userId}:${tripId}`;
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

export function clearSessionSnapshot(): void {
  try {
    localStorage.removeItem(SESSION_KEY);
  } catch {
    /* ignore */
  }
}

export function clearOfflineDataCache(): void {
  try {
    localStorage.removeItem(TRIPS_KEY);
    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith(PLACES_PREFIX)) keysToRemove.push(key);
    }
    for (const key of keysToRemove) {
      localStorage.removeItem(key);
    }
  } catch {
    /* ignore */
  }
}

export function saveTripsCache(userId: string, trips: CachedTrip[]): void {
  try {
    const envelope: TripsCacheEnvelope = { userId, trips };
    localStorage.setItem(TRIPS_KEY, JSON.stringify(envelope));
  } catch {
    /* ignore */
  }
}

export function getTripsCache(userId: string): CachedTrip[] | null {
  try {
    const raw = localStorage.getItem(TRIPS_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as TripsCacheEnvelope | CachedTrip[];
    if (Array.isArray(parsed)) return null;
    if (parsed?.userId !== userId) return null;
    return Array.isArray(parsed.trips) ? parsed.trips : null;
  } catch {
    return null;
  }
}

export function savePlacesCache(userId: string, tripId: string, places: CachedPlace[]): void {
  try {
    localStorage.setItem(placesKey(userId, tripId), JSON.stringify(places));
  } catch {
    /* ignore */
  }
}

export function getPlacesCache(userId: string, tripId: string): CachedPlace[] | null {
  try {
    const raw = localStorage.getItem(placesKey(userId, tripId));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as CachedPlace[];
    return Array.isArray(parsed) ? parsed : null;
  } catch {
    return null;
  }
}
