import { describe, expect, it } from "vitest";

import { allPlaces } from "../../places/places.lib";
import { BOSTA_CITIES } from "./bosta-geo.data";
import { bostaCityForRegion, bostaDistrictOptions, bostaNameKey, resolveBostaDestination } from "./bosta-geo.lib";

const EGYPT_REGIONS = allPlaces().filter((p) => p.level === "region" && p.key.startsWith("EG/"));

describe("Bosta geography", () => {
  it("maps every governorate to a Bosta city", () => {
    expect(EGYPT_REGIONS).toHaveLength(27);
    for (const region of EGYPT_REGIONS) {
      expect(bostaCityForRegion(region.key.split("/")[1]!), region.key).toBeDefined();
    }
    expect(BOSTA_CITIES.length).toBeGreaterThanOrEqual(27);
  });

  it("builds comparison keys that ignore el/al, qesm, hamza and spacing", () => {
    expect(bostaNameKey("ElMaadi")).toBe(bostaNameKey("El Maadi"));
    expect(bostaNameKey("المعادي")).toBe(bostaNameKey("معادي"));
    expect(bostaNameKey("حداءق القبه")).toBe(bostaNameKey("حدائق القبة"));
    expect(bostaNameKey("Qesm Nasr City")).toBe(bostaNameKey("Nasr"));
  });

  it("matches Cairo areas to a zone and reads the district from the address line", () => {
    const plain = resolveBostaDestination({ placeKey: "EG/CAIRO/nasr-city" });
    expect(plain).toMatchObject({ ok: true, via: "zone", destination: { city: "Cairo" } });

    const refined = resolveBostaDestination({ placeKey: "EG/CAIRO/nasr-city", addressLine1: "15 شارع مكرم عبيد، الحي العاشر" });
    expect(refined.ok && refined.destination.districtId).toBe("6PpGQcHRoLjj");
  });

  it("finds areas Bosta files under a neighbouring governorate", () => {
    // Bosta lists Mohandessin under its "Cairo" city.
    expect(resolveBostaDestination({ placeKey: "EG/GIZA/mohandessin" })).toMatchObject({ ok: true, destination: { city: "Cairo" } });
  });

  it("resolves free-text addresses through the places dataset", () => {
    const result = resolveBostaDestination({ state: "الإسكندرية", city: "سيدي بشر" });
    expect(result).toMatchObject({ ok: true, destination: { city: "Alexandria" } });
  });

  it("honours the seller's manual district and reports coverage gaps", () => {
    expect(resolveBostaDestination({ placeKey: "EG/CAIRO/nasr-city", districtId: "6PpGQcHRoLjj" })).toEqual({
      ok: true,
      via: "override",
      destination: { city: "Cairo", districtId: "6PpGQcHRoLjj", zoneId: "8wlSvImUB7P" },
    });
    expect(resolveBostaDestination({ placeKey: "EG/NORTH SINAI/arish" })).toMatchObject({ ok: false, reason: "no_coverage" });
    expect(resolveBostaDestination({ state: "Atlantis", city: "Nowhere" })).toMatchObject({ ok: false, reason: "unknown_region" });
    const regionOnly = resolveBostaDestination({ placeKey: "EG/CAIRO" });
    expect(regionOnly).toMatchObject({ ok: false, reason: "district_needed" });
    expect(!regionOnly.ok && regionOnly.cityIds[0]).toBe("FceDyHXwpSYYF9zGW");
  });

  it("matches at least 90% of Egyptian areas (the rest ask the seller or are outside Bosta's coverage)", () => {
    const areas = allPlaces().filter((p) => p.level === "city" && p.key.startsWith("EG/"));
    const matched = areas.filter((p) => resolveBostaDestination({ placeKey: p.key }).ok).length;
    expect(matched / areas.length).toBeGreaterThanOrEqual(0.9);
  });

  it("lists pickable districts in the seller's language", () => {
    const options = bostaDistrictOptions(["FceDyHXwpSYYF9zGW"], "ar");
    expect(options.length).toBeGreaterThan(100);
    expect(options.find((o) => o.districtId === "6PpGQcHRoLjj")).toEqual({
      districtId: "6PpGQcHRoLjj",
      label: "الحي العاشر (مدينه نصر) — مدينه نصر",
      cityName: "القاهره",
    });
  });
});
