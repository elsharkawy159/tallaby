"use client";

import { useEffect, useState } from "react";
import { currencyForCountry } from "./local-currency.lib";

/**
 * The visitor's currency for tallaby.com's prices (plan cards and the /pricing
 * estimator), shared so a page asks `/api/geo` once, and kept for the session.
 */

const STORAGE_KEY = "tallaby:geo-country";
let countryPromise: Promise<string | null> | null = null;

/** The visitor's country, asked once per page load and kept for the session. */
function visitorCountry(): Promise<string | null> {
  if (countryPromise) return countryPromise;
  // Outside production /api/geo honours ?country=SA, so the swap can be tried locally.
  const override = new URLSearchParams(window.location.search).get("country");
  countryPromise = (async () => {
    if (!override) {
      try {
        const saved = window.sessionStorage.getItem(STORAGE_KEY);
        if (saved !== null) return saved || null;
      } catch {
        // Storage blocked (private window): ask again next time.
      }
    }
    const response = await fetch(override ? `/api/geo?country=${encodeURIComponent(override)}` : "/api/geo", { cache: "no-store" });
    if (!response.ok) throw new Error(`geo http_${response.status}`);
    const { country } = (await response.json()) as { country: string | null };
    if (!override) {
      try {
        window.sessionStorage.setItem(STORAGE_KEY, country ?? "");
      } catch {
        // Storage blocked (private window): ask again next time.
      }
    }
    return country;
  })();
  return countryPromise;
}

/**
 * The currency to show: "EGP" on the server render and until the country is
 * known (most visitors, and what crawlers index), then the visitor's currency
 * if `available(code)`, else null (USD only). If the country can't be read,
 * EGP stays.
 */
export function useVisitorCurrency(available: (code: string) => boolean): string | null {
  const [country, setCountry] = useState<{ known: boolean; code: string | null }>({ known: false, code: null });
  useEffect(() => {
    let live = true;
    visitorCountry()
      .then((code) => {
        if (live) setCountry({ known: true, code });
      })
      .catch(() => {});
    return () => {
      live = false;
    };
  }, []);
  if (!country.known) return available("EGP") ? "EGP" : null;
  const code = currencyForCountry(country.code);
  return code && available(code) ? code : null;
}
