import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { NextIntlClientProvider } from "next-intl";
import { describe, expect, it, vi } from "vitest";
import ar from "@/messages/ar.json";
import { PlanLive, type PlanLiveProps } from "./plan-live.client";

// lib/utils creates a browser Supabase client on import; nothing here calls it.
vi.mock("@/supabase/client", () => ({ createClient: () => ({}), supabase: {} }));
vi.mock("./plan.server", () => ({
  buyCreditPacksAction: vi.fn(),
  setPlanCancelAction: vi.fn(),
  upgradeToProAction: vi.fn(),
}));

const base: PlanLiveProps = {
  isPro: false,
  periodEnd: null,
  cancelAtPeriodEnd: false,
  graceUntil: null,
  adminGranted: false,
  credits: {
    plan: "free",
    total: 20,
    monthlyAllowance: 20,
    monthlyRemaining: 20,
    purchasedRemaining: 0,
    notActivated: true,
  } as PlanLiveProps["credits"],
  walletBalance: 0,
  ordersLast30Days: 42,
};

const render = (props: Partial<PlanLiveProps>) =>
  renderToStaticMarkup(
    createElement(
      NextIntlClientProvider,
      { locale: "ar", timeZone: "Africa/Cairo", messages: ar } as never,
      createElement(PlanLive, { ...base, ...props }),
    ),
  );

describe("PlanLive before activation", () => {
  it("shows the order count and fees to an activated seller", () => {
    const html = render({ ordersLast30Days: 42 });
    expect(html).toContain("42 طلبًا في آخر 30 يومًا");
    expect(html).toContain("<p class=\"text-[13px] text-white/70\">أنت على الباقة المجانية.</p>");
    expect(html).toContain("كلفتك ⁦1.26$⁩");
  });
});

describe("PlanLive prices in dollars (paid from the USD wallet)", () => {
  it("shows the plan prices, the order fee and the credit pack in $, never EGP", () => {
    const html = render({ walletBalance: 50 });
    expect(html).toContain("⁦0$⁩ شهريًا");
    expect(html).toContain("⁦29$⁩ شهريًا");
    expect(html).toContain("⁦0.03$⁩ رسوم على الطلب");
    expect(html).toContain("اشترِ بـ⁦1$⁩");
    expect(html).not.toContain("جنيه");
  });

  it("shows neither to a seller who isn't activated, and the plan line takes the heading", () => {
    const html = render({ ordersLast30Days: null });
    expect(html).not.toContain("آخر 30 يومًا");
    expect(html).not.toContain("كلفتك");
    expect(html).not.toContain("رسوم طلبات على");
    expect(html).toMatch(/<h2 class="[^"]*">أنت على الباقة المجانية\.<\/h2>/);
  });
});

describe("PlanLive AI credits before activation (docs/seller-top-up-rules.md)", () => {
  it("says 20 a month during the trial", () => {
    const html = render({});
    expect(html).toContain("حد طلبات الذكاء الاصطناعي 20 شهريًا");
    expect(html).not.toContain("توقفت طلبات الذكاء الاصطناعي");
  });

  it("says AI is stopped once the trial's days are over", () => {
    const stopped = { ...base.credits, total: 0, monthlyAllowance: 0, monthlyRemaining: 0, stopped: true };
    const html = render({ credits: stopped });
    expect(html).toContain("توقفت طلبات الذكاء الاصطناعي إلى أن تشحن محفظتك");
    expect(html).not.toContain("حد طلبات الذكاء الاصطناعي 20 شهريًا");
  });
});
