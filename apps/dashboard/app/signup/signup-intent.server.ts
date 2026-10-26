import { cookies } from "next/headers";
import {
  SIGNUP_INTENT_TTL_MS,
  signSignupIntent,
  verifySignupIntent,
  type SignupIntent,
} from "./signup-intent.lib";

/** httpOnly cookie that carries the signup choices across the OAuth / email round-trip. */
const COOKIE = "tallaby_signup_intent";

function secret(): string {
  return process.env.SIGNUP_INTENT_SECRET ?? "";
}

export async function setSignupIntentCookie(intent: SignupIntent): Promise<void> {
  const store = await cookies();
  store.set(COOKIE, signSignupIntent(intent, secret()), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SIGNUP_INTENT_TTL_MS / 1000,
  });
}

export async function readSignupIntentCookie(): Promise<SignupIntent | null> {
  const store = await cookies();
  const token = store.get(COOKIE)?.value;
  return token ? verifySignupIntent(token, secret()) : null;
}

export async function clearSignupIntentCookie(): Promise<void> {
  const store = await cookies();
  store.delete(COOKIE);
}

/**
 * The store address typed on the marketing site, carried from step 1 to the
 * store step. Only a pre-fill: the field is still checked live and on submit.
 */
const PREFILL_COOKIE = "tallaby_signup_subdomain";

export function cleanSubdomainPrefill(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const clean = value.trim().toLowerCase().replace(/[^a-z0-9-]/g, "").slice(0, 32);
  return clean || null;
}

export async function setSignupPrefillCookie(subdomain: string | null): Promise<void> {
  const store = await cookies();
  if (!subdomain) {
    store.delete(PREFILL_COOKIE);
    return;
  }
  store.set(PREFILL_COOKIE, subdomain, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24,
  });
}

export async function readSignupPrefillCookie(): Promise<string | null> {
  const store = await cookies();
  return cleanSubdomainPrefill(store.get(PREFILL_COOKIE)?.value);
}
