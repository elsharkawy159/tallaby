// Copied from apps/dashboard/app/signup (P2-03). Keep both in sync, except the
// signup hint cookie below, which only the marketing site carries.
import { cookies } from "next/headers";
import {
  SIGNUP_INTENT_TTL_MS,
  signSignupIntent,
  verifySignupIntent,
  type SignupIntent,
} from "./signup-intent.lib";
import { cleanSignupHint, type SignupHint } from "./signup-hint.lib";

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

/** Unsigned on purpose: only a pre-fill and a redirect hint, cleaned on read (`cleanSignupHint`). */
const HINT_COOKIE = "tallaby_signup_hint";

export async function setSignupHintCookie(hint: SignupHint | null): Promise<void> {
  const store = await cookies();
  const clean = cleanSignupHint(hint);
  if (!clean) {
    store.delete(HINT_COOKIE);
    return;
  }
  store.set(HINT_COOKIE, JSON.stringify(clean), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SIGNUP_INTENT_TTL_MS / 1000,
  });
}

export async function readSignupHintCookie(): Promise<SignupHint | null> {
  const store = await cookies();
  const value = store.get(HINT_COOKIE)?.value;
  if (!value || value.length > 256) return null;
  try {
    return cleanSignupHint(JSON.parse(value));
  } catch {
    return null;
  }
}

export async function clearSignupHintCookie(): Promise<void> {
  const store = await cookies();
  store.delete(HINT_COOKIE);
}
