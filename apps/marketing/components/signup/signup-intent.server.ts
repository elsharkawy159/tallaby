// Copied from apps/dashboard/app/signup (P2-03). Keep both in sync.
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
