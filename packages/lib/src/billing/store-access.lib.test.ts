import { describe, expect, it } from "vitest";
import { signStoreOwnerPass, verifyStoreOwnerPass } from "../store-sites/owner-pass";
import { orderLockState } from "./order-lock.lib";
import { activationAccess, isTestOrderAccess } from "./store-access.lib";

const SECRET = "s".repeat(40);
const STORE = "11111111-1111-4111-8111-111111111111";
const OTHER_STORE = "22222222-2222-4222-8222-222222222222";
const SELLER = "33333333-3333-4333-8333-333333333333";
const NOW = Date.UTC(2026, 10, 6);

const free = { plan: "free", planExpiresAt: null, planGraceUntil: null };
const pro = { plan: "pro", planExpiresAt: new Date(NOW + 10 * 86_400_000).toISOString(), planGraceUntil: null };

const lock = (overrides: Partial<Parameters<typeof orderLockState>[0]> = {}) =>
  orderLockState({
    usdLive: true,
    seller: free,
    hasTopUp: false,
    hasHadPositiveBalance: false,
    hasPendingManualTopUp: false,
    at: new Date(NOW),
    ...overrides,
  });

const valid = signStoreOwnerPass({ storeId: STORE, sellerId: SELLER, secret: SECRET, now: NOW }).token;
const expired = signStoreOwnerPass({ storeId: STORE, sellerId: SELLER, secret: SECRET, now: NOW - 31 * 86_400_000 }).token;
const wrongStore = signStoreOwnerPass({ storeId: OTHER_STORE, sellerId: SELLER, secret: SECRET, now: NOW }).token;
const tampered = `${valid.split(".")[0]}x.${valid.split(".")[1]}`;

const PASSES: Record<string, string | undefined> = { none: undefined, valid, expired, wrongStore, tampered };

/** What the store host does: verify the cookie against the host's store and its seller. */
const passOk = (token: string | undefined) =>
  verifyStoreOwnerPass(token, { secret: SECRET, storeId: STORE, sellerId: SELLER, now: NOW }).ok;

describe("activation access × owner pass (F-76)", () => {
  const states = {
    notActivated: lock(),
    pendingReview: lock({ hasPendingManualTopUp: true }),
    toppedUp: lock({ hasTopUp: true }),
    hadBalance: lock({ hasHadPositiveBalance: true }),
    pro: lock({ seller: pro }),
    usdOff: lock({ usdLive: false }),
  };

  for (const [state, l] of Object.entries(states)) {
    for (const [pass, token] of Object.entries(PASSES)) {
      const locked = state === "notActivated" || state === "pendingReview";
      const expected = !locked ? "public" : pass === "valid" ? "owner_preview" : "private";
      it(`${state} with ${pass} pass → ${expected}`, () => {
        const access = activationAccess(l, passOk(token));
        expect(access).toBe(expected);
        expect(isTestOrderAccess(access)).toBe(expected === "owner_preview");
      });
    }
  }
});
