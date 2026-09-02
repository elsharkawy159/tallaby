import type { users } from "@workspace/db";

type DbUser = typeof users.$inferSelect;

export interface ProfileDisplayUser {
  id: string;
  email: string;
  phone?: string | null;
  user_metadata: {
    fullName?: string;
    full_name?: string;
    phone?: string;
    preferredLanguage?: string;
    defaultCurrency?: string;
    receiveMarketingEmails?: boolean;
    avatar_url?: string | null;
    referral_code?: string;
  };
  fullName?: string | null;
  avatarUrl?: string | null;
}

export function isGuestEmail(email: string | null | undefined): boolean {
  return Boolean(email?.includes("@temp.local"));
}

export function formatProfileEmail(email: string | null | undefined): string {
  if (!email || isGuestEmail(email)) {
    return "";
  }

  return email;
}

export function dbUserToProfileUser(dbUser: DbUser): ProfileDisplayUser {
  const displayName = dbUser.fullName?.trim() || "Guest User";

  return {
    id: dbUser.id,
    email: formatProfileEmail(dbUser.email),
    phone: dbUser.phone,
    fullName: dbUser.fullName,
    avatarUrl: dbUser.avatarUrl,
    user_metadata: {
      fullName: displayName,
      full_name: displayName,
      phone: dbUser.phone ?? "",
      preferredLanguage: dbUser.preferredLanguage ?? "en",
      defaultCurrency: dbUser.defaultCurrency ?? "EGP",
      receiveMarketingEmails: dbUser.receiveMarketingEmails ?? true,
      avatar_url: dbUser.avatarUrl,
    },
  };
}
