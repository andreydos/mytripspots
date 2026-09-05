import { graphql, HttpResponse } from "msw";
import { fireEvent, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { TravelDashboard } from "@/components/travel-dashboard";
import { getDrafts } from "@/lib/offline/drafts";
import { saveTripsCache } from "@/lib/offline/app-cache";
import { SEED_TRIP_ID } from "../fixtures/place";
import { server } from "../mocks/server";
import { renderDashboard } from "../utils/render-dashboard";

const clerkAuthState = vi.hoisted(() => ({
  isLoaded: true,
  getToken: async () => "test-token" as string | null
}));

vi.mock("@clerk/nextjs", () => ({
  useAuth: () => ({
    isLoaded: clerkAuthState.isLoaded,
    getToken: clerkAuthState.getToken
  }),
  SignedIn: ({ children }: { children: React.ReactNode }) => children,
  SignedOut: () => null,
  SignInButton: () => null,
  UserButton: () => null
}));

async function submitPlaceForm(user: ReturnType<typeof userEvent.setup>) {
  await user.type(screen.getByPlaceholderText("Waterfall"), "Offline waterfall");
  await user.type(screen.getByLabelText("Latitude"), "64.15");
  await user.type(screen.getByLabelText("Longitude"), "-21.67");

  const form = screen.getByPlaceholderText("Waterfall").closest("form");
  expect(form).not.toBeNull();
  fireEvent.submit(form!);
}

describe("TravelDashboard offline", () => {
  beforeEach(() => {
    localStorage.clear();
    clerkAuthState.isLoaded = true;
    clerkAuthState.getToken = async () => "test-token";
    saveTripsCache([{ id: SEED_TRIP_ID, title: "Demo Trip", visibility: "private" }]);
  });

  it("saves a draft locally instead of calling createPlace when offline", async () => {
    let createPlaceCalled = false;
    server.use(
      graphql.mutation("CreatePlace", () => {
        createPlaceCalled = true;
        return HttpResponse.json({
          data: {
            createPlace: {
              id: "new-place",
              __typename: "PlaceType"
            }
          }
        });
      })
    );

    const user = userEvent.setup();
    renderDashboard(<TravelDashboard />, { networkOnline: false });

    await waitFor(() => {
      expect(screen.getByRole("button", { name: "Save place" })).not.toBeDisabled();
    });

    await submitPlaceForm(user);

    await waitFor(() => {
      expect(getDrafts()).toHaveLength(1);
    });

    const draft = getDrafts()[0];
    expect(draft?.title).toBe("Offline waterfall");
    expect(draft?.tripId).toBe(SEED_TRIP_ID);
    expect(draft?.lat).toBe(64.15);
    expect(draft?.lng).toBe(-21.67);
    expect(createPlaceCalled).toBe(false);
  });

  it("saves a draft when online but Clerk auth is not ready", async () => {
    clerkAuthState.isLoaded = false;

    let createPlaceCalled = false;
    server.use(
      graphql.mutation("CreatePlace", () => {
        createPlaceCalled = true;
        return HttpResponse.json({
          data: {
            createPlace: {
              id: "new-place",
              __typename: "PlaceType"
            }
          }
        });
      })
    );

    const user = userEvent.setup();
    renderDashboard(<TravelDashboard />, { networkOnline: true });

    await waitFor(() => {
      expect(screen.getByRole("button", { name: "Save place" })).not.toBeDisabled();
    });

    await submitPlaceForm(user);

    await waitFor(() => {
      expect(getDrafts()).toHaveLength(1);
    });
    expect(createPlaceCalled).toBe(false);
  });

  it("saves a draft when the online createPlace mutation fails", async () => {
    let createPlaceCalled = false;
    server.use(
      graphql.mutation("CreatePlace", () => {
        createPlaceCalled = true;
        return HttpResponse.json({
          errors: [{ message: "Internal server error" }]
        });
      })
    );

    const user = userEvent.setup();
    renderDashboard(<TravelDashboard />, { networkOnline: true });

    await waitFor(() => {
      expect(screen.getByRole("button", { name: "Save place" })).not.toBeDisabled();
    });

    await submitPlaceForm(user);

    await waitFor(() => {
      expect(getDrafts()).toHaveLength(1);
    });
    expect(createPlaceCalled).toBe(true);
  });
});
