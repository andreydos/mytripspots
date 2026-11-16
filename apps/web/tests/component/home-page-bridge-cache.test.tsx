import { screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { HomePageClient } from "@/components/home-page-client";
import { saveTripsCache } from "@/lib/offline/app-cache";
import { SEED_TRIP_ID } from "../fixtures/place";
import { renderWithProviders } from "../utils/render-with-providers";

vi.mock("@clerk/nextjs", () => ({
  useAuth: () => ({
    isLoaded: false,
    isSignedIn: false,
    userId: null
  }),
  useUser: () => ({ user: null }),
  useClerk: () => ({}),
  ClerkLoaded: ({ children }: { children: React.ReactNode }) => children,
  ClerkLoading: () => null,
  SignedIn: () => null,
  SignedOut: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  SignInButton: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  UserButton: () => null
}));

describe("HomePageClient online Clerk bridge", () => {
  beforeEach(() => {
    localStorage.clear();
    Object.defineProperty(window.navigator, "onLine", {
      value: true,
      configurable: true
    });
    saveTripsCache([{ id: SEED_TRIP_ID, title: "Stale Trip", visibility: "private" }]);
  });

  it("does not show the dashboard from trip cache without a signed-in session snapshot", async () => {
    renderWithProviders(<HomePageClient />);

    await waitFor(() => {
      expect(screen.queryByText("Add place")).not.toBeInTheDocument();
    });
  });
});