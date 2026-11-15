import { describe, expect, it } from "vitest";
import { SELLER_AUDIENCES } from "@workspace/lib/admin";
import { ADMIN_MESSAGE_BODY_MAX, ADMIN_MESSAGE_TITLE_MAX, isDashboardPath } from "@workspace/lib/notifications";
import {
  SELLER_AUDIENCE_LABELS,
  SELLER_NOTIFICATION_TEMPLATES,
  findSellerNotificationTemplate,
  templateFields,
} from "./seller-notification-templates.lib";

/** The push alert shows this much of the body (clipPushText in the dashboard). */
const PUSH_BODY = 180;
const BANNED_AR = ["الجوال", "موبايل", "البائع", "إيميل", "دومين", "براند", "ج.م", "تالابي", "للأبد", "استرداد"];

describe("seller notification templates", () => {
  it("has the owner's topics with unique ids", () => {
    const ids = SELLER_NOTIFICATION_TEMPLATES.map((template) => template.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const id of ["top_up", "first_product", "choose_theme", "shipping", "payments", "share_store", "finish_setup"]) {
      expect(ids).toContain(id);
    }
  });

  it("fits the send limits and the push length in both languages", () => {
    for (const template of SELLER_NOTIFICATION_TEMPLATES) {
      for (const language of ["ar", "en"] as const) {
        const { title, body } = template.text[language];
        expect(title.trim().length).toBeGreaterThan(0);
        expect(title.length).toBeLessThanOrEqual(ADMIN_MESSAGE_TITLE_MAX);
        expect(body.length).toBeLessThanOrEqual(Math.min(ADMIN_MESSAGE_BODY_MAX, PUSH_BODY));
        // No placeholders: the text is sent as written.
        expect(`${title} ${body}`).not.toMatch(/[{}]/);
      }
      if (template.link) expect(isDashboardPath(template.link)).toBe(true);
      expect(SELLER_AUDIENCES).toContain(template.audience);
    }
  });

  it("uses the owner's Arabic words", () => {
    for (const template of SELLER_NOTIFICATION_TEMPLATES) {
      const ar = `${template.text.ar.title} ${template.text.ar.body}`;
      for (const word of BANNED_AR) expect(ar).not.toContain(word);
    }
  });

  it("top-up: formal, says the balance doesn't expire, opens the top-up dialog for empty wallets", () => {
    const topUp = findSellerNotificationTemplate("top_up")!;
    expect(topUp.text.ar.title).toBe("يرجى شحن محفظة طلبي");
    expect(topUp.text.ar.body).toContain("لا تنتهي صلاحيته");
    expect(topUp.text.en.body).toContain("doesn't expire");
    expect(topUp.text.en.body).not.toMatch(/forever|refund/i);
    expect(topUp.link).toBe("/wallet?topup=1");
    expect(topUp.audience).toBe("wallet_empty");
  });

  it("finish setup opens /welcome", () => {
    expect(findSellerNotificationTemplate("finish_setup")?.link).toBe("/welcome");
  });

  it("templateFields fills the form in the chosen language, and is null for an unknown id", () => {
    expect(templateFields("first_product", "en")).toEqual({
      title: "Add your first product",
      body: findSellerNotificationTemplate("first_product")!.text.en.body,
      link: "/welcome#product",
    });
    expect(templateFields("first_product", "ar")?.title).toBe("أضف أول منتج إلى متجرك");
    expect(templateFields("nope", "ar")).toBeNull();
    expect(templateFields(null, "ar")).toBeNull();
    expect(findSellerNotificationTemplate(undefined)).toBeNull();
  });

  it("labels every audience", () => {
    for (const audience of SELLER_AUDIENCES) expect(SELLER_AUDIENCE_LABELS[audience].label).toBeTruthy();
  });
});
