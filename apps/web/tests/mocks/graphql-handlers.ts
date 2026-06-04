import { HttpResponse, graphql } from "msw";
import { seedPlaceGraphQL } from "../fixtures/place";

export const defaultGraphqlHandlers = [
  graphql.query("Place", ({ variables }) => {
    const id = variables?.id as string | undefined;
    if (id === seedPlaceGraphQL.id) {
      return HttpResponse.json({
        data: {
          place: {
            ...seedPlaceGraphQL,
            photos: seedPlaceGraphQL.photos.map((p) => ({ ...p, __typename: "PlacePhotoType" })),
            __typename: "PlaceType"
          }
        }
      });
    }
    return HttpResponse.json({ data: { place: null } });
  })
];

export function placeNotFoundHandlers() {
  return [graphql.query("Place", () => HttpResponse.json({ data: { place: null } }))];
}

export function placeErrorHandlers() {
  return [
    graphql.query("Place", () =>
      HttpResponse.json({ errors: [{ message: "Server error" }] }, { status: 500 })
    )
  ];
}
