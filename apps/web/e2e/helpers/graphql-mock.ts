import type { Page, Route } from "@playwright/test";
import { seedPlaceGraphQL } from "../../tests/fixtures/place";

type GraphQLBody = {
  operationName?: string;
  variables?: { id?: string };
};

export async function mockPlaceGraphQL(page: Page) {
  await page.route("**/graphql", async (route: Route) => {
    const request = route.request();
    if (request.method() !== "POST") {
      await route.continue();
      return;
    }

    const body = (await request.postDataJSON()) as GraphQLBody;
    if (body.operationName === "Place") {
      const id = body.variables?.id;
      const place =
        id === seedPlaceGraphQL.id
          ? {
              ...seedPlaceGraphQL,
              photos: seedPlaceGraphQL.photos.map((p) => ({ ...p, __typename: "PlacePhotoType" })),
              __typename: "PlaceType"
            }
          : null;

      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ data: { place } })
      });
      return;
    }

    await route.fulfill({
      status: 400,
      contentType: "application/json",
      body: JSON.stringify({ errors: [{ message: `Unhandled operation: ${body.operationName}` }] })
    });
  });
}
