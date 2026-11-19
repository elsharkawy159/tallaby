import { describe, expect, it } from "vitest";
import { COMPETITORS, MAX_FACT_AGE_DAYS, publishableCompetitors } from "./compare.lib";
import { COMPETITOR_PRICES } from "./pricing.lib";

const DAY = 24 * 60 * 60 * 1000;
const ageInDays = (iso: string, now: number) => Math.floor((now - Date.parse(`${iso}T00:00:00Z`)) / DAY);

/**
 * `SEO_PLAN.md` §4.2: a competitor fact or price older than 90 days fails here,
 * so stale prices can't ship. Re-read the source, then update `checkedOn`
 * (and `docs/seo-research/`). EasyOrders doubled its prices between 2023 and 2026.
 */
describe("compare facts age", () => {
  const now = Date.now();

  it.each(publishableCompetitors().map((competitor) => [competitor.id, competitor] as const))("%s: every fact was read in the last 90 days", (_id, competitor) => {
    for (const [row, fact] of Object.entries(competitor.facts)) {
      const age = ageInDays(fact!.checkedOn, now);
      expect(age, `${competitor.id}.${row} read ${fact!.checkedOn}`).toBeLessThanOrEqual(MAX_FACT_AGE_DAYS);
      expect(age, `${competitor.id}.${row} is dated in the future`).toBeGreaterThanOrEqual(-1);
    }
  });

  it("every competitor price used on a page was read in the last 90 days", () => {
    const used = new Set(COMPETITORS.filter((competitor) => publishableCompetitors().includes(competitor)).flatMap((competitor) => competitor.prices));
    for (const key of used) {
      expect(ageInDays(COMPETITOR_PRICES[key].checkedOn, now), key).toBeLessThanOrEqual(MAX_FACT_AGE_DAYS);
    }
  });
});
