import { createHash } from "node:crypto";
import { describe, expect, it } from "vitest";
import {
  metaPhoneDigits,
  parseSignupMethod,
  signupEventId,
  signupMethodOf,
  signupRequestContext,
} from "./meta-signup.lib";
import { buildSignupCapiEvent } from "./meta-signup.server";

const sha256 = (value: string) => createHash("sha256").update(value).digest("hex");

const context = {
  clientIpAddress: "41.1.2.3",
  clientUserAgent: "Mozilla/5.0",
  fbp: "fb.1.1700000000000.123",
  fbc: null,
  eventSourceUrl: "https://tallaby.com/",
};

describe("signup event helpers", () => {
  it("uses one event id per user", () => {
    expect(signupEventId("u1")).toBe("signup_u1");
  });

  it("reads the method from the auth provider", () => {
    expect(signupMethodOf({ app_metadata: { provider: "google" } })).toBe("google");
    expect(signupMethodOf({ app_metadata: { provider: "email" } })).toBe("email");
    expect(signupMethodOf({ app_metadata: null })).toBe("email");
  });

  it("accepts only known methods from the URL", () => {
    expect(parseSignupMethod("google")).toBe("google");
    expect(parseSignupMethod("email")).toBe("email");
    expect(parseSignupMethod("facebook")).toBeNull();
    expect(parseSignupMethod(["email"])).toBeNull();
  });

  it("adds the Egyptian country code to local phones", () => {
    expect(metaPhoneDigits("01012345678")).toBe("201012345678");
    expect(metaPhoneDigits("+20 101 234 5678")).toBe("201012345678");
    expect(metaPhoneDigits("")).toBeUndefined();
    expect(metaPhoneDigits(null)).toBeUndefined();
  });

  it("reads the request context from headers and cookies", () => {
    const headers = new Headers({
      "x-forwarded-for": "41.1.2.3, 10.0.0.1",
      "user-agent": "Mozilla/5.0",
      host: "dashboard.tallaby.com",
    });
    const cookies = { get: (name: string) => (name === "_fbc" ? { value: "fb.1.1.abc" } : undefined) };
    expect(signupRequestContext(headers, cookies)).toEqual({
      clientIpAddress: "41.1.2.3",
      clientUserAgent: "Mozilla/5.0",
      fbp: null,
      fbc: "fb.1.1.abc",
      eventSourceUrl: "https://dashboard.tallaby.com/",
    });
  });
});

describe("buildSignupCapiEvent", () => {
  it("hashes PII and shares the browser event id and params", () => {
    const event = buildSignupCapiEvent(
      { userId: "u1", email: " Seller@Example.com ", phone: "01012345678", method: "google", context },
      1_700_000_000_000,
    );
    expect(event).toEqual({
      event_name: "CompleteRegistration",
      event_time: 1_700_000_000,
      event_id: "signup_u1",
      event_source_url: "https://tallaby.com/",
      action_source: "website",
      user_data: {
        external_id: [sha256("u1")],
        em: [sha256("seller@example.com")],
        ph: [sha256("201012345678")],
        client_ip_address: "41.1.2.3",
        client_user_agent: "Mozilla/5.0",
        fbp: "fb.1.1700000000000.123",
      },
      custom_data: { content_name: "seller_signup", status: true, method: "google" },
    });
  });

  it("leaves out missing email and phone", () => {
    const event = buildSignupCapiEvent({ userId: "u1", email: null, phone: undefined, method: "email", context });
    expect(event.user_data).not.toHaveProperty("em");
    expect(event.user_data).not.toHaveProperty("ph");
  });
});
