/**
 * Tallaby's WhatsApp message templates (ROADMAP.md F-109, docs/whatsapp.md
 * D2 and §2). Pure, safe on the client (the dashboard renders previews).
 *
 * The templates are Tallaby's, in code: utility category, Arabic and English,
 * NAMED body parameters, footer `Tallaby · طلبي`. Sellers choose events, never
 * text. Every message names the store as the seller and Tallaby (طلبي) as the
 * platform. No promotional text, so the templates stay utility.
 *
 * An approved template's text can't be changed freely: when the copy changes,
 * add a new template with a `_v2` name instead of editing one in place.
 */
import type { WhatsAppEvent, WhatsAppLocale } from "./events.lib";

/** Meta's template limits (Cloud API, message templates). */
export const META_LIMITS = {
  name: 512,
  body: 1024,
  footer: 60,
  quickReply: 25,
  urlButton: 25,
  /** A body parameter value; Meta also rejects newlines, tabs and 5+ spaces in one. */
  param: 1024,
} as const;

export const WHATSAPP_FOOTER = "Tallaby · طلبي";

/** Where a tracking button points; `{{1}}` is the signed order token (docs/whatsapp.md §4). */
export const WHATSAPP_TRACKING_URL = "https://tallaby.com/wa/t/{{1}}";
const TRACKING_URL_BASE = "https://tallaby.com/wa/t/";

export const TEMPLATE_PARAMS = [
  "customer_name",
  "store_name",
  "order_number",
  "total",
  "carrier",
  "tracking_number",
] as const;

export type TemplateParam = (typeof TEMPLATE_PARAMS)[number];
export type TemplateParams = Partial<Record<TemplateParam, string | null | undefined>>;

/** The longest value each parameter is sent with (keeps every rendered body under 1024). */
export const PARAM_MAX_LENGTH: Readonly<Record<TemplateParam, number>> = {
  customer_name: 60,
  store_name: 60,
  order_number: 30,
  total: 30,
  carrier: 40,
  tracking_number: 60,
};

export type TemplateButtons = "none" | "confirm_cancel" | "track";

export interface TemplateCopy {
  body: string;
  /** Quick replies in index order: [confirm, cancel]. */
  quickReplies?: readonly [string, string];
  /** The URL button's label. */
  urlButton?: string;
}

export interface WhatsAppTemplate {
  name: string;
  category: "UTILITY";
  /** The named body parameters, in the order they appear in the body. */
  params: readonly TemplateParam[];
  buttons: TemplateButtons;
  copy: Readonly<Record<WhatsAppLocale, TemplateCopy>>;
}

const ORDER_PARAMS = ["customer_name", "order_number", "store_name", "total"] as const;
const SHIPPED_PARAMS = ["customer_name", "order_number", "store_name", "carrier", "tracking_number", "total"] as const;

const CONFIRM_CANCEL_AR = ["تأكيد الطلب", "إلغاء الطلب"] as const;
const CONFIRM_CANCEL_EN = ["Confirm order", "Cancel order"] as const;

export const WHATSAPP_TEMPLATES = {
  tallaby_order_placed: {
    name: "tallaby_order_placed",
    category: "UTILITY",
    params: ORDER_PARAMS,
    buttons: "confirm_cancel",
    copy: {
      ar: {
        body:
          "مرحبًا {{customer_name}}،\n" +
          "تم استلام طلبك رقم {{order_number}} من متجر {{store_name}} على طلبي.\n" +
          "الإجمالي: {{total}}\n\n" +
          "اضغط «تأكيد الطلب» ليبدأ المتجر في تجهيزه، أو «إلغاء الطلب» إذا لم تعد تريده.",
        quickReplies: CONFIRM_CANCEL_AR,
      },
      en: {
        body:
          "Hi {{customer_name}},\n" +
          "Your order {{order_number}} from {{store_name}} on Tallaby has been received.\n" +
          "Total: {{total}}\n\n" +
          "Tap Confirm order so the store can start preparing it, or Cancel order if you no longer want it.",
        quickReplies: CONFIRM_CANCEL_EN,
      },
    },
  },
  tallaby_order_received: {
    name: "tallaby_order_received",
    category: "UTILITY",
    params: ORDER_PARAMS,
    buttons: "none",
    copy: {
      ar: {
        body:
          "مرحبًا {{customer_name}}،\n" +
          "تم استلام طلبك رقم {{order_number}} من متجر {{store_name}} على طلبي.\n" +
          "الإجمالي: {{total}}\n\n" +
          "سنرسل لك هنا كل تحديث على طلبك.",
      },
      en: {
        body:
          "Hi {{customer_name}},\n" +
          "Your order {{order_number}} from {{store_name}} on Tallaby has been received.\n" +
          "Total: {{total}}\n\n" +
          "We will send every update on your order here.",
      },
    },
  },
  tallaby_order_confirmed: {
    name: "tallaby_order_confirmed",
    category: "UTILITY",
    params: ORDER_PARAMS,
    buttons: "none",
    copy: {
      ar: {
        body:
          "مرحبًا {{customer_name}}،\n" +
          "تم تأكيد طلبك رقم {{order_number}} من متجر {{store_name}} على طلبي، والمتجر يجهزه الآن.\n" +
          "الإجمالي: {{total}}\n\n" +
          "سنرسل لك رسالة عند شحن الطلب.",
      },
      en: {
        body:
          "Hi {{customer_name}},\n" +
          "Your order {{order_number}} from {{store_name}} on Tallaby is confirmed, and the store is preparing it now.\n" +
          "Total: {{total}}\n\n" +
          "We will message you when it ships.",
      },
    },
  },
  tallaby_order_shipped: {
    name: "tallaby_order_shipped",
    category: "UTILITY",
    params: SHIPPED_PARAMS,
    buttons: "track",
    copy: {
      ar: {
        body:
          "مرحبًا {{customer_name}}،\n" +
          "تم شحن طلبك رقم {{order_number}} من متجر {{store_name}} على طلبي.\n" +
          "شركة الشحن: {{carrier}}\n" +
          "رقم الشحنة: {{tracking_number}}\n" +
          "الإجمالي: {{total}}\n\n" +
          "يمكنك متابعة الشحنة من الزر بالأسفل.",
        urlButton: "تتبع الطلب",
      },
      en: {
        body:
          "Hi {{customer_name}},\n" +
          "Your order {{order_number}} from {{store_name}} on Tallaby has shipped.\n" +
          "Carrier: {{carrier}}\n" +
          "Tracking number: {{tracking_number}}\n" +
          "Total: {{total}}\n\n" +
          "You can follow the shipment with the button below.",
        urlButton: "Track order",
      },
    },
  },
  tallaby_order_out_for_delivery: {
    name: "tallaby_order_out_for_delivery",
    category: "UTILITY",
    params: ORDER_PARAMS,
    buttons: "track",
    copy: {
      ar: {
        body:
          "مرحبًا {{customer_name}}،\n" +
          "طلبك رقم {{order_number}} من متجر {{store_name}} على طلبي خرج مع المندوب للتوصيل.\n" +
          "الإجمالي: {{total}}\n\n" +
          "من فضلك أبقِ هاتفك متاحًا لاستلام الطلب.",
        urlButton: "تتبع الطلب",
      },
      en: {
        body:
          "Hi {{customer_name}},\n" +
          "Your order {{order_number}} from {{store_name}} on Tallaby is out for delivery.\n" +
          "Total: {{total}}\n\n" +
          "Please keep your phone nearby to receive it.",
        urlButton: "Track order",
      },
    },
  },
  tallaby_order_delivered: {
    name: "tallaby_order_delivered",
    category: "UTILITY",
    params: ORDER_PARAMS,
    buttons: "none",
    copy: {
      ar: {
        body:
          "مرحبًا {{customer_name}}،\n" +
          "تم توصيل طلبك رقم {{order_number}} من متجر {{store_name}} على طلبي.\n" +
          "الإجمالي: {{total}}\n\n" +
          "إذا كان لديك سؤال عن الطلب، تواصل مع المتجر مباشرة.",
      },
      en: {
        body:
          "Hi {{customer_name}},\n" +
          "Your order {{order_number}} from {{store_name}} on Tallaby has been delivered.\n" +
          "Total: {{total}}\n\n" +
          "If you have a question about the order, please contact the store.",
      },
    },
  },
  tallaby_order_cancelled: {
    name: "tallaby_order_cancelled",
    category: "UTILITY",
    params: ORDER_PARAMS,
    buttons: "none",
    copy: {
      ar: {
        body:
          "مرحبًا {{customer_name}}،\n" +
          "تم إلغاء طلبك رقم {{order_number}} من متجر {{store_name}} على طلبي.\n" +
          "الإجمالي: {{total}}\n\n" +
          "إذا كان لديك سؤال عن الإلغاء، تواصل مع المتجر مباشرة.",
      },
      en: {
        body:
          "Hi {{customer_name}},\n" +
          "Your order {{order_number}} from {{store_name}} on Tallaby has been cancelled.\n" +
          "Total: {{total}}\n\n" +
          "If you have a question about the cancellation, please contact the store.",
      },
    },
  },
} as const satisfies Record<string, WhatsAppTemplate>;

export type WhatsAppTemplateName = keyof typeof WHATSAPP_TEMPLATES;

export const WHATSAPP_TEMPLATE_LIST: readonly WhatsAppTemplate[] = Object.values(WHATSAPP_TEMPLATES);

export function getWhatsAppTemplate(name: string): WhatsAppTemplate | null {
  return Object.prototype.hasOwnProperty.call(WHATSAPP_TEMPLATES, name)
    ? WHATSAPP_TEMPLATES[name as WhatsAppTemplateName]
    : null;
}

/**
 * The template for an order event. `order_placed` asks the shopper to confirm
 * only while the order is `pending`; otherwise (already confirmed, paid
 * online) it is a plain receipt.
 */
export function templateForEvent(event: WhatsAppEvent, orderStatus: string | null | undefined): WhatsAppTemplate {
  switch (event) {
    case "order_placed":
      return orderStatus === "pending" ? WHATSAPP_TEMPLATES.tallaby_order_placed : WHATSAPP_TEMPLATES.tallaby_order_received;
    case "order_confirmed":
      return WHATSAPP_TEMPLATES.tallaby_order_confirmed;
    case "order_shipped":
      return WHATSAPP_TEMPLATES.tallaby_order_shipped;
    case "order_out_for_delivery":
      return WHATSAPP_TEMPLATES.tallaby_order_out_for_delivery;
    case "order_delivered":
      return WHATSAPP_TEMPLATES.tallaby_order_delivered;
    case "order_cancelled":
      return WHATSAPP_TEMPLATES.tallaby_order_cancelled;
  }
}

/**
 * A parameter value as Meta accepts it: one line, single spaces, capped, never
 * empty (an empty parameter is rejected, so a missing value is sent as `-`).
 */
export function sanitizeTemplateParam(param: TemplateParam, value: string | null | undefined): string {
  const clean = (value ?? "").replace(/\s+/g, " ").trim();
  if (!clean) return "-";
  const max = PARAM_MAX_LENGTH[param];
  return clean.length > max ? `${clean.slice(0, max - 1).trimEnd()}…` : clean;
}

function fillBody(body: string, params: TemplateParams, only: readonly TemplateParam[]): string {
  return body.replace(/\{\{([a-z_]+)\}\}/g, (match, key: string) =>
    (only as readonly string[]).includes(key) ? sanitizeTemplateParam(key as TemplateParam, params[key as TemplateParam]) : match
  );
}

/** The button labels of a template in a language, in index order. */
export function templateButtonLabels(template: WhatsAppTemplate, locale: WhatsAppLocale): string[] {
  const copy = template.copy[locale];
  if (template.buttons === "confirm_cancel") return [...(copy.quickReplies ?? [])];
  if (template.buttons === "track") return copy.urlButton ? [copy.urlButton] : [];
  return [];
}

/** The message as plain text for the dashboard preview: body, then the footer, then the buttons. */
export function renderTemplatePreview(template: WhatsAppTemplate, locale: WhatsAppLocale, params: TemplateParams): string {
  const body = fillBody(template.copy[locale].body, params, template.params);
  const buttons = templateButtonLabels(template, locale).map((label) => `[ ${label} ]`);
  return [body, "", WHATSAPP_FOOTER, ...(buttons.length ? ["", ...buttons] : [])].join("\n");
}

// ── Graph send ───────────────────────────────────────────────────────────

export interface SendComponentsInput {
  template: WhatsAppTemplate;
  params: TemplateParams;
  /** Signed quick-reply payloads (payload.lib.ts), required for confirm_cancel. */
  quickReplyPayloads?: { confirm: string; cancel: string };
  /** The signed order token for the tracking URL's `{{1}}`, required for track. */
  trackingToken?: string;
}

export type GraphTemplateComponent =
  | { type: "body"; parameters: { type: "text"; parameter_name: TemplateParam; text: string }[] }
  | { type: "button"; sub_type: "quick_reply"; index: string; parameters: [{ type: "payload"; payload: string }] }
  | { type: "button"; sub_type: "url"; index: string; parameters: [{ type: "text"; text: string }] };

const TOKEN_RE = /^[A-Za-z0-9._~-]{1,512}$/;

/**
 * The `template.components` array of a Graph `POST /{phone-number-id}/messages`
 * call: every named body parameter, then the button parameters. Throws when a
 * button needs a value that wasn't given, so a broken message is never sent.
 */
export function buildTemplateSendComponents(input: SendComponentsInput): GraphTemplateComponent[] {
  const { template, params } = input;
  const components: GraphTemplateComponent[] = [
    {
      type: "body",
      parameters: template.params.map((name) => ({
        type: "text" as const,
        parameter_name: name,
        text: sanitizeTemplateParam(name, params[name]),
      })),
    },
  ];
  if (template.buttons === "confirm_cancel") {
    const payloads = input.quickReplyPayloads;
    if (!payloads?.confirm || !payloads.cancel) throw new Error(`whatsapp: ${template.name} needs quick-reply payloads`);
    components.push(
      { type: "button", sub_type: "quick_reply", index: "0", parameters: [{ type: "payload", payload: payloads.confirm }] },
      { type: "button", sub_type: "quick_reply", index: "1", parameters: [{ type: "payload", payload: payloads.cancel }] }
    );
  } else if (template.buttons === "track") {
    const token = input.trackingToken;
    if (!token || !TOKEN_RE.test(token)) throw new Error(`whatsapp: ${template.name} needs a URL-safe tracking token`);
    components.push({ type: "button", sub_type: "url", index: "0", parameters: [{ type: "text", text: token }] });
  }
  return components;
}

// ── Template submission (POST /{WABA_ID}/message_templates) ──────────────

/** Sample values Meta reviews the template with. */
export const TEMPLATE_EXAMPLES: Readonly<Record<WhatsAppLocale, Record<TemplateParam, string>>> = {
  ar: {
    customer_name: "منى",
    store_name: "متجر الورد",
    order_number: "TB-10234",
    total: "450 جنيه",
    carrier: "Bosta",
    tracking_number: "7834521190",
  },
  en: {
    customer_name: "Mona",
    store_name: "Rose Shop",
    order_number: "TB-10234",
    total: "EGP 450",
    carrier: "Bosta",
    tracking_number: "7834521190",
  },
};

export interface MetaTemplateDefinition {
  name: string;
  language: WhatsAppLocale;
  category: "UTILITY";
  parameter_format: "NAMED";
  components: Array<
    | { type: "BODY"; text: string; example: { body_text_named_params: { param_name: TemplateParam; example: string }[] } }
    | { type: "FOOTER"; text: string }
    | {
        type: "BUTTONS";
        buttons: Array<{ type: "QUICK_REPLY"; text: string } | { type: "URL"; text: string; url: string; example: [string] }>;
      }
  >;
}

/** The body of a Graph `POST /{WABA_ID}/message_templates` call, with Meta's review examples. */
export function toMetaTemplateDefinition(template: WhatsAppTemplate, language: WhatsAppLocale): MetaTemplateDefinition {
  const copy = template.copy[language];
  const examples = TEMPLATE_EXAMPLES[language];
  const components: MetaTemplateDefinition["components"] = [
    {
      type: "BODY",
      text: copy.body,
      example: { body_text_named_params: template.params.map((name) => ({ param_name: name, example: examples[name] })) },
    },
    { type: "FOOTER", text: WHATSAPP_FOOTER },
  ];
  if (template.buttons === "confirm_cancel" && copy.quickReplies) {
    components.push({ type: "BUTTONS", buttons: copy.quickReplies.map((text) => ({ type: "QUICK_REPLY" as const, text })) });
  } else if (template.buttons === "track" && copy.urlButton) {
    components.push({
      type: "BUTTONS",
      buttons: [{ type: "URL", text: copy.urlButton, url: WHATSAPP_TRACKING_URL, example: [`${TRACKING_URL_BASE}sample-token`] }],
    });
  }
  return { name: template.name, language, category: template.category, parameter_format: "NAMED", components };
}
