import { describe, expect, it } from "vitest";
import { WHATSAPP_EVENTS } from "@workspace/lib/whatsapp/events";
import { whatsAppEventPreview } from "./whatsapp-preview.lib";

describe("whatsAppEventPreview", () => {
  it("names the store in both languages for every event", () => {
    for (const event of WHATSAPP_EVENTS) {
      expect(whatsAppEventPreview(event, "ar", "متجر سارة"), event).toContain("متجر سارة");
      expect(whatsAppEventPreview(event, "en", "Sara Shop"), event).toContain("Sara Shop");
    }
  });

  it("shows the confirm and cancel buttons on the order received message", () => {
    expect(whatsAppEventPreview("order_placed", "en", "Sara Shop")).toContain("[ Confirm order ]");
    expect(whatsAppEventPreview("order_placed", "ar", "متجر سارة")).toContain("[ إلغاء الطلب ]");
  });

  it("falls back to the sample store name when the store has none", () => {
    expect(whatsAppEventPreview("order_delivered", "en", "  ")).toContain("Rose Shop");
  });
});
