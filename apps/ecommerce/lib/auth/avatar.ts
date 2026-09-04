import { getPublicUrl } from "@workspace/ui/lib/utils";

/**
 * The single place a stored avatar value becomes a renderable URL.
 *
 * Accepts either an absolute URL (OAuth providers hand us one directly) or a
 * path inside the public `avatars` Storage bucket, and always returns an
 * absolute URL or null. Every avatar in the app resolves through here so the
 * navbar, the profile page and the uploader cannot disagree about what a
 * given stored value means.
 */
export function resolveAvatarUrl(
  avatarPath: string | null | undefined
): string | null {
  if (typeof avatarPath !== "string") return null;

  const trimmed = avatarPath.trim();
  if (!trimmed) return null;

  // Already absolute (Google, Facebook, GitHub, X, or a previously-resolved
  // Supabase public URL) — hand it back untouched.
  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
    return trimmed;
  }

  return getPublicUrl(trimmed, "avatars") || null;
}

/**
 * Canonical precedence for a user's avatar.
 *
 * The application profile row wins: it is what this app writes on upload and
 * what the rest of the schema (review authors, seller pages) reads. Supabase
 * Auth metadata is the fallback, which is where an OAuth provider's picture
 * lands on first sign-in and where avatars uploaded before the profile row
 * became canonical still live.
 */
export function pickAvatarSource(
  profileAvatarUrl: string | null | undefined,
  metadataAvatarUrl: string | null | undefined
): string | null {
  return resolveAvatarUrl(profileAvatarUrl) ?? resolveAvatarUrl(metadataAvatarUrl);
}

/**
 * The shapes `UserAvatar` accepts.
 *
 * Structural rather than a union of named types so the one avatar component can
 * render the canonical `AuthenticatedUserDisplay` (navbar), the profile page's
 * `ProfileDisplayUser`, and a raw Supabase `User` without any caller casting to
 * `any` — which is what every one of these call sites used to do.
 */
export interface AvatarSubject {
  email?: string | null;
  name?: string | null;
  fullName?: string | null;
  avatarUrl?: string | null;
  user_metadata?: {
    avatar_url?: string | null;
    avatarUrl?: string | null;
    picture?: string | null;
    full_name?: string | null;
    fullName?: string | null;
    name?: string | null;
    firstName?: string | null;
    lastName?: string | null;
  } | null;
}

export interface AvatarPresentation {
  /** Absolute image URL, or null when the account has no avatar. */
  src: string | null;
  /** 1-2 letter initials shown when there is no image or it fails to load. */
  initials: string;
  /** Accessible name for the image. */
  alt: string;
}

function firstNonEmpty(
  ...values: Array<string | null | undefined>
): string | null {
  for (const value of values) {
    if (typeof value === "string" && value.trim()) return value.trim();
  }
  return null;
}

export function getAvatarDisplayName(user: AvatarSubject | null): string | null {
  if (!user) return null;
  const metadata = user.user_metadata ?? undefined;

  return firstNonEmpty(
    user.name,
    user.fullName,
    metadata?.fullName,
    metadata?.full_name,
    metadata?.name,
    `${metadata?.firstName ?? ""} ${metadata?.lastName ?? ""}`.trim() || null,
    user.email
  );
}

export function getAvatarInitials(user: AvatarSubject | null): string {
  const name = getAvatarDisplayName(user);
  if (!name) return "U";

  // An email fallback has no meaningful second part — take one letter.
  if (name.includes("@")) return name.charAt(0).toUpperCase();

  const parts = name.split(/\s+/).filter(Boolean);
  const first = parts[0]?.charAt(0) ?? "";
  const last = parts.length > 1 ? (parts[parts.length - 1]?.charAt(0) ?? "") : "";
  const initials = `${first}${last}`.toUpperCase();

  return initials || "U";
}

/**
 * Everything `UserAvatar` needs, derived in one place so the navbar, the
 * profile page and the uploader cannot render a person differently.
 */
export function getAvatarPresentation(
  user: AvatarSubject | null
): AvatarPresentation {
  const metadata = user?.user_metadata ?? undefined;

  return {
    src: pickAvatarSource(
      user?.avatarUrl,
      firstNonEmpty(
        metadata?.avatar_url,
        metadata?.avatarUrl,
        metadata?.picture
      )
    ),
    initials: getAvatarInitials(user ?? null),
    alt: getAvatarDisplayName(user ?? null) ?? "User avatar",
  };
}
