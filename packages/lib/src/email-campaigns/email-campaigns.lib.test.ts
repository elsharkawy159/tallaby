import { describe, expect, it } from "vitest";
import type { StoreCustomer } from "../customers/customers.lib";
import {
  buildRecipientList,
  campaignLocale,
  campaignSendError,
  canQueueCampaign,
  cleanBody,
  cleanLine,
  customersForAudience,
  emailCampaignLimits,
  emailUnsubscribeUrl,
  EMAIL_SEND_MAX_ATTEMPTS,
  hasLink,
  isEmailUnsubscribeToken,
  isWinbackEligible,
  parseCampaignAudience,
  parseCampaignInput,
  parseScheduledAt,
  parseWinbackInput,
  parseWinbackSettings,
  selectWinbackCustomers,
  statusAfterFailure,
  WINBACK_DEFAULTS,
} from "./email-campaigns.lib";

const NOW = new Date("2026-10-30T10:00:00Z");
const daysAgo = (n: number) => new Date(NOW.getTime() - n * 86_400_000).toISOString();
const ID = "0f8fad5b-d9cb-469f-a165-70867728950e";

function customer(over: Partial<StoreCustomer>): StoreCustomer {
  return {
    key: "u:x",
    storeId: ID,
    phone: null,
    userId: ID,
    name: "A",
    email: "a@example.com",
    governorate: null,
    city: null,
    orderCount: 1,
    deliveredCount: 1,
    refusedCount: 0,
    cancelledCount: 0,
    totalSpent: "100.00",
    firstOrderAt: daysAgo(200),
    lastOrderAt: daysAgo(120),
    successRate: 100,
    ...over,
  };
}

describe("text cleaning", () => {
  it("cleans lines and bodies", () => {
    expect(cleanLine("  hi \n  there\u0007 ", 50)).toBe("hi there");
    expect(cleanLine(42, 10)).toBe("");
    expect(cleanLine("abcdef", 3)).toBe("abc");
    expect(cleanBody("a\r\nb  \n\n\n\nc")).toBe("a\nb\n\nc");
  });

  it("detects links", () => {
    expect(hasLink("visit https://x.io")).toBe(true);
    expect(hasLink("www.shop")).toBe(true);
    expect(hasLink("go to evil.com now")).toBe(true);
    expect(hasLink("خصم 20% على كل حاجة")).toBe(false);
  });
});

describe("parseCampaignInput", () => {
  it("keeps a clean draft and caps products", () => {
    const ids = [ID, ID.toUpperCase(), "nope", "1b4e28ba-2fa1-11d2-883f-0016d3cca427", "6fa459ea-ee8a-3ca4-894e-db77e160355e", "16fd2706-8baf-433b-82eb-8c7fada847da", "886313e1-3b8a-5372-9b90-0c9aee199e5d"];
    const res = parseCampaignInput({ subject: " Sale ", body: "Hello", ctaLabel: "", productIds: ids, audience: "buyers", inactiveDays: 5 });
    expect(res.ok).toBe(true);
    if (!res.ok) return;
    expect(res.value.subject).toBe("Sale");
    expect(res.value.ctaLabel).toBeNull();
    expect(res.value.productIds).toHaveLength(4);
    expect(new Set(res.value.productIds).size).toBe(4);
    expect(res.value.inactiveDays).toBeNull();
  });

  it("clamps inactive days and defaults the audience", () => {
    const a = parseCampaignInput({ audience: "inactive", inactiveDays: 2 });
    expect(a.ok && a.value.inactiveDays).toBe(7);
    const b = parseCampaignInput({ audience: "everyone" });
    expect(b.ok && b.value.audience).toBe("subscribers");
    expect(parseCampaignAudience("all")).toBe("all");
  });

  it("refuses links", () => {
    expect(parseCampaignInput({ subject: "see http://a.b" })).toEqual({ ok: false, error: "subjectLink" });
    expect(parseCampaignInput({ body: "www.x.com" })).toEqual({ ok: false, error: "bodyLink" });
    expect(parseCampaignInput({ ctaLabel: "bit.ly/x evil.com" })).toEqual({ ok: false, error: "ctaLink" });
  });

  it("campaignSendError needs subject and body", () => {
    expect(campaignSendError({ subject: "", body: "x", ctaLabel: null })).toBe("subjectRequired");
    expect(campaignSendError({ subject: "x", body: " ", ctaLabel: null })).toBe("bodyRequired");
    expect(campaignSendError({ subject: "x", body: "y", ctaLabel: null })).toBeNull();
  });
});

describe("audiences and recipients", () => {
  const list = [
    customer({ key: "1", deliveredCount: 0, lastOrderAt: daysAgo(10) }),
    customer({ key: "2", deliveredCount: 2, lastOrderAt: daysAgo(100) }),
    customer({ key: "3", deliveredCount: 1, lastOrderAt: daysAgo(30) }),
  ];

  it("filters customers per audience", () => {
    expect(customersForAudience(list, "all", { now: NOW })).toHaveLength(3);
    expect(customersForAudience(list, "buyers", { now: NOW }).map((c) => c.key)).toEqual(["2", "3"]);
    expect(customersForAudience(list, "inactive", { now: NOW, inactiveDays: 60 }).map((c) => c.key)).toEqual(["2"]);
  });

  it("builds a de-duplicated, capped list without unsubscribed or placeholder emails", () => {
    const res = buildRecipientList(
      ["A@Example.com", "a@example.com", null, "bad", "guest@temp.local", "b@example.com", "c@example.com", "d@example.com"],
      { unsubscribed: new Set(["b@example.com"]), max: 2 },
    );
    expect(res.emails).toEqual(["a@example.com", "c@example.com"]);
    expect(res.unsubscribed).toBe(1);
    expect(res.noEmail).toBe(3);
    expect(res.overCap).toBe(1);
  });
});

describe("limits", () => {
  it("caps campaigns per day and retries", () => {
    const limits = emailCampaignLimits("free");
    expect(emailCampaignLimits("unknown-plan")).toEqual(limits);
    expect(canQueueCampaign(0, limits)).toBe(true);
    expect(canQueueCampaign(limits.campaignsPerDay, limits)).toBe(false);
    expect(statusAfterFailure(1)).toBe("pending");
    expect(statusAfterFailure(EMAIL_SEND_MAX_ATTEMPTS)).toBe("failed");
    expect(campaignLocale("en")).toBe("en");
    expect(campaignLocale("fr")).toBe("ar");
  });

  it("parses the schedule", () => {
    expect(parseScheduledAt(null, NOW)).toBeNull();
    expect(parseScheduledAt("", NOW)).toBeNull();
    expect(parseScheduledAt("nope", NOW)).toBe("invalid");
    expect(parseScheduledAt(new Date(NOW.getTime() + 60_000).toISOString(), NOW)).toBe("invalid");
    expect(parseScheduledAt(new Date(NOW.getTime() + 40 * 86_400_000).toISOString(), NOW)).toBe("invalid");
    const ok = parseScheduledAt(new Date(NOW.getTime() + 86_400_000).toISOString(), NOW);
    expect(ok).toBeInstanceOf(Date);
  });
});

describe("win-back", () => {
  it("parses settings and input", () => {
    expect(parseWinbackSettings(null)).toEqual(WINBACK_DEFAULTS);
    expect(parseWinbackSettings({ winback: { enabled: true, days: 5, subject: "x.com", body: "Hi" } })).toEqual({
      enabled: true,
      days: 30,
      subject: "",
      body: "Hi",
    });
    expect(parseWinbackInput({ enabled: true, days: 1000, subject: "Hi", body: "" })).toEqual({
      ok: true,
      value: { enabled: true, days: 365, subject: "Hi", body: "" },
    });
    expect(parseWinbackInput({ body: "https://x" })).toEqual({ ok: false, error: "bodyLink" });
  });

  it("picks eligible customers once, within the window, skipping unsubscribed and blocked", () => {
    expect(isWinbackEligible(customer({ lastOrderAt: daysAgo(120) }), { now: NOW, days: 90 })).toBe(true);
    expect(isWinbackEligible(customer({ lastOrderAt: daysAgo(30) }), { now: NOW, days: 90 })).toBe(false);
    expect(isWinbackEligible(customer({ lastOrderAt: daysAgo(400) }), { now: NOW, days: 90 })).toBe(false);
    expect(isWinbackEligible(customer({ deliveredCount: 0 }), { now: NOW, days: 90 })).toBe(false);
    expect(isWinbackEligible(customer({ email: "g@temp.local" }), { now: NOW, days: 90 })).toBe(false);

    const picked = selectWinbackCustomers(
      [
        customer({ email: "a@example.com" }),
        customer({ email: "A@example.com" }),
        customer({ email: "u@example.com" }),
        customer({ email: "p@example.com", phone: "01000000000" }),
        customer({ email: "b@example.com" }),
        customer({ email: "c@example.com" }),
      ],
      { now: NOW, days: 90, unsubscribed: new Set(["u@example.com"]), blockedPhones: new Set(["01000000000"]), max: 2 },
    );
    expect(picked.map((p) => p.email)).toEqual(["a@example.com", "b@example.com"]);
  });
});

describe("unsubscribe", () => {
  it("validates tokens and builds the store link", () => {
    expect(isEmailUnsubscribeToken("ab".repeat(16))).toBe(true);
    expect(isEmailUnsubscribeToken("xyz")).toBe(false);
    expect(emailUnsubscribeUrl("https://s.tallaby.com/", "ab".repeat(16))).toBe(
      `https://s.tallaby.com/api/email/unsubscribe?token=${"ab".repeat(16)}`,
    );
  });
});
