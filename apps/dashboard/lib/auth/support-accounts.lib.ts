/**
 * Tallaby's own seller accounts that the team uses to help sellers. They get
 * small helper tools in the dashboard (the sidebar's "copy page link"). The
 * tools only copy public dashboard URLs, so this is a convenience, not a
 * security boundary. Server only: send the client the boolean, never the list.
 */
export const SUPPORT_ACCOUNT_EMAILS: readonly string[] = ["seller@tallaby.com"];

/** Whether the signed-in user's email (any case, surrounding spaces ignored) is a support account. */
export function isSupportAccount(email: string | null | undefined): boolean {
  if (!email) return false;
  return SUPPORT_ACCOUNT_EMAILS.includes(email.trim().toLowerCase());
}
