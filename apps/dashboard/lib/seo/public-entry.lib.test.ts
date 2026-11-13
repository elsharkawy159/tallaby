import { describe, expect, it } from "vitest";
import { dashboardOrigin } from "./public-entry.lib";

describe("dashboardOrigin", () => {
  it("keeps only the origin of the site URL", () => {
    expect(dashboardOrigin("https://dashboard.tallaby.com/")).toBe("https://dashboard.tallaby.com");
    expect(dashboardOrigin("http://localhost:3002/x")).toBe("http://localhost:3002");
  });

  it("falls back to the production dashboard when unset or invalid", () => {
    expect(dashboardOrigin("")).toBe("https://dashboard.tallaby.com");
    expect(dashboardOrigin("not a url")).toBe("https://dashboard.tallaby.com");
  });
});
