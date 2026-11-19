"use client";

import type { ReactNode } from "react";
import { topUpCopyVariant } from "@/lib/marketing/top-up-copy.lib";
import { useVisitorCountry } from "@/lib/marketing/visitor-currency.client";

/**
 * A wallet top-up sentence in the visitor's version (owner, 2026-11-10): `egp`
 * on the server render, in Egypt and while the country is unknown; `usdCard`
 * once a country other than Egypt is known. Both are rendered by the server
 * and passed in, so the page stays static. Keep the two about the same length.
 */
export function TopUpCopy({ egp, usdCard }: { egp: ReactNode; usdCard: ReactNode }) {
  return <>{topUpCopyVariant(useVisitorCountry()) === "usdCard" ? usdCard : egp}</>;
}
