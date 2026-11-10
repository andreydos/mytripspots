import { graphql, HttpResponse } from "msw";
import { screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { TravelDashboard } from "@/components/travel-dashboard";
import { getDrafts, putDraft } from "@/lib/offline/drafts";
import { saveTripsCache } from "@/lib/offline/app-cache";
import { SEED_PLACE_ID, SEED_TRIP_ID } from "../fixtures/place";
import { server } from "../mocks/server";
import { renderDashboard } from "../utils/render-dashboard";

vi.mock("@clerk/nextjs", () => ({
  useAuth: () => ({
    isLoaded: true,
    getToken: async () => "test-token"
  }),
  SignedIn: ({ children }: { children: React.ReactNode }) => children,
  SignedOut: () => null,
  SignInButton: () => null,
  UserButton: () => null
}));

describe("TravelDashboard draft sync", () => {
  beforeEach(() => {
    localStorage.clear();
    saveTripsCache([{ id: SEED_TRIP_ID, title: "Demo Trip", visibility: "private" }]);
    putDraft({
      localId: "draft-offline-1",
      tripId: SEED_TRIP_ID,
      title: "Queued waterfall",
      notes: "Sync me",
      lat: 64.15,
      lng: -21.67,
      updatedAt: Date.now()
    });
  });

  it("pushes offline place drafts when the dashboard is online", async () => {
    let createPlaceCalls = 0;

    server.use(
      graphql.query("Trips", () =>
        HttpResponse.json({
          data: {
            myTrips: [{ id: SEED_TRIP_ID, title: "Demo Trip", visibility: "private", __typename: "TripType" }]
          }
        })
      ),
      graphql.mutation("CreatePlace", ({ variables }) => {
        createPlaceCalls += 1;
        return HttpResponse.json({
          data: {
            createPlace: {
              id: "synced-place",
              tripId: variables?.tripId,
              title: variables?.title,
              lat: variables?.lat,
              lng: variables?.lng,
              notes: variables?.notes,
              visitedAt: null,
              createdAt: new Date().toISOString(),
              photos: [],
              __typename: "PlaceType"
            }
          }
        });
      }),
      graphql.query("Places", () =>
        HttpResponse.json({
          data: {
            tripPlaces: [
              {
                id: SEED_PLACE_ID,
                tripId: SEED_TRIP_ID,
                title: "Queued waterfall",
                lat: 64.15,
                lng: -21.67,
                notes: "Sync me",
                visitedAt: null,
                createdAt: new Date().toISOString(),
                photos: [],
                __typename: "PlaceType"
              }
            ]
          }
        })
      )
    );

    renderDashboard(<TravelDashboard />, { networkOnline: true });

    await waitFor(() => {
      expect(createPlaceCalls).toBe(1);
      expect(getDrafts()).toHaveLength(0);
    });

    expect(await screen.findByText("Queued waterfall")).toBeInTheDocument();
  });
});
