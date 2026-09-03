import { screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { HomePageClient } from "@/components/home-page-client";
import { getTripsCache, saveTripsCache } from "@/lib/offline/app-cache";
import { SEED_TRIP_ID } from "../fixtures/place";
import { renderWithProviders } from "../utils/render-with-providers";

const USER_A = "user-a";
const USER_B = "user-b";

let mockAuth = {
  isLoaded: true,
  isSignedIn: true,
  userId: USER_B,
  getToken: async () => "test-token"
};

vi.mock("@clerk/nextjs", () => ({
  useAuth: () => mockAuth,
  useUser: () => ({
    user: {
      fullName: "User B",
      imageUrl: null,
      primaryEmailAddress: { emailAddress: "b@example.com" },
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

describe("HomePageClient cache isolation", () => {
  beforeEach(() => {
    localStorage.clear();
    mockAuth = {
      isLoaded: true,
      isSignedIn: true,
      userId: USER_B,
      getToken: async () => "test-token"
    };
    saveTripsCache(USER_A, [{ id: SEED_TRIP_ID, title: "User A Trip", visibility: "private" }]);
  });

  it("does not hydrate another user's cached trips after sign-in", async () => {
    renderWithProviders(<HomePageClient />);

    await waitFor(() => {
      expect(screen.getByText("Add place")).toBeInTheDocument();
    });

    expect(getTripsCache(USER_B)).toBeNull();
    expect(screen.queryByText("User A Trip")).not.toBeInTheDocument();
  });
});
