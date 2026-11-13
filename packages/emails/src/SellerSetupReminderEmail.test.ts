import { render } from "@react-email/components";
import { createElement } from "react";
import { describe, expect, it } from "vitest";
import { SellerSetupReminderEmail, sellerSetupReminderSubject, type SellerSetupReminderEmailProps } from "./SellerSetupReminderEmail.js";

const STORE = "33333333-3333-4333-8333-333333333333";
const base: SellerSetupReminderEmailProps = {
  kind: "day1",
  sellerName: "أحمد",
  storeName: "متجر النور",
  setupUrl: "https://dashboard.tallaby.com/",
  optOutUrl: "https://dashboard.tallaby.com/api/email/setup-reminders/unsubscribe?token=abc",
  steps: [
    { key: "product", href: `https://dashboard.tallaby.com/stores/${STORE}/products/add`, done: true },
    { key: "design", href: `https://dashboard.tallaby.com/stores/${STORE}/website/templates`, done: false },
    { key: "payments", href: `https://dashboard.tallaby.com/stores/${STORE}/settings/payments`, done: false },
    { key: "shipping", href: `https://dashboard.tallaby.com/stores/${STORE}/shipping`, done: false },
  ],
};

const html = (props: Partial<SellerSetupReminderEmailProps> = {}) => render(createElement(SellerSetupReminderEmail, { ...base, ...props }));

describe("SellerSetupReminderEmail", () => {
  it("renders right-to-left Arabic", async () => {
    const out = await html();
    expect(out).toMatch(/<html[^>]*lang="ar"/);
    expect(out).toMatch(/<html[^>]*dir="rtl"/);
    expect(out).toContain("متجرك مستني يكمل");
  });

  it("links the button to the dashboard setup page and lists only the missing steps as links", async () => {
    const out = await html();
    expect(out).toContain('href="https://dashboard.tallaby.com/"');
    expect(out).toContain(`/stores/${STORE}/website/templates`);
    expect(out).toContain(`/stores/${STORE}/shipping`);
    expect(out).not.toContain(`/stores/${STORE}/products/add`);
  });

  it("has the opt-out link", async () => {
    expect(await html()).toContain("unsubscribe?token=abc");
  });

  it("day7 is the last reminder and names the free plan's per-order fee when known", async () => {
    const out = await html({ kind: "day7", orderFeeEgp: "≈ 1.62 جنيه" });
    expect(out).toContain("آخر تذكير");
    expect(out).toContain("≈ 1.62 جنيه");
    const noFee = await html({ kind: "day7" });
    expect(noFee).toContain("آخر تذكير");
  });

  it("has a readable plain-text version", async () => {
    const text = await render(createElement(SellerSetupReminderEmail, base), { plainText: true });
    expect(text).toContain("متجرك مستني يكمل");
    expect(text).toContain("https://dashboard.tallaby.com/");
  });

  it("has Arabic subjects", () => {
    expect(sellerSetupReminderSubject("day1")).toMatch(/[؀-ۿ]/);
    expect(sellerSetupReminderSubject("day7")).toMatch(/آخر تذكير/);
  });
});
