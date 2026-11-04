/** A titled paragraph in a legal section ("Plans. Tallaby has two plans…"). */
export type LegalClause = {
  title: string;
  body: string;
  /** Names the day of the USD switch through `{date}`, so it stays hidden until that date exists. */
  needsSwitchDate?: boolean;
};

/**
 * The clauses to publish. A clause that needs the switch date is left out until
 * the date is set, so a placeholder can never reach the page.
 */
export function publishedClauses(clauses: LegalClause[], switchDate: string | null): LegalClause[] {
  return clauses.flatMap((clause) => {
    if (!clause.needsSwitchDate) return [clause];
    return switchDate ? [{ ...clause, body: clause.body.replaceAll("{date}", switchDate) }] : [];
  });
}
