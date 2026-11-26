/** Only sellers who signed up in the last 14 days get the tour; older sellers already know the dashboard. */
export const WELCOME_TOUR_WINDOW_DAYS = 14;

const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * Whether the seller is new enough for the welcome tour: `sellers.created_at`
 * within the last WELCOME_TOUR_WINDOW_DAYS days. No or a bad date: no tour.
 */
export function isWelcomeTourEligible({
  sellerCreatedAt,
  now = new Date(),
}: {
  sellerCreatedAt: string | Date | null | undefined;
  now?: Date;
}): boolean {
  if (!sellerCreatedAt) return false;
  const created = new Date(sellerCreatedAt).getTime();
  if (Number.isNaN(created)) return false;
  const age = now.getTime() - created;
  return age >= 0 && age < WELCOME_TOUR_WINDOW_DAYS * DAY_MS;
}

/** Per user and per browser: once seen, the tour never opens again there. */
export function welcomeTourStorageKey(userId: string): string {
  return `tallaby:welcome-tour:${userId}`;
}

/** The tour's steps, most important first. */
export const WELCOME_TOUR_STEPS = ["products", "website", "payments", "wallet"] as const;
export type WelcomeTourStep = (typeof WELCOME_TOUR_STEPS)[number];
