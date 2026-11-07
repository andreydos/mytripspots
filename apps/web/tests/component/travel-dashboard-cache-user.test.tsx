import { screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { TravelDashboard } from "@/components/travel-dashboard";
import { saveTripsCache } from "@/lib/offline/app-cache";
import { SEED_TRIP_ID } from "../fixtures/place";
import { renderDashboard } from "../utils/render-dashboard";

vi.mock("@clerk/nextjs", () => ({
  useAuth: () => ({
    isLoaded: true,
    userId: "user-b",
    getToken: async () => "test-token"
  }),
  SignedIn: ({ children }: { children: React.ReactNode }) => children,
  SignedOut: () => null,
  SignInButton: () => null,
  UserButton: () => null
}));

describe("TravelDashboard trips cache user isolation", () => {
  beforeEach(() => {
    localStorage.clear();
    saveTripsCache([{ id: SEED_TRIP_ID, title: "Other user trip", visibility: "private" }], "user-a");
  });

  it("does not hydrate trips from another user's localStorage cache", async () => {
    renderDashboard(<TravelDashboard />, { networkOnline: false });

    await waitFor(() => {
      expect(screen.getByText(/No trips in cache/)).toBeInTheDocument();
    });
    expect(screen.queryByText("Other user trip")).not.toBeInTheDocument();
  });
});
