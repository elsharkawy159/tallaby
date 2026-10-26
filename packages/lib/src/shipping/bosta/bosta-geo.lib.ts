import { getPlace, normalizePlaceText, resolveAddressPlace } from "../../places/places.lib";
import { BOSTA_CITIES, BOSTA_DISTRICTS, type BostaCityRow, type BostaDistrictRow } from "./bosta-geo.data";
import type { BostaDestination } from "./bosta-payload.lib";

/**
 * Tallaby address → Bosta city + district (plan §4.3). Tallaby addresses have
 * a governorate and a city/area as text, which resolve to a place key
 * (`EG/CAIRO/nasr-city`). Bosta's "zones" are about the size of our areas
 * (Nasr City, ElMaadi, Masr ElGedida) and its districts are finer, so an
 * area matches a zone first and the district is then read from the address
 * line when it names one. When nothing matches, the seller picks the
 * district by hand (`districtId` override) instead of Bosta rejecting it.
 *
 * Server only in practice: the Bosta geography snapshot is ~400 KB.
 */

/** Tallaby governorate code (places region) → Bosta city code. */
const REGION_TO_BOSTA_CODE: Readonly<Record<string, string>> = {
  CAIRO: "EG-01",
  ALEXANDRIA: "EG-02",
  BEHEIRA: "EG-04",
  DAKAHLIA: "EG-05",
  QALIUBIA: "EG-06",
  GHARBIA: "EG-07",
  "KAFR EL SHEIKH": "EG-08",
  MONUFIA: "EG-09",
  SHARKIA: "EG-10",
  ISMAILIA: "EG-11",
  SUEZ: "EG-12",
  "PORT SAID": "EG-13",
  DAMIETTA: "EG-14",
  FAYOUM: "EG-15",
  "BENI SUEF": "EG-16",
  ASSIUT: "EG-17",
  SOHAG: "EG-18",
  MINYA: "EG-19",
  QENA: "EG-20",
  ASWAN: "EG-21",
  LUXOR: "EG-22",
  "RED SEA": "EG-23",
  "NEW VALLEY": "EG-24",
  GIZA: "EG-25",
  "SOUTH SINAI": "EG-26",
  "NORTH SINAI": "EG-27",
  "MARSA MATROUH": "EG-28",
};

/**
 * Bosta files some areas under a neighbouring governorate's city: Giza's
 * urban areas (Mohandessin, Agouza) and Obour sit in its "Cairo", Esna in
 * "Qena", and the "North Coast" city covers coastal Alexandria, Matrouh and
 * Beheira. These are searched after the governorate's own Bosta city.
 */
const NEIGHBOUR_CODES: Readonly<Record<string, readonly string[]>> = {
  CAIRO: ["EG-25", "EG-06"],
  GIZA: ["EG-01"],
  QALIUBIA: ["EG-01"],
  LUXOR: ["EG-20"],
  QENA: ["EG-22"],
  ALEXANDRIA: ["EG-03"],
  "MARSA MATROUH": ["EG-03"],
  BEHEIRA: ["EG-03"],
};

const CITY_BY_CODE = new Map(BOSTA_CITIES.map((row) => [row[3], row]));
const CITY_BY_ID = new Map(BOSTA_CITIES.map((row) => [row[0], row]));

export function bostaCityForRegion(regionCode: string): BostaCityRow | undefined {
  const code = REGION_TO_BOSTA_CODE[regionCode];
  return code ? CITY_BY_CODE.get(code) : undefined;
}

/** The Bosta cities searched for a governorate: its own first, then its neighbours. */
function citiesForRegion(regionCode: string): BostaCityRow[] {
  const own = REGION_TO_BOSTA_CODE[regionCode];
  if (!own) return [];
  return [own, ...(NEIGHBOUR_CODES[regionCode] ?? [])]
    .map((code) => CITY_BY_CODE.get(code))
    .filter((row): row is BostaCityRow => Boolean(row));
}

const DROP_WORDS = new Set(["qesm", "qism", "kism", "markaz", "city", "قسم", "مركز", "حي", "مدينه"]);

/**
 * A comparison key: normalised text without "el"/"al"/"ال" prefixes (Bosta
 * glues them: "ElMaadi"), without "qesm"/"markaz" and without spaces, so
 * "El Maadi", "ElMaadi", "Maadi" and "المعادي" / "معادي" agree per script.
 */
export function bostaNameKey(value: string): string {
  return normalizePlaceText(value)
    // Bosta writes hamza on the line ("حداءق"); normalizePlaceText already turned "حدائق" into "حدايق".
    .replace(/اء(?=[ء-ي])/g, "اي")
    .replace(/[ءئؤ]/g, "")
    .split(" ")
    .filter((token) => token && !DROP_WORDS.has(token) && token !== "el" && token !== "al")
    .map((token) => {
      if (/^(el|al)[a-z]{3,}$/.test(token)) return token.slice(2);
      if (/^ال[ء-ي]{2,}$/.test(token)) return token.slice(2);
      return token;
    })
    .join("");
}

/** "ElHay 06 (Nasr City)" → "ElHay 06": the part before Bosta's parenthesised area. */
function withoutParenthesis(value: string): string {
  return value.replace(/\s*\([^)]*\)\s*/g, " ").trim();
}

type DistrictEntry = {
  city: BostaCityRow;
  row: BostaDistrictRow;
  /** Keys of the district name (with and without its parenthesis), both scripts. */
  districtKeys: string[];
  /** Keys of the zone name, both scripts (the zone name falls back to the district's). */
  zoneKeys: string[];
};

const ENTRIES_BY_CITY = new Map<string, DistrictEntry[]>();
const ENTRY_BY_DISTRICT_ID = new Map<string, DistrictEntry>();

function keysOf(...names: string[]): string[] {
  return [...new Set(names.map(bostaNameKey).filter((key) => key.length >= 2))];
}

for (const city of BOSTA_CITIES) {
  const entries: DistrictEntry[] = [];
  for (const row of BOSTA_DISTRICTS[city[0]] ?? []) {
    const [, nameEn, nameAr, , zoneEn, zoneAr] = row;
    const entry: DistrictEntry = {
      city,
      row,
      districtKeys: keysOf(nameEn, nameAr, withoutParenthesis(nameEn), withoutParenthesis(nameAr)),
      zoneKeys: keysOf(zoneEn || nameEn, zoneAr || nameAr),
    };
    entries.push(entry);
    ENTRY_BY_DISTRICT_ID.set(row[0], entry);
  }
  ENTRIES_BY_CITY.set(city[0], entries);
}

export type BostaGeoInput = {
  /** A stored place key, when the address has one. */
  placeKey?: string | null;
  /** Governorate as typed. */
  state?: string | null;
  /** City / area as typed. */
  city?: string | null;
  addressLine1?: string | null;
  addressLine2?: string | null;
  /** The seller's manual pick for this order or area. */
  districtId?: string | null;
};

export type BostaGeoMatch =
  | { ok: true; destination: BostaDestination; via: "override" | "zone" | "district" }
  | {
      ok: false;
      /** `unknown_region`: no governorate; `no_coverage`: Bosta doesn't deliver there; `district_needed`: pick by hand. */
      reason: "unknown_region" | "no_coverage" | "district_needed";
      /** Bosta cities whose districts the picker should offer. */
      cityIds: string[];
    };

function destinationOf(entry: DistrictEntry): BostaDestination {
  return { city: entry.city[1], districtId: entry.row[0], zoneId: entry.row[3] };
}

function delivers(entry: DistrictEntry): boolean {
  return entry.row[6] === 1 && entry.city[4] === 1;
}

/**
 * Inside a matched zone: the district the address line names (longest name
 * wins), else the district named like the zone, else the first one Bosta
 * delivers to.
 */
function pickInZone(zone: DistrictEntry[], addressKeys: string[]): DistrictEntry | undefined {
  const open = zone.filter(delivers);
  if (open.length === 0) return undefined;
  let best: { entry: DistrictEntry; length: number } | undefined;
  for (const entry of open) {
    for (const key of entry.districtKeys) {
      if (key.length < 4 || entry.zoneKeys.includes(key)) continue;
      if (addressKeys.some((address) => address.includes(key)) && (!best || key.length > best.length)) {
        best = { entry, length: key.length };
      }
    }
  }
  if (best) return best.entry;
  return open.find((entry) => entry.districtKeys.some((key) => entry.zoneKeys.includes(key))) ?? open[0];
}

function placeNames(placeKey: string | null, rawCity: string | null | undefined): string[] {
  const names: string[] = [];
  const place = placeKey ? getPlace(placeKey) : undefined;
  if (place?.level === "city") names.push(place.nameEn, place.nameAr, ...(place.aliases ?? []));
  if (rawCity) names.push(rawCity);
  return names;
}

export function resolveBostaDestination(input: BostaGeoInput): BostaGeoMatch {
  if (input.districtId) {
    const entry = ENTRY_BY_DISTRICT_ID.get(input.districtId);
    if (entry) {
      return delivers(entry)
        ? { ok: true, destination: destinationOf(entry), via: "override" }
        : { ok: false, reason: "no_coverage", cityIds: [entry.city[0]] };
    }
  }

  const placeKey =
    input.placeKey && getPlace(input.placeKey)
      ? input.placeKey
      : resolveAddressPlace({ state: input.state, city: input.city, addressLine1: input.addressLine1 });
  const regionCode = placeKey?.split("/")[1];
  const cities = regionCode ? citiesForRegion(regionCode) : [];
  if (cities.length === 0) return { ok: false, reason: "unknown_region", cityIds: [] };
  const cityIds = cities.map((city) => city[0]);
  if (!cities.some((city) => city[4] === 1)) return { ok: false, reason: "no_coverage", cityIds };

  const nameKeys = keysOf(...placeNames(placeKey ?? null, input.city));
  if (nameKeys.length === 0) return { ok: false, reason: "district_needed", cityIds };
  const addressKeys = [input.addressLine1, input.addressLine2, input.city]
    .filter((line): line is string => Boolean(line))
    .map(bostaNameKey);

  let closedZone = false;
  for (const city of cities) {
    const entries = ENTRIES_BY_CITY.get(city[0]) ?? [];
    // 1. The area is a Bosta zone: choose the district inside it.
    const zone = entries.filter((entry) => entry.zoneKeys.some((key) => nameKeys.includes(key)));
    if (zone.length > 0) {
      const entry = pickInZone(zone, addressKeys);
      if (entry) return { ok: true, destination: destinationOf(entry), via: "zone" };
      closedZone = true;
      continue;
    }
    // 2. The area is itself a Bosta district.
    const district = entries.find((entry) => delivers(entry) && entry.districtKeys.some((key) => nameKeys.includes(key)));
    if (district) return { ok: true, destination: destinationOf(district), via: "district" };
  }
  // 3. Bosta splits the area ("Sidi Beshr Bahri" / "Qebli"): a district named after it, in the
  //    governorate's own Bosta city only, so a same-named village elsewhere never wins.
  const own = ENTRIES_BY_CITY.get(cities[0]![0]) ?? [];
  const split = own.find(
    (entry) => delivers(entry) && entry.districtKeys.some((key) => nameKeys.some((name) => name.length >= 4 && key.startsWith(name))),
  );
  if (split) return { ok: true, destination: destinationOf(split), via: "district" };
  return { ok: false, reason: closedZone ? "no_coverage" : "district_needed", cityIds };
}

export type BostaDistrictOption = {
  districtId: string;
  /** "District — Zone" in the requested language. */
  label: string;
  cityName: string;
};

/** Districts Bosta delivers to in these cities, for the seller's manual pick. */
export function bostaDistrictOptions(cityIds: string[], locale: string): BostaDistrictOption[] {
  const arabic = locale.startsWith("ar");
  const options: BostaDistrictOption[] = [];
  for (const cityId of cityIds) {
    const city = CITY_BY_ID.get(cityId);
    if (!city) continue;
    for (const entry of ENTRIES_BY_CITY.get(cityId) ?? []) {
      if (!delivers(entry)) continue;
      const [districtId, nameEn, nameAr, , zoneEn, zoneAr] = entry.row;
      const name = arabic ? nameAr || nameEn : nameEn || nameAr;
      const zone = arabic ? zoneAr || zoneEn : zoneEn || zoneAr;
      options.push({ districtId, label: zone ? `${name} — ${zone}` : name, cityName: arabic ? city[2] : city[1] });
    }
  }
  return options;
}
