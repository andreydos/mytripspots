import { screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { HomePageClient } from "@/components/home-page-client";
import { getSessionSnapshot, getTripsCache, saveSessionSnapshot, saveTripsCache } from "@/lib/offline/app-cache";
import { SEED_TRIP_ID } from "../fixtures/place";
import { renderWithProviders } from "../utils/render-with-providers";

vi.mock("@clerk/nextjs", () => ({
  useAuth: () => ({
    isLoaded: true,
    isSignedIn: false,
    userId: null
  }),
  useUser: () => ({ user: null }),
  useClerk: () => ({}),
  ClerkLoaded: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  ClerkLoading: () => null,
  SignedIn: ({ children }: { children: React.ReactNode }) => null,
  SignedOut: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  SignInButton: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  UserButton: () => null
}));

describe("HomePageClient online sign-out", () => {
  beforeEach(() => {
    localStorage.clear();
    Object.defineProperty(window.navigator, "onLine", {
      value: true,
      configurable: true
    });
    saveSessionSnapshot({ signedIn: true, displayName: "Previous User" });
    saveTripsCache([{ id: SEED_TRIP_ID, title: "Secret Trip", visibility: "private" }]);
  });

  it("clears offline auth cache and shows sign-in instead of the cached dashboard", async () => {
    renderWithProviders(<HomePageClient />);

    await waitFor(() => {
      expect(getSessionSnapshot()).toBeNull();
      expect(getTripsCache()).toBeNull();
    });

    expect(screen.queryByText("Add place")).not.toBeInTheDocument();
    expect(await screen.findByRole("button", { name: /sign in/i })).toBeInTheDocument();
  });
});
