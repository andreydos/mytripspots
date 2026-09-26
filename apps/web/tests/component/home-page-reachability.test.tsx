import { screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { HomePageClient } from "@/components/home-page-client";
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
  });

  it("stays online when /api/ping succeeds even if external DNS checks would fail", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async (url: string) => {
        if (url.endsWith("/api/ping")) {
          return new Response(JSON.stringify({ ok: true }), { status: 200 });
        }
        throw new Error(`Unexpected fetch: ${url}`);
      })
    );

    renderWithProviders(<HomePageClient />);

    await waitFor(() => {
      expect(screen.queryByText(/No network — offline mode/)).not.toBeInTheDocument();
    });
  });
});
