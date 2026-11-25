import { APPS } from "@workspace/apps";
import { getLocale, getTranslations } from "next-intl/server";
import { Container, Ltr } from "@/components/marketing/site/layout-primitives";
import { roundUpStat } from "@/lib/marketing/platform-stats.lib";
import { getPlatformStats } from "@/lib/marketing/platform-stats.server";
import { getTemplateGallery } from "@/lib/marketing/templates.server";
import { CountUp } from "./count-up.client";

type Stat = { key: string; value: number | null; text?: string; label: string };

/**
 * The strip right after the hero (2026-11-25): real counts only, rounded up
 * to a round step (platform-stats.lib). A count too small to show gives way to a true fact, so
 * the strip always has four cells and never an invented number.
 */
export async function HomeStats() {
  const locale = await getLocale();
  const [t, stats, templates] = await Promise.all([getTranslations("home.stats"), getPlatformStats(), getTemplateGallery(locale)]);
  const templateCount = templates.length >= 10 ? roundUpStat(templates.length) : null;
  // Live App Center apps (code catalog), rounded up like the other figures.
  const liveApps = APPS.filter((app) => app.status === "live").length;
  const appCount = roundUpStat(liveApps);

  const cells: Stat[] = [
    stats.stores !== null ? { key: "stores", value: stats.stores, label: t("stores") } : { key: "minutes", value: null, text: "3", label: t("minutes") },
    stats.products !== null ? { key: "products", value: stats.products, label: t("products") } : { key: "ai", value: null, text: "AI", label: t("ai") },
    stats.orders !== null ? { key: "orders", value: stats.orders, label: t("orders") } : { key: "apps", value: appCount, label: t("apps") },
    templateCount !== null ? { key: "templates", value: templateCount, label: t("templates") } : { key: "noCode", value: null, text: "0", label: t("noCode") },
  ];

  return (
    <section aria-label={t("label")} className="relative -mt-6 pb-4">
      <Container>
        <ul className="m-0 grid list-none grid-cols-2 overflow-hidden rounded-card-lg border border-line bg-surface-glass p-0 shadow-soft min-[861px]:grid-cols-4">
          {cells.map((cell, index) => (
            <li
              key={cell.key}
              className={[
                "flex flex-col items-center gap-1 px-3 py-6 text-center min-[861px]:py-8",
                index % 2 === 1 ? "border-s border-line-soft" : "",
                index >= 2 ? "border-t border-line-soft min-[861px]:border-t-0" : "",
                index === 2 ? "min-[861px]:border-s" : "",
              ].join(" ")}
            >
              <span className="text-[clamp(28px,4vw,42px)] leading-tight font-bold text-teal-900">
                {cell.value !== null ? <CountUp value={cell.value} locale={locale} /> : <Ltr className="font-latin">{cell.text}</Ltr>}
              </span>
              <span className="text-[13.5px] text-pretty text-ink-500 min-[641px]:text-[15px]">{cell.label}</span>
            </li>
          ))}
        </ul>
      </Container>
    </section>
  );
}
