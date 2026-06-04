import { setupServer } from "msw/node";
import { defaultGraphqlHandlers } from "./graphql-handlers";

export const server = setupServer(...defaultGraphqlHandlers);
