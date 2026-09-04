import { screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { HomePageClient } from "@/components/home-page-client";
import { saveSessionSnapshot, saveTripsCache } from "@/lib/offline/app-cache";
import { SEED_TRIP_ID } from "../fixtures/place";
import { renderWithProviders } from "../utils/render-with-providers";

vi.mock("@clerk/nextjs", () => ({
  useAuth: () => ({
    isLoaded: true,
    isSignedIn: true,
    userId: "user_demo_1",
    getToken: async () => "test-token"
  }),
  useUser: () => ({
    user: {
      fullName: "Demo User",
      primaryEmailAddress: { emailAddress: "demo@test.local" },
      imageUrl: null,
      username: null
    }
  }),
  useClerk: () => ({}),
  ClerkLoaded: ({ children }: { children: React.ReactNode }) => children,
  ClerkLoading: () => null,
  SignedIn: ({ children }: { children: React.ReactNode }) => children,
  SignedOut: () => null,
  SignInButton: () => null,
  UserButton: () => null
}));

describe("HomePageClient reachability probe", () => {
  beforeEach(() => {
    localStorage.clear();
    Object.defineProperty(window.navigator, "onLine", {
      value: true,
      configurable: true
    });
    saveSessionSnapshot({ signedIn: true, displayName: "Demo User" });
    saveTripsCache([{ id: SEED_TRIP_ID, title: "Demo Trip", visibility: "private" }]);
    vi.stubGlobal(
      "fetch",
      vi.fn().mockRejectedValue(new Error("network unreachable"))
    );
  });

  it("treats the app as offline when the probe fails even if Clerk is already loaded", async () => {
    renderWithProviders(<HomePageClient />);

    expect(
      await screen.findByText(/No network — offline mode/)
    ).toBeInTheDocument();
  });
});
