/**
 * The one shape the UI uses to describe "who is signed in".
 *
 * Deliberately NOT Supabase's `User`. Authentication data (Supabase Auth) and
 * application profile data (the `users` table) are two different records with
 * two different lifecycles; this is the flattened display projection of both,
 * resolved once on the server. Keeping it separate is what lets the navbar,
 * the seller CTA and the contact form share a single lookup without any of
 * them reaching into `user_metadata` on their own.
 *
 * This module holds types only and imports nothing, so client components can
 * import it without dragging the server-only database client into the bundle.
 */
export interface AuthenticatedUserDisplay {
  id: string;
  email: string | null;
  /** Best available display name; null when the account has none. */
  name: string | null;
  /**
   * Fully-resolved absolute avatar URL, or null. Never a bare storage path —
   * resolution happens once, server-side, in `resolveAvatarUrl`.
   */
  avatarUrl: string | null;
  /** True only for an approved seller, not merely a claimed one. */
  isSeller: boolean;
}
