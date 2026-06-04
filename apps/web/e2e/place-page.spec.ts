import { expect, test } from "@playwright/test";
import { mockPlaceGraphQL } from "./helpers/graphql-mock";
import { SEED_PLACE_ID } from "../tests/fixtures/place";

test.describe("Place detail page", () => {
  test.beforeEach(async ({ page }) => {
    await mockPlaceGraphQL(page);
  });

  test("renders seeded place details", async ({ page }) => {
    await page.goto(`/places/${SEED_PLACE_ID}`);

    await expect(page.getByText("London", { exact: true })).toBeVisible();
    await expect(page.getByText("Seed place")).toBeVisible();
    await expect(page.getByRole("link", { name: "Back to dashboard" })).toBeVisible();
    await expect(page.getByText("Notes")).toBeVisible();
    await expect(page.locator(".leaflet-container")).toBeVisible();
  });

  test("shows not-found for unknown place id", async ({ page }) => {
    await page.goto("/places/00000000-0000-0000-0000-000000000000");
    await expect(page.getByText("Place not found")).toBeVisible();
  });
});
