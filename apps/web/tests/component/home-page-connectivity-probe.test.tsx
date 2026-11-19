import { screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { HomePageClient } from "@/components/home-page-client";
import { renderWithProviders } from "../utils/render-with-providers";

vi.mock("@clerk/nextjs", () => ({
  useAuth: () => ({
    isLoaded: true,
    isSignedIn: false,
    userId: null
  }),
  useUser: () => ({ user: null }),
  useClerk: () => ({}),
  ClerkLoaded: ({ children }: { children: React.ReactNode }) => children,
  ClerkLoading: () => null,
  SignedIn: () => null,
  SignedOut: ({ children }: { children: React.ReactNode }) => children,
  SignInButton: () => null,
  UserButton: () => null
}));

describe("HomePageClient connectivity probe", () => {
  beforeEach(() => {
    localStorage.clear();
    Object.defineProperty(window.navigator, "onLine", {
      value: true,
      configurable: true
    });
  });

  it("stays online when same-origin ping succeeds even if external DNS probe would fail", async () => {
    const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
      const url = typeof input === "string" ? input : input.toString();
      if (url.endsWith("/api/ping")) {
        return new Response("ok", { status: 200 });
      }
      if (url.includes("dns.google")) {
        return new Response("blocked", { status: 403 });
      }
      return new Response("not found", { status: 404 });
    });
    vi.stubGlobal("fetch", fetchMock);

    renderWithProviders(<HomePageClient />);

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        expect.stringMatching(/\/api\/ping$/),
        expect.objectContaining({ cache: "no-store" })
      );
    });

    await waitFor(() => {
      expect(screen.queryByText(/No network — offline mode/)).not.toBeInTheDocument();
    });
  });
});