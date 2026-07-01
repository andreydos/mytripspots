import { graphql, HttpResponse } from "msw";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { TravelDashboard } from "@/components/travel-dashboard";
import { getDrafts } from "@/lib/offline/drafts";
import { saveTripsCache } from "@/lib/offline/app-cache";
import { SEED_TRIP_ID } from "../fixtures/place";
import { server } from "../mocks/server";
import { renderDashboard } from "../utils/render-dashboard";

vi.mock("@clerk/nextjs", () => ({
  useAuth: () => ({
    isLoaded: true,
    getToken: async () => "test-token"
  })
}));

describe("TravelDashboard offline", () => {
  beforeEach(() => {
    localStorage.clear();
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

    await user.type(screen.getByLabelText("Title"), "Offline waterfall");
    await user.type(screen.getByLabelText("Latitude"), "64.15");
    await user.type(screen.getByLabelText("Longitude"), "-21.67");
    await user.click(screen.getByRole("button", { name: "Save place" }));

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
});
