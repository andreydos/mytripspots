import { screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { HomePageClient } from "@/components/home-page-client";
import { saveSessionSnapshot, saveTripsCache } from "@/lib/offline/app-cache";
import { SEED_TRIP_ID } from "../fixtures/place";
import { render } from "@testing-library/react";

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
  SignedOut: () => null,
  SignInButton: () => null
}));

describe("HomePageClient offline", () => {
  beforeEach(() => {
    localStorage.clear();
    Object.defineProperty(window.navigator, "onLine", {
      value: false,
      configurable: true
    });
    saveSessionSnapshot({ signedIn: true, displayName: "Demo User" });
    saveTripsCache([{ id: SEED_TRIP_ID, title: "Demo Trip", visibility: "private" }]);
  });

  it("shows offline banner and dashboard from saved session when navigator is offline", async () => {
    render(<HomePageClient />);

    expect(
      await screen.findByText(/No network — offline mode/)
    ).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText("Add place")).toBeInTheDocument();
    });
  });
});
