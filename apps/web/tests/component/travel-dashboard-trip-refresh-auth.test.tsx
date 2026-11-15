import { graphql, HttpResponse } from "msw";
import { waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { TravelDashboard } from "@/components/travel-dashboard";
import { getTripsCache, saveTripsCache } from "@/lib/offline/app-cache";
import { server } from "../mocks/server";
import { renderDashboard } from "../utils/render-dashboard";

const authState = vi.hoisted(() => ({
  userId: "user-a" as string | null,
  isSignedIn: true
}));

vi.mock("@clerk/nextjs", () => ({
  useAuth: () => ({
    isLoaded: true,
    isSignedIn: authState.isSignedIn,
    userId: authState.userId,
    getToken: async () => (authState.isSignedIn ? "test-token" : null)
  }),
  SignedIn: ({ children }: { children: React.ReactNode }) => children,
  SignedOut: () => null,
  SignInButton: () => null,
  UserButton: () => null
}));

describe("TravelDashboard trip refresh auth session", () => {
  beforeEach(() => {
    localStorage.clear();
    authState.userId = "user-a";
    authState.isSignedIn = true;
    saveTripsCache([{ id: "cached-trip", title: "Cached only", visibility: "private" }]);
  });

  afterEach(() => {
    authState.userId = "user-a";
    authState.isSignedIn = true;
  });

  it("does not overwrite trip cache when the user signs out before myTrips returns", async () => {
    let releaseTripsQuery: (() => void) | undefined;
    const tripsGate = new Promise<void>((resolve) => {
      releaseTripsQuery = resolve;
    });

    server.use(
      graphql.query("Trips", async () => {
        await tripsGate;
        return HttpResponse.json({
          data: {
            myTrips: [{ id: "user-a-trip", title: "User A secret trip", visibility: "private", __typename: "TripType" }]
          }
        });
      })
    );

    const view = renderDashboard(<TravelDashboard />, { networkOnline: true });

    expect(getTripsCache()?.[0]?.title).toBe("Cached only");
    await waitFor(() => {
      expect(releaseTripsQuery).toBeDefined();
    });
    await new Promise((resolve) => setTimeout(resolve, 0));

    authState.isSignedIn = false;
    authState.userId = null;
    view.rerender(<TravelDashboard />);

    releaseTripsQuery?.();

    await waitFor(() => {
      expect(getTripsCache()?.[0]?.title).toBe("Cached only");
    });
  });
});