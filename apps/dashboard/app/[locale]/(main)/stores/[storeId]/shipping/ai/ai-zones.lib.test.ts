import { describe, expect, it } from "vitest";
import { allPlaces, getPlace, normalizePlaceText } from "@workspace/lib/places";
import { zoneInputSchema } from "@workspace/lib/shipping/store-zones";
import { aiZonesOutputSchema, validateAiZonesText, AI_ZONES_LIMITS } from "./ai-zones.dto";
import { AI_ZONES_SYSTEM_RULES, aiZonesRequestText, cleanAiZones, matchPlaceNames } from "./ai-zones.lib";

const zone = (over: Partial<{ places: string[]; price: number | null; daysMin: number | null; daysMax: number | null; freeOver: number | null }>) => ({
  places: [],
  price: null,
  daysMin: null,
  daysMax: null,
  freeOver: null,
  ...over,
});

const UPPER = ["FAYOUM", "BENI SUEF", "MINYA", "ASSIUT", "SOHAG", "QENA", "LUXOR", "ASWAN"].map((g) => `EG/${g}`);

describe("matchPlaceNames", () => {
  it("matches governorates in Arabic and English", () => {
    expect(matchPlaceNames(["Cairo", "الجيزة", "الإسكندرية", "اسكندرية", "Minya", "المنيا"]).keys).toEqual([
      "EG/CAIRO",
      "EG/GIZA",
      "EG/ALEXANDRIA",
      "EG/MINYA",
    ]);
  });

  it("matches areas to their governorate", () => {
    expect(matchPlaceNames(["Nasr City", "مدينة نصر"]).keys).toEqual(["EG/CAIRO/nasr-city"]);
    expect(matchPlaceNames(["المعادي"]).keys).toEqual(["EG/CAIRO/maadi"]);
    expect(matchPlaceNames(["التجمع الخامس"]).keys).toEqual(["EG/CAIRO/new-cairo"]);
  });

  it("reads an area with its governorate as the area alone", () => {
    expect(matchPlaceNames(["Nasr City, Cairo"]).keys).toEqual(["EG/CAIRO/nasr-city"]);
    expect(matchPlaceNames(["مدينة نصر - القاهرة"]).keys).toEqual(["EG/CAIRO/nasr-city"]);
  });

  it.each([
    ["all Egypt", ["EG"]],
    ["كل مصر", ["EG"]],
    ["مصر", ["EG"]],
    ["باقي المحافظات", ["EG"]],
    ["rest of Egypt", ["EG"]],
    ["Upper Egypt", UPPER],
    ["الصعيد", UPPER],
    ["الوجه القبلي", UPPER],
    ["Greater Cairo", ["EG/CAIRO", "EG/GIZA", "EG/QALIUBIA"]],
    ["مدن القناة", ["EG/PORT SAID", "EG/SUEZ", "EG/ISMAILIA"]],
    ["سيناء", ["EG/NORTH SINAI", "EG/SOUTH SINAI"]],
  ])("expands the grouping %s", (name, keys) => {
    expect(matchPlaceNames([name]).keys).toEqual(keys);
  });

  it("expands the Delta in both languages", () => {
    const en = matchPlaceNames(["Delta"]).keys;
    expect(en).toContain("EG/DAKAHLIA");
    expect(en).toHaveLength(8);
    expect(matchPlaceNames(["الدلتا"]).keys).toEqual(en);
    expect(matchPlaceNames(["the Delta"]).keys).toEqual(en);
  });

  it("splits names the model left joined", () => {
    expect(matchPlaceNames(["Cairo and Giza"]).keys).toEqual(["EG/CAIRO", "EG/GIZA"]);
    expect(matchPlaceNames(["القاهرة والجيزة"]).keys).toEqual(["EG/CAIRO", "EG/GIZA"]);
    expect(matchPlaceNames(["القاهرة و الجيزة"]).keys).toEqual(["EG/CAIRO", "EG/GIZA"]);
    expect(matchPlaceNames(["Cairo, Giza"]).keys).toEqual(["EG/CAIRO", "EG/GIZA"]);
    expect(matchPlaceNames(["الصعيد والدلتا"]).keys).toHaveLength(16);
  });

  it("does not split a name that starts with و", () => {
    expect(matchPlaceNames(["وسط البلد"]).keys).toEqual(["EG/CAIRO/downtown"]);
  });

  it("strips wrapper words", () => {
    expect(matchPlaceNames(["محافظة الجيزة", "all of Cairo", "كل أسوان", "Suez Governorate"]).keys).toEqual([
      "EG/GIZA",
      "EG/CAIRO",
      "EG/ASWAN",
      "EG/SUEZ",
    ]);
  });

  it("returns unknown names and never guesses from part of a name", () => {
    expect(matchPlaceNames(["Narnia"])).toMatchObject({ keys: [], unmatched: ["Narnia"] });
    // A prefix of a real name is not a match.
    expect(matchPlaceNames(["Cai"]).unmatched).toEqual(["Cai"]);
    expect(matchPlaceNames(["الساحل الغربي البعيد"]).unmatched).toEqual(["الساحل الغربي البعيد"]);
    // Another country is outside this feature.
    expect(matchPlaceNames(["Riyadh"]).unmatched).toEqual(["Riyadh"]);
  });

  it("keeps the whole name when only one part of a list is known", () => {
    const out = matchPlaceNames(["Cairo and Narnia"]);
    expect(out).toMatchObject({ keys: [], unmatched: ["Cairo and Narnia"] });
  });

  it("does not guess between cities that share a name", () => {
    const regions = new Set(allPlaces().filter((p) => p.level === "region").map((p) => normalizePlaceText(p.nameEn)));
    const byName = new Map<string, string[]>();
    for (const place of allPlaces()) {
      if (place.level !== "city" || !place.key.startsWith("EG/")) continue;
      byName.set(place.nameEn, [...(byName.get(place.nameEn) ?? []), place.key]);
    }
    const shared = [...byName.entries()].filter(([name, keys]) => keys.length > 1 && !regions.has(normalizePlaceText(name)));
    for (const [name, keys] of shared) {
      expect(matchPlaceNames([name])).toMatchObject({ keys: [], unmatched: [name] });
      // Naming the governorate settles it.
      const key = keys[0]!;
      expect(matchPlaceNames([`${name}, ${getPlace(key.split("/").slice(0, 2).join("/"))!.nameEn}`]).keys).toEqual([key]);
    }
  });

  it("names the zone in both languages, from the places", () => {
    expect(matchPlaceNames(["Cairo", "الجيزة"])).toMatchObject({ nameAr: "القاهرة، الجيزة", nameEn: "Cairo, Giza" });
    expect(matchPlaceNames(["الصعيد"])).toMatchObject({ nameAr: "الصعيد", nameEn: "Upper Egypt" });
    const long = matchPlaceNames(["Cairo", "Giza", "Suez", "Luxor", "Aswan"]);
    expect(long.nameEn).toBe("Cairo, Giza, Suez +2");
  });

  it("dedupes and only returns real place keys", () => {
    const { keys } = matchPlaceNames(["Cairo", "القاهرة", "Upper Egypt", "الصعيد", "Delta", "Sinai", "Greater Cairo", "مصر"]);
    expect(new Set(keys).size).toBe(keys.length);
    for (const key of keys) expect(getPlace(key)).toBeDefined();
  });
});

describe("cleanAiZones", () => {
  it("turns the seller's example into zones the save schema accepts", () => {
    const zones = cleanAiZones({
      zones: [
        zone({ places: ["Cairo", "Giza"], price: 60, daysMin: 2, daysMax: 2 }),
        zone({ places: ["Alexandria"], price: 80 }),
        zone({ places: ["Upper Egypt"], price: 120, freeOver: 1000 }),
      ],
    });
    expect(zones).toHaveLength(3);
    expect(zones[0]).toMatchObject({ places: ["EG/CAIRO", "EG/GIZA"], price: 60, daysMin: 2, daysMax: 2, daysAssumed: false, unmatched: [] });
    expect(zones[1]).toMatchObject({ places: ["EG/ALEXANDRIA"], price: 80, freeOver: null, daysAssumed: true });
    expect(zones[2]).toMatchObject({ places: UPPER, price: 120, freeOver: 1000 });
    for (const z of zones) {
      const parsed = zoneInputSchema.safeParse({
        nameAr: z.nameAr,
        nameEn: z.nameEn,
        places: z.places,
        price: z.price,
        freeOver: z.freeOver,
        deliveryDaysMin: z.daysMin,
        deliveryDaysMax: z.daysMax,
        codEnabled: true,
        enabled: true,
      });
      expect(parsed.success).toBe(true);
    }
  });

  it("clamps numbers the save schema would refuse", () => {
    const [a] = cleanAiZones({ zones: [zone({ places: ["Cairo"], price: 99999.999, freeOver: 5_000_000, daysMin: 90, daysMax: 2.4 })] });
    expect(a).toMatchObject({ price: 10_000, freeOver: 1_000_000, daysMin: 2, daysMax: 60 });
  });

  it("rounds to piastres and leaves a nonsense price for the seller", () => {
    expect(cleanAiZones({ zones: [zone({ places: ["Cairo"], price: 60.555 })] })[0]?.price).toBe(60.56);
    expect(cleanAiZones({ zones: [zone({ places: ["Cairo"], price: -5 })] })[0]?.price).toBeNull();
    expect(cleanAiZones({ zones: [zone({ places: ["Cairo"], price: null })] })[0]?.price).toBeNull();
  });

  it("keeps free delivery, and treats free-over 0 as no threshold", () => {
    expect(cleanAiZones({ zones: [zone({ places: ["Cairo"], price: 0, freeOver: 0 })] })[0]).toMatchObject({ price: 0, freeOver: null });
  });

  it("uses one stated day for both ends", () => {
    expect(cleanAiZones({ zones: [zone({ places: ["Cairo"], daysMax: 4 })] })[0]).toMatchObject({ daysMin: 4, daysMax: 4, daysAssumed: false });
  });

  it("keeps a zone with only unknown names, so the seller sees them", () => {
    const [z] = cleanAiZones({ zones: [zone({ places: ["Narnia"], price: 50 })] });
    expect(z).toMatchObject({ places: [], unmatched: ["Narnia"], nameAr: "Narnia", price: 50 });
  });

  it("keeps a priced zone with no places and drops an empty one", () => {
    const zones = cleanAiZones({ zones: [zone({ price: 50 }), zone({})] });
    expect(zones).toHaveLength(1);
    expect(zones[0]).toMatchObject({ places: [], price: 50 });
  });

  it("caps zones and names", () => {
    const many = Array.from({ length: 50 }, () => zone({ places: ["Cairo"], price: 10 }));
    expect(cleanAiZones({ zones: many })).toHaveLength(AI_ZONES_LIMITS.maxZones);
    const names = Array.from({ length: 100 }, (_, i) => `Nowhere ${i}`);
    expect(matchPlaceNames(names).unmatched).toHaveLength(AI_ZONES_LIMITS.maxNamesPerZone);
  });
});

describe("the prompt and input", () => {
  it("sends no place list", () => {
    expect(AI_ZONES_SYSTEM_RULES.length).toBeLessThan(1000);
    for (const name of ["Dakahlia", "الدقهلية", "Sohag", "سوهاج", "EG/"]) {
      expect(AI_ZONES_SYSTEM_RULES).not.toContain(name);
    }
    expect(aiZonesRequestText("  Cairo 60  ")).toBe("SELLER_TEXT:\nCairo 60");
  });

  it("validates the text length", () => {
    expect(validateAiZonesText("   ")).toBe("empty");
    expect(validateAiZonesText("x".repeat(AI_ZONES_LIMITS.maxTextLength + 1))).toBe("tooLong");
    expect(validateAiZonesText("Cairo 60")).toBeNull();
  });

  it("output schema accepts nulls", () => {
    expect(aiZonesOutputSchema.safeParse({ zones: [zone({})] }).success).toBe(true);
  });
});
