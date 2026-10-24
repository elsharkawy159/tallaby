/** A new seller isn't asked on their first day, so the question never lands on the welcome screen. */
const WAIT_MS = 24 * 60 * 60 * 1000;

/**
 * Whether to show the "where did you hear about us" pop-up (0099): only while
 * unanswered, and only once the seller's first store is a day old.
 * `firstStoreAt` is `sellers.fee_trial_started_at`, which is set from the
 * first store's created_at (0067).
 */
export function shouldAskHeardAboutUs({
  answeredAt,
  firstStoreAt,
  now = new Date(),
}: {
  answeredAt: string | Date | null;
  firstStoreAt: string | Date | null;
  now?: Date;
}): boolean {
  if (answeredAt || !firstStoreAt) return false;
  const started = new Date(firstStoreAt).getTime();
  if (Number.isNaN(started)) return false;
  return now.getTime() - started >= WAIT_MS;
}
