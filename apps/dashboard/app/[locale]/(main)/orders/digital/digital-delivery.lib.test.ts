import { describe, expect, it } from "vitest";
import { isDigitalLinkUsable } from "@workspace/lib/digital/access";
import {
  buildDigitalWhatsAppMessage,
  buildDigitalWhatsAppUrl,
  digitalLinkActions,
  digitalLinkStatus,
  isSellerConfirmedPaymentMethod,
  resolveDigitalPanelStage,
  type DigitalLinkRow,
} from "./digital-delivery.lib";

const NOW = new Date("2026-11-27T10:00:00Z");
const LATER = "2026-12-04T10:00:00Z";
const EARLIER = "2026-11-20T10:00:00Z";

const row = (over: Partial<DigitalLinkRow> = {}): DigitalLinkRow => ({
  fulfillmentStatus: "delivered",
  downloadCount: 0,
  maxDownloads: 1,
  expiresAt: LATER,
  ...over,
});

describe("digitalLinkStatus", () => {
  it("reads a fresh, used, expired, stopped and unsent link", () => {
    expect(digitalLinkStatus(row(), NOW)).toBe("ready");
    expect(digitalLinkStatus(row({ fulfillmentStatus: "downloaded", downloadCount: 1 }), NOW)).toBe("downloaded");
    expect(digitalLinkStatus(row({ expiresAt: EARLIER }), NOW)).toBe("expired");
    expect(digitalLinkStatus(row({ fulfillmentStatus: "expired" }), NOW)).toBe("expired");
    expect(digitalLinkStatus(row({ fulfillmentStatus: "revoked" }), NOW)).toBe("revoked");
    expect(digitalLinkStatus(row({ fulfillmentStatus: "pending" }), NOW)).toBe("pending");
  });

  it("keeps a pre-F-108c link with downloads left ready", () => {
    expect(digitalLinkStatus(row({ fulfillmentStatus: "downloaded", downloadCount: 2, maxDownloads: 5 }), NOW)).toBe("ready");
    expect(digitalLinkStatus(row({ maxDownloads: null, expiresAt: null, downloadCount: 9 }), NOW)).toBe("ready");
  });

  it("calls a link ready exactly when the download page accepts it", () => {
    const cases: DigitalLinkRow[] = [];
    for (const fulfillmentStatus of ["pending", "delivered", "downloaded", "expired", "revoked", "failed"]) {
      for (const downloadCount of [null, 0, 1, 3]) {
        for (const maxDownloads of [null, 0, 1, 5]) {
          for (const expiresAt of [null, EARLIER, LATER]) cases.push({ fulfillmentStatus, downloadCount, maxDownloads, expiresAt });
        }
      }
    }
    for (const c of cases) expect(digitalLinkStatus(c, NOW) === "ready").toBe(isDigitalLinkUsable(c, NOW));
  });
});

describe("resolveDigitalPanelStage", () => {
  const stage = (over: Partial<Parameters<typeof resolveDigitalPanelStage>[0]> = {}) =>
    resolveDigitalPanelStage({
      orderStatus: "pending",
      paymentStatus: "pending",
      paymentMethod: "instapay",
      deliverableLines: 1,
      linkedLines: 0,
      ...over,
    });

  it("asks the seller to confirm a transfer they check themselves", () => {
    expect(stage()).toBe("awaiting_payment");
    expect(stage({ paymentMethod: "vodafone_cash" })).toBe("awaiting_payment");
    expect(stage({ paymentMethod: "wallet_instapay" })).toBe("awaiting_payment");
    expect(stage({ paymentMethod: "bank_transfer" })).toBe("awaiting_payment");
  });

  it("waits for a gateway payment instead of offering Payment received", () => {
    expect(stage({ orderStatus: "payment_processing", paymentMethod: "online_payment" })).toBe("awaiting_online_payment");
    expect(stage({ paymentMethod: "online_payment" })).toBe("awaiting_online_payment");
    expect(stage({ orderStatus: "payment_processing" })).toBe("awaiting_online_payment");
  });

  it("offers Create links on a paid order without links, and is ready once every line has one", () => {
    expect(stage({ paymentStatus: "paid", paymentMethod: "online_payment" })).toBe("missing_links");
    expect(stage({ paymentStatus: "paid", deliverableLines: 2, linkedLines: 1 })).toBe("missing_links");
    expect(stage({ paymentStatus: "paid", linkedLines: 1 })).toBe("ready");
    expect(stage({ paymentStatus: "collected", linkedLines: 1 })).toBe("ready");
  });

  it("does nothing on a closed order", () => {
    for (const orderStatus of ["cancelled", "refunded", "refund_requested", "returned"]) {
      expect(stage({ orderStatus, paymentStatus: "paid", linkedLines: 1 })).toBe("closed");
    }
  });
});

describe("digitalLinkActions", () => {
  it("lets a used link only be renewed, never sent again", () => {
    expect(digitalLinkActions("ready", { hasEmail: false })).toEqual(["copy", "new_link"]);
    expect(digitalLinkActions("downloaded", { hasEmail: false })).toEqual(["new_link"]);
    expect(digitalLinkActions("expired", { hasEmail: true })).toEqual(["new_link", "email_new_link"]);
    expect(digitalLinkActions("pending", { hasEmail: false })).toEqual(["new_link"]);
    expect(digitalLinkActions("revoked", { hasEmail: true })).toEqual([]);
  });
});

describe("isSellerConfirmedPaymentMethod", () => {
  it("is true only for money the seller receives and checks", () => {
    for (const m of ["instapay", "vodafone_cash", "e_cash", "we_pay", "orange_cash", "wallet_instapay", "bank_transfer"]) {
      expect(isSellerConfirmedPaymentMethod(m)).toBe(true);
    }
    for (const m of ["online_payment", "tallaby_pay", "card", "wallet", "cash_on_delivery", "", null]) {
      expect(isSellerConfirmedPaymentMethod(m)).toBe(false);
    }
  });
});

describe("the WhatsApp message", () => {
  const link = (productName: string, token: string, expiresAt: string | null = LATER) => ({
    productName,
    url: `https://account.tallaby.com/d/${token}?lang=ar`,
    expiresAt,
  });

  it("greets the customer, names the store and the item, and says the link works once until a date", () => {
    const text = buildDigitalWhatsAppMessage({ locale: "ar", customerName: "Mona", storeName: "Kotob", links: [link("Guide", "aa")] });
    expect(text).toBe(
      [
        "مرحباً *Mona*",
        "شكراً لطلبك من *Kotob*. هذا رابط تحميل طلبك:",
        "*Guide*\nhttps://account.tallaby.com/d/aa?lang=ar",
        "الرابط يعمل مرة واحدة فقط، وينتهي في 4 ديسمبر 2026.",
      ].join("\n\n"),
    );
  });

  it("puts every link in one message and gives the earliest expiry", () => {
    const text = buildDigitalWhatsAppMessage({
      locale: "en",
      customerName: " ",
      storeName: "Kotob",
      links: [link("Guide", "aa", LATER), link("Workbook", "bb", "2026-12-01T10:00:00Z")],
    });
    expect(text).toContain("Hello *there*");
    expect(text).toContain("Here are your download links:");
    expect(text).toContain("*Guide*\nhttps://account.tallaby.com/d/aa");
    expect(text).toContain("*Workbook*\nhttps://account.tallaby.com/d/bb");
    expect(text).toContain("Each link works once and expires on 1 December 2026.");
  });

  it("leaves the date out when a link has none", () => {
    const text = buildDigitalWhatsAppMessage({ locale: "en", customerName: "Ali", storeName: "S", links: [link("G", "aa", null)] });
    expect(text.endsWith("The link works once.")).toBe(true);
  });

  it("opens wa.me with the phone in international form, like the order's other WhatsApp buttons", () => {
    const input = { locale: "en" as const, customerName: "Ali", storeName: "S", links: [link("G", "aa")] };
    const url = buildDigitalWhatsAppUrl("0100 123 4567", input);
    expect(url?.startsWith("https://wa.me/201001234567?text=")).toBe(true);
    expect(decodeURIComponent(url!.split("?text=")[1]!)).toBe(buildDigitalWhatsAppMessage(input));
    expect(buildDigitalWhatsAppUrl(null, input)).toBeNull();
    expect(buildDigitalWhatsAppUrl("01001234567", { ...input, links: [] })).toBeNull();
  });
});
