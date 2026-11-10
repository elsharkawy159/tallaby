"use client";

import { useEffect, useState } from "react";
import { visitorCurrency } from "./local-currency.lib";
import { countryFromServerTiming, normalizeCountry } from "./visitor-country.lib";

/**
 * The visitor's currency for tallaby.com's prices, shared so a page resolves
 * the country once, and kept for the session.
 */

const STORAGE_KEY = "tallaby:geo-country";
let countryPromise: Promise<string | null> | null = null;

/** The country the proxy put on this page's response (`Server-Timing: geo`), or null (older browser, bfcache, no header). */
function countryFromNavigation(): string | null {
  try {
    const [entry] = performance.getEntriesByType("navigation") as PerformanceNavigationTiming[];
    return countryFromServerTiming(entry?.serverTiming);
  } catch {
    return null;
  }
}

function saveCountry(country: string | null) {
  try {
    window.sessionStorage.setItem(STORAGE_KEY, country ?? "");
  } catch {
    // Storage blocked (private window): ask again next time.
  }
}

/**
 * The visitor's country without a network call, or undefined when it has to
 * be asked: the page's own `Server-Timing` first (fresh for this load), then
 * the session's saved answer. Outside production a `?country=` override
 * always asks `/api/geo`, which honours it.
 */
function knownCountry(override: string | null): string | null | undefined {
  if (override) return undefined;
  const fromServer = countryFromNavigation();
  if (fromServer) {
    saveCountry(fromServer);
    return fromServer;
  }
  try {
    const saved = window.sessionStorage.getItem(STORAGE_KEY);
    if (saved !== null) return normalizeCountry(saved);
  } catch {
    // Storage blocked (private window): ask /api/geo.
  }
  return undefined;
}

/** The visitor's country, resolved once per page load. */
function visitorCountry(): Promise<string | null> {
  if (countryPromise) return countryPromise;
  const override = new URLSearchParams(window.location.search).get("country");
  const known = knownCountry(override);
  if (known !== undefined) {
    countryPromise = Promise.resolve(known);
    return countryPromise;
  }
  countryPromise = (async () => {
    const response = await fetch(override ? `/api/geo?country=${encodeURIComponent(override)}` : "/api/geo", { cache: "no-store" });
    if (!response.ok) throw new Error(`geo http_${response.status}`);
    const { country } = (await response.json()) as { country: string | null };
    if (!override) saveCountry(country);
    return normalizeCountry(country);
  })();
  return countryPromise;
}

/**
 * The visitor's country: null on the server render and until it is known,
 * and null for good if it can't be read. Shared by the prices and the wallet
 * top-up copy (`top-up-copy.lib.ts`), so a page asks once.
 */
export function useVisitorCountry(): string | null {
  const [country, setCountry] = useState<string | null>(null);
  useEffect(() => {
    let live = true;
    visitorCountry()
      .then((code) => {
        if (live) setCountry(code);
      })
      .catch(() => {});
    return () => {
      live = false;
    };
  }, []);
  return country;
}

/**
 * The currency to show: the page's default on the server render and until the
 * country is known (EGP on Arabic pages, USD on English ones; what crawlers
 * index), then the visitor's country's currency if `available(code)` (we have
 * a rate), else USD. If the country can't be read, the default stays.
 */
export function useVisitorCurrency(locale: string, available: (code: string) => boolean): string {
  return visitorCurrency(useVisitorCountry(), locale, available);
}
