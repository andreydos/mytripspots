import { screen, waitFor } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { PlacePageClient } from "@/components/place-page-client";
import { SEED_PLACE_ID } from "../fixtures/place";
import { placeErrorHandlers, placeNotFoundHandlers } from "../mocks/graphql-handlers";
import { server } from "../mocks/server";
import { renderWithProviders } from "../utils/render-with-providers";

describe("PlacePageClient", () => {
  it("shows place details when GraphQL returns a place", async () => {
    renderWithProviders(<PlacePageClient placeId={SEED_PLACE_ID} />);

    expect(await screen.findByText("London")).toBeInTheDocument();
    expect(screen.getByText("Seed place")).toBeInTheDocument();
    expect(screen.getByText("Back to dashboard")).toBeInTheDocument();
    expect(await screen.findByTestId("map-view-stub")).toBeInTheDocument();
    expect(screen.getByText("Notes")).toBeInTheDocument();
    expect(screen.getByText("Photos")).toBeInTheDocument();
  });

  it("shows not-found state when place is null", async () => {
    server.use(...placeNotFoundHandlers());

    renderWithProviders(<PlacePageClient placeId="00000000-0000-0000-0000-000000000000" />);

    expect(await screen.findByText("Place not found")).toBeInTheDocument();
  });

  it("shows error state when GraphQL fails", async () => {
    server.use(...placeErrorHandlers());

    renderWithProviders(<PlacePageClient placeId={SEED_PLACE_ID} />);

    expect(await screen.findByText("Could not load place")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Try again" })).toBeInTheDocument();
  });
});
