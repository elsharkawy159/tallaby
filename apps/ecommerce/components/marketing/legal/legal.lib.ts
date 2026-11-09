import { fillPriceTokens } from "@/lib/marketing/pricing.lib";

/** A titled paragraph in a legal section ("Plans. Tallaby has two plans…"). */
export type LegalClause = {
  title: string;
  body: string;
  /** Names the day of the USD switch through `{date}`, so it stays hidden until that date exists. */
  needsSwitchDate?: boolean;
};

/**
 * The clauses to publish. A clause that needs the switch date is left out until
 * the date is set, so a placeholder can never reach the page. Price tokens
 * (`{orderFee}`, `{pro}`, `{topUpMin}`) are filled from `prices` when given; the page
 * leaves them for `withPrices`, which shows them in the visitor's currency.
 */
export function publishedClauses(clauses: LegalClause[], switchDate: string | null, prices: Record<string, string> = {}): LegalClause[] {
  return clauses.flatMap((clause) => {
    const body = fillPriceTokens(clause.body, prices);
    if (!clause.needsSwitchDate) return [{ ...clause, body }];
    return switchDate ? [{ ...clause, body: body.replaceAll("{date}", switchDate) }] : [];
  });
}
