import type { Design } from "../builder";
import { rewardsBirthday } from "./rewards-birthday";
import { rewardsGift } from "./rewards-gift";

/**
 * Gifts & occasions (library A, "Rewards & gift cards"). The store has no
 * points, levels, referrals or gift cards, so only the two sections that stay
 * honest as seller content are built: a gift promo that leads to products
 * and a birthday sign-up through one of the store's forms. Points, tiers,
 * referral, rewards catalogue, balance, points history, gift-card balance,
 * members-only prices and the daily streak (A-a, b, d, e, f, h, i, j, k)
 * would promise a programme the platform does not run. First is the default.
 */
export const LOYALTY_DESIGNS: readonly Design[] = [
  rewardsGift,
  rewardsBirthday,
];
