import { renderToStaticMarkup } from "react-dom/server";
import { NextIntlClientProvider } from "next-intl";
import { describe, expect, it } from "vitest";
import ar from "@/messages/marketing/home.ar.json";
import en from "@/messages/marketing/home.en.json";
import { STORE_INDUSTRY_NAMES, type RecentStore, type StoreIndustryId } from "@/lib/marketing/recent-stores.lib";
import { LiveStoreLine } from "./live-store-line.client";

const READ_AT = Date.parse("2026-11-04T12:00:00.000Z");
const ago = (ms: number) => new Date(READ_AT - ms).toISOString();
const MINUTE = 60_000;

function render(locale: "ar" | "en", stores: RecentStore[]) {
  return renderToStaticMarkup(
    <NextIntlClientProvider locale={locale} messages={(locale === "ar" ? ar : en) as never} timeZone="Africa/Cairo">
      <LiveStoreLine stores={stores} readAt={READ_AT} />
    </NextIntlClientProvider>,
  );
}
const text = (html: string) => html.replace(/<[^>]+>/g, "");

describe("LiveStoreLine", () => {
  it("renders from readAt on the server, not the clock, so hydration matches", () => {
    expect(text(render("ar", [{ industry: "fashion", publishedAt: ago(4 * MINUTE) }]))).toBe("تم إنشاء متجر أزياء جديد قبل 4 دقائق");
    expect(text(render("en", [{ industry: "fashion", publishedAt: ago(4 * MINUTE) }]))).toBe("A new fashion store opened 4 minutes ago");
  });

  it("says just now under a minute", () => {
    expect(text(render("ar", [{ industry: "beauty", publishedAt: ago(5000) }]))).toBe("تم إنشاء متجر تجميل جديد قبل لحظات");
    expect(text(render("en", [{ industry: "beauty", publishedAt: ago(5000) }]))).toBe("A new beauty store opened just now");
  });

  it("shows the latest store with its real age after the hour", () => {
    const stores: RecentStore[] = [{ industry: "sweets", publishedAt: ago(180 * MINUTE) }];
    expect(text(render("ar", stores))).toBe("تم إنشاء متجر حلويات وقهوة جديد قبل 3 ساعات");
    expect(text(render("en", stores))).toBe("A new sweets and coffee store opened 3 hours ago");
  });

  it("uses a generic line when the store has no listed industry, never invented data", () => {
    const stores: RecentStore[] = [{ industry: null, publishedAt: ago(180 * MINUTE) }];
    expect(text(render("ar", stores))).toBe("تم إنشاء متجر جديد على طلبي قبل 3 ساعات");
    expect(text(render("en", stores))).toBe("A new store opened on Tallaby 3 hours ago");
  });

  it("has wording for every industry in both languages", () => {
    for (const id of Object.keys(STORE_INDUSTRY_NAMES) as StoreIndustryId[]) {
      expect(ar.home.hero.live.industries[id]).toBeTruthy();
      expect(en.home.hero.live.industries[id]).toBeTruthy();
    }
  });

  it("sets the digits in the Latin number style and links nowhere", () => {
    const html = render("ar", [{ industry: "fashion", publishedAt: ago(4 * MINUTE) }]);
    expect(html).toMatch(/<span class="[^"]*font-latin[^"]*">4<\/span>/);
    expect(html).not.toContain("<a ");
    expect(html).not.toMatch(/[٠-٩]/);
  });

  it("renders nothing, with no box, when there is nothing true to say", () => {
    expect(render("ar", [])).toBe("");
    expect(render("ar", [{ industry: "fashion", publishedAt: ago(8 * 24 * 60 * MINUTE) }])).toBe("");
    expect(render("ar", [{ industry: "fashion", publishedAt: ago(-MINUTE) }])).toBe("");
    expect(render("ar", [{ industry: "fashion", publishedAt: null }])).toBe("");
  });
});
