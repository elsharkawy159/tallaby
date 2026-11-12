import { describe, expect, it } from "vitest";
import { catalogAppResponseBody, catalogResponseBody, corsHeaders } from "./catalog-api.lib";

describe("public App Center catalog API (F-93)", () => {
  it("allows only tallaby.com and its subdomains over https", () => {
    expect(corsHeaders("https://apps.tallaby.com", true)["Access-Control-Allow-Origin"]).toBe("https://apps.tallaby.com");
    expect(corsHeaders("https://tallaby.com", true)["Access-Control-Allow-Origin"]).toBe("https://tallaby.com");
    expect(corsHeaders("https://evil-tallaby.com", true)["Access-Control-Allow-Origin"]).toBeUndefined();
    expect(corsHeaders("https://tallaby.com.evil.io", true)["Access-Control-Allow-Origin"]).toBeUndefined();
    expect(corsHeaders("http://apps.tallaby.com", true)["Access-Control-Allow-Origin"]).toBeUndefined();
    expect(corsHeaders(null, true)).toEqual({ Vary: "Origin" });
  });

  it("allows localhost outside production only", () => {
    expect(corsHeaders("http://localhost:3002", false)["Access-Control-Allow-Origin"]).toBe("http://localhost:3002");
    expect(corsHeaders("http://localhost:3002", true)["Access-Control-Allow-Origin"]).toBeUndefined();
  });

  it("returns the versioned list, Arabic by default", () => {
    const body = catalogResponseBody(null);
    expect(body.version).toBe(1);
    expect(body.locale).toBe("ar");
    expect(body.apps.find((app) => app.id === "bosta")?.name).toBe("بوسطة");
    expect(catalogResponseBody("en").apps.find((app) => app.id === "bosta")?.name).toBe("Bosta");
  });

  it("never returns private fields", () => {
    const json = JSON.stringify(catalogResponseBody("en"));
    for (const word of ["internal", "settingsRoute", "/stores/", "provider\""]) expect(json).not.toContain(word);
  });

  it("finds one app by id or slug, and rejects odd ids", () => {
    expect(catalogAppResponseBody("size-chart", "en")?.app.id).toBe("size_chart");
    expect(catalogAppResponseBody("nope", "en")).toBeNull();
    expect(catalogAppResponseBody("../etc", "en")).toBeNull();
  });
});
