const SESSION_KEY = "mytripspots_offline_session";
const TRIPS_KEY = "mytripspots_cached_trips";

export type CachedTrip = { id: string; title: string; visibility: string };
export type CachedPlace = { id: string; title: string; lat: number; lng: number; notes?: string };

export type SessionSnapshot = {
  signedIn: boolean;
  userId?: string;
  displayName?: string;
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

export function saveTripsCache(trips: CachedTrip[]): void {
  try {
    localStorage.setItem(TRIPS_KEY, JSON.stringify(trips));
  } catch {
    /* ignore */
  }
}

export function getTripsCache(): CachedTrip[] | null {
  try {
    const raw = localStorage.getItem(TRIPS_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as CachedTrip[];
    return Array.isArray(parsed) ? parsed : null;
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
