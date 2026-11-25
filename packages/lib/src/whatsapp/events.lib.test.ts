import { describe, expect, it } from "vitest";
import {
  WHATSAPP_EVENTS,
  WHATSAPP_MESSAGE_STATUSES,
  canAdvanceStatus,
  isWhatsAppEvent,
  isWhatsAppLocale,
  orderEventDedupeKey,
  replyDedupeKey,
} from "./events.lib";

describe("WhatsApp events", () => {
  it("lists the six order events", () => {
    expect(WHATSAPP_EVENTS).toEqual([
      "order_placed",
      "order_confirmed",
      "order_shipped",
      "order_out_for_delivery",
      "order_delivered",
      "order_cancelled",
    ]);
    expect(isWhatsAppEvent("order_shipped")).toBe(true);
    expect(isWhatsAppEvent("reply")).toBe(false);
    expect(isWhatsAppEvent(null)).toBe(false);
    expect(isWhatsAppLocale("ar")).toBe(true);
    expect(isWhatsAppLocale("fr")).toBe(false);
  });

  it("builds dedupe keys", () => {
    expect(orderEventDedupeKey("o1", "order_placed")).toBe("order:o1:order_placed");
    expect(replyDedupeKey("wamid.X")).toBe("reply:wamid.X");
  });
});

describe("canAdvanceStatus", () => {
  it("moves forward through sent, delivered, read", () => {
    expect(canAdvanceStatus("sending", "sent")).toBe(true);
    expect(canAdvanceStatus("sent", "delivered")).toBe(true);
    expect(canAdvanceStatus("delivered", "read")).toBe(true);
    expect(canAdvanceStatus("sent", "read")).toBe(true);
    expect(canAdvanceStatus("queued", "delivered")).toBe(true);
  });

  it("ignores out-of-order and repeated statuses", () => {
    expect(canAdvanceStatus("read", "delivered")).toBe(false);
    expect(canAdvanceStatus("delivered", "sent")).toBe(false);
    expect(canAdvanceStatus("read", "sent")).toBe(false);
    expect(canAdvanceStatus("sent", "sent")).toBe(false);
    expect(canAdvanceStatus("read", "read")).toBe(false);
  });

  it("accepts failed only before delivery, and keeps failed final", () => {
    expect(canAdvanceStatus("sent", "failed")).toBe(true);
    expect(canAdvanceStatus("sending", "failed")).toBe(true);
    expect(canAdvanceStatus("delivered", "failed")).toBe(false);
    expect(canAdvanceStatus("read", "failed")).toBe(false);
    expect(canAdvanceStatus("failed", "delivered")).toBe(false);
    expect(canAdvanceStatus("failed", "failed")).toBe(false);
  });

  it("lets Meta settle an unknown message, never touches skipped", () => {
    expect(canAdvanceStatus("unknown", "sent")).toBe(true);
    expect(canAdvanceStatus("unknown", "failed")).toBe(true);
    expect(canAdvanceStatus("skipped", "sent")).toBe(false);
  });

  it("never moves to a non-webhook status", () => {
    for (const from of WHATSAPP_MESSAGE_STATUSES) {
      for (const to of ["queued", "sending", "skipped", "unknown"] as const) {
        expect(canAdvanceStatus(from, to)).toBe(false);
      }
    }
  });
});
