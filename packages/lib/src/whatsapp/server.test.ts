import { afterEach, describe, expect, it, vi } from "vitest";
import { createHash } from "node:crypto";
import { getWhatsAppConfig, getWhatsAppPhoneInfo, listMetaTemplates, sendWhatsAppMessage, type WhatsAppConfig } from "./graph.server";
import { buildWhatsAppSendBody, type ClaimedMessage } from "./dispatch.server";
import { filterWebhookForNumber } from "./webhook.server";
import { normalizeTemplateStatus } from "./templates-sync.server";
import { readWhatsAppTrackingToken, signWhatsAppTrackingToken } from "./tracking.server";
import { verifyQuickReplyPayload } from "./payload.lib";
import { sendErrorOutcome } from "./errors.lib";

const ENV = {
  WHATSAPP_ACCESS_TOKEN: "token-secret",
  WHATSAPP_PHONE_NUMBER_ID: "123456789012",
  WHATSAPP_WABA_ID: "987654321098",
  WHATSAPP_APP_SECRET: "app-secret",
  WHATSAPP_VERIFY_TOKEN: "verify",
  WHATSAPP_PAYLOAD_SECRET: createHash("sha256").update("payload").digest("hex"),
} as NodeJS.ProcessEnv;
const config = getWhatsAppConfig(ENV)!;

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("getWhatsAppConfig", () => {
  it("needs every value", () => {
    expect(config).not.toBeNull();
    expect(config.graphVersion).toBe("v27.0");
    for (const key of Object.keys(ENV)) {
      expect(getWhatsAppConfig({ ...ENV, [key]: "" })).toBeNull();
    }
    expect(getWhatsAppConfig({ ...ENV, WHATSAPP_PAYLOAD_SECRET: "short" })).toBeNull();
    expect(getWhatsAppConfig({ ...ENV, WHATSAPP_PHONE_NUMBER_ID: "abc" })).toBeNull();
    expect(getWhatsAppConfig({ ...ENV, WHATSAPP_GRAPH_VERSION: "latest" })).toBeNull();
    expect(getWhatsAppConfig({})).toBeNull();
  });
});

function mockFetch(impl: (url: string, init: RequestInit) => Promise<Response> | Response) {
  const fn = vi.fn(async (url: string | URL, init?: RequestInit) => impl(String(url), init ?? {}));
  vi.stubGlobal("fetch", fn);
  return fn;
}

const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } });

describe("sendWhatsAppMessage", () => {
  const body = {
    messaging_product: "whatsapp" as const,
    recipient_type: "individual" as const,
    to: "201012345678",
    type: "text" as const,
    text: { body: "hi", preview_url: false as const },
  };

  it("posts to the phone number and returns the wamid", async () => {
    const fn = mockFetch(() => json({ messages: [{ id: "wamid.1" }] }));
    expect(await sendWhatsAppMessage(config, body)).toEqual({ ok: true, wamid: "wamid.1" });
    const [url, init] = fn.mock.calls[0]!;
    expect(String(url)).toBe("https://graph.facebook.com/v27.0/123456789012/messages");
    expect((init!.headers as Record<string, string>).Authorization).toBe("Bearer token-secret");
  });

  it("returns Graph's error code and status", async () => {
    mockFetch(() => json({ error: { code: 131026, message: "Undeliverable", error_data: { details: "x" } } }, 400));
    const result = await sendWhatsAppMessage(config, body);
    expect(result).toMatchObject({ ok: false, error: { code: 131026, httpStatus: 400, network: null, title: "Undeliverable" } });
  });

  it("tells a connection error before sending from a timeout", async () => {
    mockFetch(() => {
      throw Object.assign(new TypeError("fetch failed"), { cause: { code: "ENOTFOUND" } });
    });
    const before = await sendWhatsAppMessage(config, body);
    expect(before.ok).toBe(false);
    if (!before.ok) {
      expect(before.error.network).toBe("before_send");
      expect(sendErrorOutcome(before.error, 1)).toEqual({ status: "queued", delayMs: 60_000 });
    }

    mockFetch(() => {
      throw Object.assign(new Error("aborted"), { name: "AbortError" });
    });
    const after = await sendWhatsAppMessage(config, body);
    if (!after.ok) {
      expect(after.error.network).toBe("after_send");
      expect(sendErrorOutcome(after.error, 1)).toEqual({ status: "unknown" });
    }
  });

  it("treats a 2xx without a message id as unknown", async () => {
    mockFetch(() => json({}));
    const result = await sendWhatsAppMessage(config, body);
    expect(!result.ok && sendErrorOutcome(result.error, 1)).toEqual({ status: "unknown" });
  });
});

describe("listMetaTemplates", () => {
  it("follows cursors", async () => {
    const fn = mockFetch((url) =>
      new URL(url).searchParams.get("after")
        ? json({ data: [{ id: "2", name: "b", language: "en", status: "PENDING" }] })
        : json({ data: [{ id: "1", name: "a", language: "ar", status: "APPROVED", quality_score: { score: "GREEN" } }], paging: { cursors: { after: "c1" }, next: "https://x" } })
    );
    const result = await listMetaTemplates(config);
    expect(fn).toHaveBeenCalledTimes(2);
    expect(result.ok && result.data.map((t) => [t.name, t.status, t.quality])).toEqual([
      ["a", "approved", "GREEN"],
      ["b", "pending", null],
    ]);
  });
});

describe("getWhatsAppPhoneInfo", () => {
  it("reads the number's name, quality and limit", async () => {
    mockFetch(() => json({ verified_name: "Tallaby", quality_rating: "GREEN", messaging_limit_tier: "TIER_1K", name_status: "APPROVED" }));
    const result = await getWhatsAppPhoneInfo(config);
    expect(result.ok && result.data).toMatchObject({ displayName: "Tallaby", qualityRating: "GREEN", messagingLimit: "TIER_1K" });
  });
});

describe("buildWhatsAppSendBody", () => {
  const row: ClaimedMessage = {
    id: "0b6b7f7e-2a8c-4a3f-9f3e-1c2d3e4f5a6b",
    seller_id: "s",
    store_id: "st",
    order_id: "6f1f3b1e-1111-4222-8333-944455556666",
    event: "order_placed",
    to_phone: "201012345678",
    locale: "ar",
    kind: "template",
    template_name: "tallaby_order_placed",
    template_language: "ar",
    payload: { params: { customer_name: "Mona", order_number: "TB-1", store_name: "Rose", total: "EGP 450" } },
    attempts: 1,
  };

  it("signs the quick replies with the message id", () => {
    const body = buildWhatsAppSendBody(row, config);
    expect(body.type).toBe("template");
    expect(body.biz_opaque_callback_data).toBe(row.id);
    const buttons = body.type === "template" ? (body.template.components as { sub_type?: string; parameters: { payload?: string }[] }[]).filter((c) => c.sub_type === "quick_reply") : [];
    expect(buttons.map((b) => verifyQuickReplyPayload(b.parameters[0]!.payload, config.payloadSecret))).toEqual([
      { action: "confirm", messageId: row.id },
      { action: "cancel", messageId: row.id },
    ]);
  });

  it("adds a tracking token that reads back to the order", () => {
    const body = buildWhatsAppSendBody({ ...row, event: "order_shipped", template_name: "tallaby_order_shipped" }, config);
    const url = body.type === "template" ? (body.template.components as { sub_type?: string; parameters: { text?: string }[] }[]).find((c) => c.sub_type === "url") : null;
    expect(readWhatsAppTrackingToken(url!.parameters[0]!.text)).toBe(row.order_id);
  });

  it("builds a text reply in the inbound's context", () => {
    const body = buildWhatsAppSendBody({ ...row, kind: "text", event: "reply", template_name: null, payload: { text: "ok", contextWamid: "wamid.in" } }, config);
    expect(body).toMatchObject({ type: "text", text: { body: "ok" }, context: { message_id: "wamid.in" } });
  });

  it("refuses to build a broken message", () => {
    expect(() => buildWhatsAppSendBody({ ...row, template_name: "nope" }, config)).toThrow();
    expect(() => buildWhatsAppSendBody({ ...row, kind: "text", payload: {} }, config)).toThrow();
  });
});

describe("tracking token", () => {
  it("round-trips and rejects tampering", () => {
    const id = "6f1f3b1e-1111-4222-8333-944455556666";
    const token = signWhatsAppTrackingToken(id);
    expect(readWhatsAppTrackingToken(token)).toBe(id);
    expect(readWhatsAppTrackingToken(`${token}x`)).toBeNull();
    expect(readWhatsAppTrackingToken("abc")).toBeNull();
    expect(readWhatsAppTrackingToken(null)).toBeNull();
  });
});

describe("filterWebhookForNumber", () => {
  const change = (phoneNumberId: string) => ({
    field: "messages",
    value: { metadata: { phone_number_id: phoneNumberId }, contacts: [{ wa_id: "201012345678", user_id: "EG.123" }], messages: [] },
  });

  it("drops other objects and other numbers", () => {
    expect(filterWebhookForNumber({ object: "page", entry: [] }, "1")).toBeNull();
    const out = filterWebhookForNumber(
      { object: "whatsapp_business_account", entry: [{ changes: [change("111111"), change("222222"), { field: "message_template_status_update", value: {} }] }] },
      "111111"
    )!;
    expect(out.otherNumber).toBe(1);
    expect((out.body as { entry: { changes: unknown[] }[] }).entry[0]!.changes).toHaveLength(2);
    expect(out.contacts).toEqual([{ phone: "201012345678", userId: "EG.123" }]);
  });
});

describe("normalizeTemplateStatus", () => {
  it("maps Meta's statuses", () => {
    expect(normalizeTemplateStatus("APPROVED")).toBe("approved");
    expect(normalizeTemplateStatus("IN_APPEAL")).toBe("pending");
    expect(normalizeTemplateStatus(null)).toBe("pending");
  });
});
