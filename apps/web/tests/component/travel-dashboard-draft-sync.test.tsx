import { graphql, HttpResponse } from "msw";
import { screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { TravelDashboard } from "@/components/travel-dashboard";
import { getDrafts, putDraft } from "@/lib/offline/drafts";
import { saveTripsCache } from "@/lib/offline/app-cache";
import { SEED_TRIP_ID } from "../fixtures/place";
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

const demoTrip = {
  id: SEED_TRIP_ID,
  title: "Demo Trip",
  visibility: "private",
  __typename: "TripType"
};

function onlineDashboardHandlers() {
  return [
    graphql.query("Trips", () =>
      HttpResponse.json({
        data: {
          myTrips: [demoTrip]
        }
      })
    ),
    graphql.query("Places", () =>
      HttpResponse.json({
        data: {
          tripPlaces: []
        }
      })
    )
  ];
}

describe("TravelDashboard draft sync", () => {
  beforeEach(() => {
    localStorage.clear();
    saveTripsCache([{ id: SEED_TRIP_ID, title: "Demo Trip", visibility: "private" }]);
    putDraft({
      localId: "draft-sync-1",
      tripId: SEED_TRIP_ID,
      title: "Synced waterfall",
      notes: "Saved offline",
      lat: 64.15,
      lng: -21.67,
      updatedAt: Date.now()
    });
  });

  it("syncs pending drafts when online on mount", async () => {
    let createPlaceCalled = false;
    server.use(
      ...onlineDashboardHandlers(),
      graphql.mutation("CreatePlace", ({ variables }) => {
        createPlaceCalled = true;
        expect(variables).toMatchObject({
          tripId: SEED_TRIP_ID,
          title: "Synced waterfall",
          notes: "Saved offline",
          lat: 64.15,
          lng: -21.67
        });
        return HttpResponse.json({
          data: {
            createPlace: {
              id: "new-place",
              __typename: "PlaceType"
            }
          }
        });
      })
    );

    renderDashboard(<TravelDashboard />, { networkOnline: true });

    await waitFor(() => {
      expect(createPlaceCalled).toBe(true);
      expect(getDrafts()).toHaveLength(0);
    });
  });

  it("keeps drafts when sync fails", async () => {
    server.use(
      ...onlineDashboardHandlers(),
      graphql.mutation("CreatePlace", () =>
        HttpResponse.json({ errors: [{ message: "Server error" }] }, { status: 500 })
      )
    );

    renderDashboard(<TravelDashboard />, { networkOnline: true });

    await waitFor(() => {
      expect(screen.getByText("Add place")).toBeInTheDocument();
    });

    expect(getDrafts()).toHaveLength(1);
    expect(getDrafts()[0]?.title).toBe("Synced waterfall");
  });
});
