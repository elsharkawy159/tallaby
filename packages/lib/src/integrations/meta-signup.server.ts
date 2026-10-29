import { createHash } from "node:crypto";
import { DEFAULT_META_GRAPH_VERSION, postMetaCapiEvents, type MetaCapiCredentials } from "./meta-capi.lib";
import {
  metaPhoneDigits,
  signupEventId,
  signupEventParams,
  type SignupMethod,
  type SignupRequestContext,
} from "./meta-signup.lib";

const sha256 = (value: string) => createHash("sha256").update(value).digest("hex");

/** Tallaby's own Pixel and token (env); null in local/dev when they are unset. */
function tallabyCredentials(): MetaCapiCredentials | null {
  const pixelId = process.env.META_PIXEL_ID || process.env.NEXT_PUBLIC_META_PIXEL_ID;
  const accessToken = process.env.META_CAPI_TOKEN;
  if (!pixelId || !accessToken) return null;
  return { pixelId, accessToken, testEventCode: process.env.META_CAPI_TEST_EVENT_CODE || null };
}

export type SignupCapiInput = {
  userId: string;
  email: string | null | undefined;
  phone: string | null | undefined;
  method: SignupMethod;
  context: SignupRequestContext;
};

/** The CAPI body: same event id as the browser event, PII hashed (SHA-256). */
export function buildSignupCapiEvent(input: SignupCapiInput, now = Date.now()): Record<string, unknown> {
  const { context } = input;
  const email = input.email?.trim().toLowerCase();
  const phone = metaPhoneDigits(input.phone);
  const userData: Record<string, unknown> = { external_id: [sha256(input.userId)] };
  if (email) userData.em = [sha256(email)];
  if (phone) userData.ph = [sha256(phone)];
  if (context.clientIpAddress) userData.client_ip_address = context.clientIpAddress;
  if (context.clientUserAgent) userData.client_user_agent = context.clientUserAgent;
  if (context.fbp) userData.fbp = context.fbp;
  if (context.fbc) userData.fbc = context.fbc;

  return {
    event_name: "CompleteRegistration",
    event_time: Math.floor(now / 1000),
    event_id: signupEventId(input.userId),
    event_source_url: context.eventSourceUrl ?? undefined,
    action_source: "website",
    user_data: userData,
    custom_data: signupEventParams(input.method),
  };
}

/**
 * Sends CompleteRegistration to Tallaby's Pixel through the Conversions API.
 * Never throws: signup must not fail or wait on Meta, so callers run it in
 * `after()`. Errors are redacted by `postMetaCapiEvents` and only logged.
 */
export async function sendSignupCapiEvent(input: SignupCapiInput): Promise<void> {
  try {
    const credentials = tallabyCredentials();
    if (!credentials) return;
    const result = await postMetaCapiEvents(credentials, [buildSignupCapiEvent(input)], {
      graphVersion: process.env.META_GRAPH_API_VERSION || DEFAULT_META_GRAPH_VERSION,
    });
    if (!result.ok) console.error("[meta signup] CAPI error:", result.error);
  } catch (error) {
    console.error("[meta signup] CAPI send failed", error instanceof Error ? error.name : "unknown");
  }
}
