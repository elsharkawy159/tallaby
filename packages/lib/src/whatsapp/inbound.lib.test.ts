import { describe, expect, it } from "vitest";
import { detectOptOut, INBOUND_BODY_MAX, metaCostMicros, parseWhatsAppWebhook } from "./inbound.lib";

const RATES = { utility: 3600, authentication: 3600, marketing: 64400, service: 3600 };

function body(field: string, value: unknown) {
  return { object: "whatsapp_business_account", entry: [{ id: "WABA", changes: [{ field, value }] }] };
}

describe("parseWhatsAppWebhook", () => {
  it("parses status updates with pricing and errors", () => {
    const parsed = parseWhatsAppWebhook(
      body("messages", {
        messaging_product: "whatsapp",
        metadata: { phone_number_id: "1" },
        statuses: [
          {
            id: "wamid.A",
            status: "delivered",
            timestamp: "1764000000",
            recipient_id: "201012345678",
            biz_opaque_callback_data: "0b9c6f1e-2d3a-4b5c-8d7e-9f0a1b2c3d4e",
            pricing: { billable: true, pricing_model: "PMP", category: "UTILITY", type: "regular" },
          },
          { id: "wamid.B", status: "failed", timestamp: 1764000001, recipient_id: "201012345678", errors: [{ code: 131026, title: "Message undeliverable", error_data: { details: "x" } }] },
          { id: "wamid.C", status: "deleted" },
          { status: "sent" },
        ],
      })
    );
    expect(parsed?.statuses).toEqual([
      {
        wamid: "wamid.A",
        status: "delivered",
        at: new Date(1764000000 * 1000),
        recipientPhone: "201012345678",
        recipientUserId: null,
        callbackData: "0b9c6f1e-2d3a-4b5c-8d7e-9f0a1b2c3d4e",
        pricing: { billable: true, category: "utility", type: "regular", model: "PMP" },
        error: null,
      },
      {
        wamid: "wamid.B",
        status: "failed",
        at: new Date(1764000001 * 1000),
        recipientPhone: "201012345678",
        recipientUserId: null,
        callbackData: null,
        pricing: null,
        error: { code: 131026, title: "Message undeliverable", detail: "x" },
      },
    ]);
  });

  it("parses a template button tap with its context and profile", () => {
    const parsed = parseWhatsAppWebhook(
      body("messages", {
        contacts: [{ wa_id: "201012345678", profile: { name: "Mona" } }],
        messages: [
          {
            from: "201012345678",
            id: "wamid.IN1",
            timestamp: "1764000002",
            type: "button",
            context: { from: "20100000000", id: "wamid.OUT1" },
            button: { payload: "TB1.c.x.y", text: "تأكيد الطلب" },
          },
        ],
      })
    );
    expect(parsed?.messages).toEqual([
      {
        wamid: "wamid.IN1",
        fromPhone: "201012345678",
        waUserId: null,
        type: "button",
        at: new Date(1764000002 * 1000),
        contextWamid: "wamid.OUT1",
        text: null,
        button: { payload: "TB1.c.x.y", text: "تأكيد الطلب" },
        profileName: "Mona",
      },
    ]);
  });

  it("accepts a BSUID-only sender, caps text, and drops a sender-less message", () => {
    const long = "a".repeat(5000).slice(0, 4000);
    const parsed = parseWhatsAppWebhook(
      body("messages", {
        messages: [
          { from_user_id: "EG.123abc", id: "wamid.IN2", type: "text", text: { body: long } },
          { id: "wamid.IN3", type: "text", text: { body: "hi" } },
          { from: "junk", id: "wamid.IN4", type: "text", text: { body: "hi" } },
        ],
      })
    );
    expect(parsed?.messages).toHaveLength(1);
    expect(parsed?.messages[0]).toMatchObject({ wamid: "wamid.IN2", fromPhone: null, waUserId: "EG.123abc", type: "text" });
    expect(parsed?.messages[0]?.text).toHaveLength(INBOUND_BODY_MAX);
  });

  it("parses template status updates", () => {
    const parsed = parseWhatsAppWebhook(
      body("message_template_status_update", {
        event: "REJECTED",
        message_template_id: 123456,
        message_template_name: "tallaby_order_placed",
        message_template_language: "ar",
        reason: "INVALID_FORMAT",
      })
    );
    expect(parsed?.templateUpdates).toEqual([
      { metaTemplateId: "123456", name: "tallaby_order_placed", language: "ar", status: "rejected", reason: "INVALID_FORMAT" },
    ]);
    expect(parseWhatsAppWebhook(body("message_template_status_update", { event: "FLAGGED", message_template_name: "x", message_template_language: "ar" }))?.templateUpdates).toEqual([]);
  });

  it("keeps good changes when another is malformed, and rejects non-webhooks", () => {
    const parsed = parseWhatsAppWebhook({
      object: "whatsapp_business_account",
      entry: [{ changes: [{ field: "messages", value: "garbage" }, { field: "messages", value: { statuses: [{ id: "w", status: "read" }] } }] }],
    });
    expect(parsed?.statuses.map((s) => s.wamid)).toEqual(["w"]);
    expect(parseWhatsAppWebhook(null)).toBeNull();
    expect(parseWhatsAppWebhook({ entry: "x" })).toBeNull();
    expect(parseWhatsAppWebhook({ object: "page", entry: [] })).toBeNull();
  });
});

describe("detectOptOut", () => {
  it.each(["STOP", "stop", " Stop ", "إيقاف", "ايقاف", "الغاء الاشتراك", "إلغاء الاشتراك", "إلغاء  الاشتراك", "UNSUBSCRIBE", "unsubscribe"])("opts out on %j", (text) => {
    expect(detectOptOut(text)).toBe(true);
  });

  it.each([null, "", "stop please", "please stop", "إلغاء الطلب", "stopp", "لا", "إيقاف الطلب"])("does not opt out on %j", (text) => {
    expect(detectOptOut(text)).toBe(false);
  });
});

describe("metaCostMicros", () => {
  it("costs a paid message by category", () => {
    expect(metaCostMicros({ billable: true, category: "utility", type: "regular", model: "PMP" }, RATES)).toBe(3600);
    expect(metaCostMicros({ billable: true, category: "marketing", type: null, model: null }, RATES)).toBe(64400);
  });

  it("is null for free or unknown pricing", () => {
    expect(metaCostMicros({ billable: false, category: "service", type: "free_customer_service", model: "PMP" }, RATES)).toBeNull();
    expect(metaCostMicros({ billable: false, category: "utility", type: null, model: null }, RATES)).toBeNull();
    expect(metaCostMicros({ billable: true, category: "other", type: "regular", model: null }, RATES)).toBeNull();
    expect(metaCostMicros(null, RATES)).toBeNull();
  });
});
