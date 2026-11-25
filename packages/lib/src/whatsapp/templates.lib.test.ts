import { describe, expect, it } from "vitest";
import { WHATSAPP_EVENTS, WHATSAPP_LOCALES } from "./events.lib";
import {
  META_LIMITS,
  PARAM_MAX_LENGTH,
  TEMPLATE_PARAMS,
  WHATSAPP_FOOTER,
  WHATSAPP_TEMPLATES,
  WHATSAPP_TEMPLATE_LIST,
  buildTemplateSendComponents,
  getWhatsAppTemplate,
  renderTemplatePreview,
  sanitizeTemplateParam,
  templateButtonLabels,
  templateForEvent,
  toMetaTemplateDefinition,
  type TemplateParams,
} from "./templates.lib";

const PARAMS: TemplateParams = {
  customer_name: "Mona",
  store_name: "Rose Shop",
  order_number: "TB-1",
  total: "EGP 450",
  carrier: "Bosta",
  tracking_number: "123",
};

const LONGEST = Object.fromEntries(TEMPLATE_PARAMS.map((p) => [p, "x".repeat(500)])) as TemplateParams;

describe("WhatsApp templates", () => {
  it("has the seven code templates, all utility", () => {
    expect(Object.keys(WHATSAPP_TEMPLATES).sort()).toEqual([
      "tallaby_order_cancelled",
      "tallaby_order_confirmed",
      "tallaby_order_delivered",
      "tallaby_order_out_for_delivery",
      "tallaby_order_placed",
      "tallaby_order_received",
      "tallaby_order_shipped",
    ]);
    for (const t of WHATSAPP_TEMPLATE_LIST) expect(t.category).toBe("UTILITY");
  });

  it.each(WHATSAPP_TEMPLATE_LIST.flatMap((t) => WHATSAPP_LOCALES.map((l) => [t.name, l] as const)))(
    "%s (%s) respects Meta's rules",
    (name, locale) => {
      const t = getWhatsAppTemplate(name)!;
      const copy = t.copy[locale];
      expect(t.name).toMatch(/^[a-z0-9_]+$/);
      expect(t.name.length).toBeLessThanOrEqual(META_LIMITS.name);
      expect(copy.body.length).toBeLessThanOrEqual(META_LIMITS.body);
      // Exactly the declared parameters, in order, each once.
      const used = [...copy.body.matchAll(/\{\{([a-z_]+)\}\}/g)].map((m) => m[1]);
      expect(used).toEqual([...t.params]);
      // Meta rejects a body that starts or ends with a parameter.
      expect(copy.body.trimStart().startsWith("{{")).toBe(false);
      expect(copy.body.trimEnd().endsWith("}}")).toBe(false);
      // Names the store as the seller and Tallaby as the platform.
      expect(copy.body).toContain(locale === "ar" ? "على طلبي" : "on Tallaby");
      // The longest values still fit.
      const rendered = renderTemplatePreview(t, locale, LONGEST).split(`\n\n${WHATSAPP_FOOTER}`)[0]!;
      expect(rendered.length).toBeLessThanOrEqual(META_LIMITS.body);
      for (const label of templateButtonLabels(t, locale)) {
        expect(label.length).toBeLessThanOrEqual(t.buttons === "track" ? META_LIMITS.urlButton : META_LIMITS.quickReply);
      }
    }
  );

  it("keeps the footer within Meta's limit", () => {
    expect(WHATSAPP_FOOTER.length).toBeLessThanOrEqual(META_LIMITS.footer);
  });

  it("has no promotional wording", () => {
    for (const t of WHATSAPP_TEMPLATE_LIST) {
      for (const locale of WHATSAPP_LOCALES) {
        expect(t.copy[locale].body).not.toMatch(/coupon|discount|offer|sale|shop again|خصم|كوبون|عرض|تخفيض/i);
      }
    }
  });

  it("picks the template for each event", () => {
    expect(templateForEvent("order_placed", "pending").name).toBe("tallaby_order_placed");
    expect(templateForEvent("order_placed", "confirmed").name).toBe("tallaby_order_received");
    expect(templateForEvent("order_placed", null).name).toBe("tallaby_order_received");
    for (const event of WHATSAPP_EVENTS.filter((e) => e !== "order_placed")) {
      expect(templateForEvent(event, "pending").name).toBe(`tallaby_${event}`);
    }
    expect(getWhatsAppTemplate("toString")).toBeNull();
    expect(getWhatsAppTemplate("nope")).toBeNull();
  });
});

describe("sanitizeTemplateParam", () => {
  it("makes one line, never empty, capped", () => {
    expect(sanitizeTemplateParam("customer_name", "  Mona\n\tAli     Hassan ")).toBe("Mona Ali Hassan");
    expect(sanitizeTemplateParam("customer_name", "")).toBe("-");
    expect(sanitizeTemplateParam("tracking_number", null)).toBe("-");
    const long = sanitizeTemplateParam("store_name", "y".repeat(200));
    expect(long.length).toBe(PARAM_MAX_LENGTH.store_name);
    expect(long.endsWith("…")).toBe(true);
  });
});

describe("renderTemplatePreview", () => {
  it("fills the parameters and adds the footer and buttons", () => {
    const text = renderTemplatePreview(WHATSAPP_TEMPLATES.tallaby_order_placed, "ar", PARAMS);
    expect(text).toContain("مرحبًا Mona،");
    expect(text).toContain("رقم TB-1 من متجر Rose Shop على طلبي");
    expect(text).toContain(WHATSAPP_FOOTER);
    expect(text).toContain("[ تأكيد الطلب ]");
    expect(text).toContain("[ إلغاء الطلب ]");
    expect(text).not.toContain("{{");
  });

  it("does not interpret replacement patterns in values", () => {
    const text = renderTemplatePreview(WHATSAPP_TEMPLATES.tallaby_order_received, "en", { ...PARAMS, customer_name: "$& {{total}}" });
    expect(text).toContain("Hi $& {{total}},");
  });
});

describe("buildTemplateSendComponents", () => {
  it("sends every named body parameter", () => {
    const components = buildTemplateSendComponents({ template: WHATSAPP_TEMPLATES.tallaby_order_delivered, params: PARAMS });
    expect(components).toEqual([
      {
        type: "body",
        parameters: [
          { type: "text", parameter_name: "customer_name", text: "Mona" },
          { type: "text", parameter_name: "order_number", text: "TB-1" },
          { type: "text", parameter_name: "store_name", text: "Rose Shop" },
          { type: "text", parameter_name: "total", text: "EGP 450" },
        ],
      },
    ]);
  });

  it("adds quick-reply payloads for the placed template", () => {
    const components = buildTemplateSendComponents({
      template: WHATSAPP_TEMPLATES.tallaby_order_placed,
      params: PARAMS,
      quickReplyPayloads: { confirm: "TB1.c.a", cancel: "TB1.x.a" },
    });
    expect(components.slice(1)).toEqual([
      { type: "button", sub_type: "quick_reply", index: "0", parameters: [{ type: "payload", payload: "TB1.c.a" }] },
      { type: "button", sub_type: "quick_reply", index: "1", parameters: [{ type: "payload", payload: "TB1.x.a" }] },
    ]);
    expect(() => buildTemplateSendComponents({ template: WHATSAPP_TEMPLATES.tallaby_order_placed, params: PARAMS })).toThrow();
  });

  it("adds the tracking token for shipped and out for delivery", () => {
    const shipped = buildTemplateSendComponents({ template: WHATSAPP_TEMPLATES.tallaby_order_shipped, params: PARAMS, trackingToken: "abc.DEF-1" });
    expect(shipped[0]).toMatchObject({ type: "body" });
    expect((shipped[0] as { parameters: unknown[] }).parameters).toHaveLength(6);
    expect(shipped[1]).toEqual({ type: "button", sub_type: "url", index: "0", parameters: [{ type: "text", text: "abc.DEF-1" }] });
    expect(() => buildTemplateSendComponents({ template: WHATSAPP_TEMPLATES.tallaby_order_out_for_delivery, params: PARAMS })).toThrow();
    expect(() =>
      buildTemplateSendComponents({ template: WHATSAPP_TEMPLATES.tallaby_order_shipped, params: PARAMS, trackingToken: "a/b?c" })
    ).toThrow();
  });
});

describe("toMetaTemplateDefinition", () => {
  it("builds a named utility template with examples and quick replies", () => {
    const def = toMetaTemplateDefinition(WHATSAPP_TEMPLATES.tallaby_order_placed, "en");
    expect(def).toMatchObject({ name: "tallaby_order_placed", language: "en", category: "UTILITY", parameter_format: "NAMED" });
    expect(def.components[0]).toMatchObject({
      type: "BODY",
      example: {
        body_text_named_params: [
          { param_name: "customer_name", example: "Mona" },
          { param_name: "order_number", example: "TB-10234" },
          { param_name: "store_name", example: "Rose Shop" },
          { param_name: "total", example: "EGP 450" },
        ],
      },
    });
    expect(def.components[1]).toEqual({ type: "FOOTER", text: WHATSAPP_FOOTER });
    expect(def.components[2]).toEqual({
      type: "BUTTONS",
      buttons: [
        { type: "QUICK_REPLY", text: "Confirm order" },
        { type: "QUICK_REPLY", text: "Cancel order" },
      ],
    });
  });

  it("builds the URL button with a dynamic suffix", () => {
    const def = toMetaTemplateDefinition(WHATSAPP_TEMPLATES.tallaby_order_shipped, "ar");
    expect(def.components[2]).toEqual({
      type: "BUTTONS",
      buttons: [{ type: "URL", text: "تتبع الطلب", url: "https://tallaby.com/wa/t/{{1}}", example: ["https://tallaby.com/wa/t/sample-token"] }],
    });
  });

  it("has no buttons component for a plain template", () => {
    expect(toMetaTemplateDefinition(WHATSAPP_TEMPLATES.tallaby_order_cancelled, "ar").components).toHaveLength(2);
  });
});
