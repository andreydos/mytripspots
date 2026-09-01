import { screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { HomePageClient } from "@/components/home-page-client";
import { getSessionSnapshot, saveSessionSnapshot, saveTripsCache } from "@/lib/offline/app-cache";
import { SEED_TRIP_ID } from "../fixtures/place";
import { renderWithProviders } from "../utils/render-with-providers";

const authState = vi.hoisted(() => ({
  isLoaded: false,
  isSignedIn: false,
  userId: null as string | null
}));

vi.mock("@clerk/nextjs", () => ({
  useAuth: () => ({
    isLoaded: authState.isLoaded,
    isSignedIn: authState.isSignedIn,
    userId: authState.userId,
    getToken: async () => (authState.isSignedIn ? "test-token" : null)
  }),
  useUser: () => ({ user: null }),
  useClerk: () => ({}),
  ClerkLoaded: ({ children }: { children: React.ReactNode }) => children,
  ClerkLoading: () => null,
  SignedIn: ({ children }: { children: React.ReactNode }) =>
    authState.isSignedIn ? children : null,
  SignedOut: ({ children }: { children: React.ReactNode }) =>
    authState.isSignedIn ? null : children,
  SignInButton: () => null,
  UserButton: () => null
}));

describe("HomePageClient offline", () => {
  beforeEach(() => {
    localStorage.clear();
    authState.isLoaded = false;
    authState.isSignedIn = false;
    authState.userId = null;
    Object.defineProperty(window.navigator, "onLine", {
      value: false,
      configurable: true
    });
    saveSessionSnapshot({ signedIn: true, displayName: "Demo User" });
    saveTripsCache([{ id: SEED_TRIP_ID, title: "Demo Trip", visibility: "private" }]);
  });

  it("shows offline banner and dashboard from saved session when navigator is offline", async () => {
    renderWithProviders(<HomePageClient />);

    expect(
      await screen.findByText(/No network — offline mode/)
    ).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText("Add place")).toBeInTheDocument();
    });
  });

  it("shows guest landing after sign-out while online instead of cached dashboard", async () => {
    Object.defineProperty(window.navigator, "onLine", {
      value: true,
      configurable: true
    });
    authState.isLoaded = true;
    authState.isSignedIn = true;
    authState.userId = "user_123";

    const view = renderWithProviders(<HomePageClient />);

    await waitFor(() => {
      expect(screen.getByText("Add place")).toBeInTheDocument();
    });

    authState.isSignedIn = false;
    authState.userId = null;
    view.rerender(<HomePageClient />);

    await waitFor(() => {
      expect(screen.getByText(/inspire you/i)).toBeInTheDocument();
    });
    expect(screen.queryByText("Add place")).not.toBeInTheDocument();
    expect(getSessionSnapshot()).toBeNull();
  });
});
