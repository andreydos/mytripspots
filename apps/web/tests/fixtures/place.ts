/** Stable IDs from infra/sql/0002_seed.sql */
export const SEED_USER_ID = "11111111-1111-1111-1111-111111111111";
export const SEED_TRIP_ID = "22222222-2222-2222-2222-222222222222";
export const SEED_PLACE_ID = "33333333-3333-3333-3333-333333333333";

export const seedPlaceGraphQL = {
  id: SEED_PLACE_ID,
  tripId: SEED_TRIP_ID,
  title: "London",
  lat: 51.5072,
  lng: -0.1276,
  notes: "Seed place",
  visitedAt: null as string | null,
  createdAt: "2026-01-15T12:00:00+00:00",
  photos: [] as Array<{
    id: string;
    r2Key: string;
    mime: string;
    width: number | null;
    height: number | null;
  }>
};
