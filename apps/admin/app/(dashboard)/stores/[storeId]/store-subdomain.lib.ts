/** "Edit subdomain" on the store page: messages and the live format hint. No React, no server code. */
import {
  SUBDOMAIN_MAX_LENGTH,
  SUBDOMAIN_MIN_LENGTH,
  normalizeSubdomain,
  validateSubdomain,
  type SubdomainProblem,
} from "@workspace/lib/storefront";

const MESSAGES: Record<string, string> = {
  not_admin: "Only verified admins can make this change.",
  invalid_input: "Enter a subdomain and a reason of 3–500 characters.",
  not_found: "Store not found.",
  no_change: "The store already uses this subdomain.",
  store_read_only: "Only an active store can change its subdomain. Unsuspend or restore it first.",
  taken: "Another store already uses this subdomain, or keeps it as an old address.",
  tooShort: `Use at least ${SUBDOMAIN_MIN_LENGTH} characters.`,
  tooLong: `Use at most ${SUBDOMAIN_MAX_LENGTH} characters.`,
  invalid: "Use lowercase English letters, digits and single hyphens, not at the start or end.",
  reserved: "This name is reserved by Tallaby.",
  generic: "Something went wrong. Try again.",
};

/** A server or validation error code → the admin-facing message. */
export const storeSubdomainError = (code: string): string => MESSAGES[code] ?? MESSAGES.generic!;

export type SubdomainHint = { subdomain: string; problem: SubdomainProblem | "same" | null };

/**
 * The live hint while the admin types: the same rules the server applies
 * (`validateSubdomain`), plus "same" for the store's current subdomain.
 * Whether another store has it is only known on save.
 */
export function subdomainHint(input: string, current: string): SubdomainHint {
  const subdomain = normalizeSubdomain(input);
  if (subdomain === current) return { subdomain, problem: "same" };
  return { subdomain, problem: validateSubdomain(subdomain) };
}
