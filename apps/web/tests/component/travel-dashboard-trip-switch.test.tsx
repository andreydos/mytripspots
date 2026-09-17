import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { TravelDashboard } from "@/components/travel-dashboard";
import { savePlacesCache, saveTripsCache } from "@/lib/offline/app-cache";
import { SEED_TRIP_ID } from "../fixtures/place";
import { renderDashboard } from "../utils/render-dashboard";

const TRIP_B_ID = "44444444-4444-4444-4444-444444444444";

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

describe("TravelDashboard trip switch", () => {
  beforeEach(() => {
    localStorage.clear();
    saveTripsCache([
      { id: SEED_TRIP_ID, title: "Trip A", visibility: "private" },
      { id: TRIP_B_ID, title: "Trip B", visibility: "private" }
    ]);
    savePlacesCache(SEED_TRIP_ID, [
      {
        id: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
        tripId: SEED_TRIP_ID,
        title: "Trip A pin",
        lat: 1,
        lng: 1,
        notes: null,
        visitedAt: null,
        createdAt: "2026-01-01T00:00:00+00:00",
        photos: []
      }
    ]);
    savePlacesCache(TRIP_B_ID, [
      {
        id: "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb",
        tripId: TRIP_B_ID,
        title: "Trip B pin",
        lat: 2,
        lng: 2,
        notes: null,
        visitedAt: null,
        createdAt: "2026-01-01T00:00:00+00:00",
        photos: []
      }
    ]);
  });

  it("replaces loaded places when the active trip changes (offline cache)", async () => {
    const user = userEvent.setup();
    renderDashboard(<TravelDashboard />, { networkOnline: false });

    await waitFor(() => {
      expect(screen.getByLabelText("Active trip")).toHaveValue(SEED_TRIP_ID);
    });

    await user.click(screen.getByRole("button", { name: "Load from cache" }));

    await waitFor(() => {
      expect(screen.getByRole("option", { name: "Trip A pin" })).toBeInTheDocument();
    });

    await user.selectOptions(screen.getByLabelText("Active trip"), TRIP_B_ID);

    await waitFor(() => {
      expect(screen.getByRole("option", { name: "Trip B pin" })).toBeInTheDocument();
      expect(screen.queryByRole("option", { name: "Trip A pin" })).not.toBeInTheDocument();
    });
  });
});
