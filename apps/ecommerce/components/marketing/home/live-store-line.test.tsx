import { renderToStaticMarkup } from "react-dom/server";
import { NextIntlClientProvider } from "next-intl";
import { describe, expect, it } from "vitest";
import ar from "@/messages/marketing/home.ar.json";
import en from "@/messages/marketing/home.en.json";
import { LiveStoreLine } from "./live-store-line.client";

const READ_AT = Date.parse("2026-11-04T12:00:00.000Z");
const ago = (ms: number) => new Date(READ_AT - ms).toISOString();
const MINUTE = 60_000;

function render(locale: "ar" | "en", stores: { name: string; publishedAt: string | null }[]) {
  return renderToStaticMarkup(
    <NextIntlClientProvider locale={locale} messages={(locale === "ar" ? ar : en) as never} timeZone="Africa/Cairo">
      <LiveStoreLine stores={stores} readAt={READ_AT} />
    </NextIntlClientProvider>,
  );
}
const text = (html: string) => html.replace(/<[^>]+>/g, "");

describe("LiveStoreLine", () => {
  it("renders from readAt on the server, not the clock, so hydration matches", () => {
    expect(text(render("ar", [{ name: "Glow", publishedAt: ago(4 * MINUTE) }]))).toBe("تم إنشاء متجر Glow قبل 4 دقائق");
    expect(text(render("en", [{ name: "Glow", publishedAt: ago(4 * MINUTE) }]))).toBe("New store: Glow, 4 minutes ago");
  });

  it("says just now under a minute", () => {
    expect(text(render("ar", [{ name: "Glow", publishedAt: ago(5000) }]))).toBe("تم إنشاء متجر Glow قبل لحظات");
    expect(text(render("en", [{ name: "Glow", publishedAt: ago(5000) }]))).toBe("New store: Glow, just now");
  });

  it("shows the latest store with its real age after the hour", () => {
    const stores = [{ name: "Glow", publishedAt: ago(180 * MINUTE) }];
    expect(text(render("ar", stores))).toBe("آخر متجر: Glow، قبل 3 ساعات");
    expect(text(render("en", stores))).toBe("Latest store: Glow, 3 hours ago");
  });

  it("sets the digits in the Latin number style and links nowhere", () => {
    const html = render("ar", [{ name: "Glow", publishedAt: ago(4 * MINUTE) }]);
    expect(html).toMatch(/<span class="[^"]*font-latin[^"]*">4<\/span>/);
    expect(html).not.toContain("<a ");
    expect(html).not.toMatch(/[٠-٩]/);
  });

  it("renders a store name as text, never as markup", () => {
    const html = render("en", [{ name: "<b>x</b>{y}", publishedAt: ago(4 * MINUTE) }]);
    expect(html).toContain("&lt;b&gt;x&lt;/b&gt;{y}");
  });

  it("renders nothing, with no box, when there is nothing true to say", () => {
    expect(render("ar", [])).toBe("");
    expect(render("ar", [{ name: "Old", publishedAt: ago(8 * 24 * 60 * MINUTE) }])).toBe("");
    expect(render("ar", [{ name: "Future", publishedAt: ago(-MINUTE) }])).toBe("");
    expect(render("ar", [{ name: "Null", publishedAt: null }])).toBe("");
  });
});
