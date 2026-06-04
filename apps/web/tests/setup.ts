import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import React from "react";
import { afterAll, afterEach, beforeAll, vi } from "vitest";
import { server } from "./mocks/server";

beforeAll(() => {
  server.listen({ onUnhandledRequest: "error" });
});

afterEach(() => {
  server.resetHandlers();
  cleanup();
});

afterAll(() => {
  server.close();
});

vi.mock("@/components/map-view", () => ({
  MapView: () => React.createElement("div", { "data-testid": "map-view-stub" }, "Map")
}));

/** place-page and dashboard load the map via `next/dynamic`; static mocks do not apply to that path. */
vi.mock("next/dynamic", () => ({
  default: () =>
    function DynamicMapStub() {
      return React.createElement("div", { "data-testid": "map-view-stub" }, "Map");
    }
}));
