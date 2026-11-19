import type { CSSProperties } from "react";
import { Link } from "@/i18n/navigation";
import { Container } from "@/components/marketing/site/layout-primitives";
import { STORE_INDUSTRY_NAMES } from "@/lib/marketing/recent-stores.lib";
import type { DirectoryStore } from "@/lib/marketing/store-directory.lib";

/**
 * "Stores selling on Tallaby": real store logos in a slow loop (owner,
 * 2026-11-14). `stores` comes from `selectLogoStrip`, which is empty below its
 * threshold, and then nothing renders. The first copy is a real list of links;
 * the second only closes the loop, so it is hidden from readers and tab order.
 * It pauses on hover and focus, and under reduced motion it becomes one static,
 * wrapped row (marketing.css, `.logo-marquee`). Logos keep their own colours,
 * with the store's listed industry under them (the /stores label), when it has one
 * (owner, 2026-11-16).
 */
export type StoreLogoStripLabels = { title: string; all: string; listLabel: string };

export function StoreLogoStrip({ stores, labels, locale }: { stores: readonly DirectoryStore[]; labels: StoreLogoStripLabels; locale: string }) {
  if (stores.length === 0) return null;
  const rtl = locale === "ar";
  // About 4 seconds a logo, so a long line moves at the same calm speed as a short one.
  const duration = `${Math.max(40, stores.length * 4)}s`;

  return (
    <section aria-labelledby="trusted-stores-title" className="py-10 min-[641px]:py-14">
      <Container className="mb-6 flex flex-wrap items-baseline justify-between gap-x-6 gap-y-2">
        <h2 id="trusted-stores-title" className="text-[clamp(20px,2.4vw,26px)] leading-snug font-bold text-teal-900">
          {labels.title}
        </h2>
        <Link
          href="/stores"
          className="rounded-sm text-sm font-bold text-teal-700 underline-offset-2 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-700"
        >
          {labels.all}
        </Link>
      </Container>
      <div
        className="store-marquee logo-marquee overflow-hidden"
        dir="ltr"
        data-direction={rtl ? "rtl" : "ltr"}
        style={{ "--marquee-duration": duration } as CSSProperties}
      >
        <div className="store-marquee-track logo-marquee-track flex">
          {[0, 1].map((copy) => (
            <ul
              key={copy}
              aria-label={copy === 0 ? labels.listLabel : undefined}
              aria-hidden={copy === 1 ? true : undefined}
              data-marquee-copy={copy === 1 ? "" : undefined}
              className="m-0 flex flex-none list-none gap-3 p-0 pe-3"
            >
              {stores.map((store) => {
                const industry = store.industry ? STORE_INDUSTRY_NAMES[store.industry][rtl ? "ar" : "en"] : null;
                return (
                <li key={store.url}>
                  <a
                    href={store.url}
                    // Opens the store in a new tab so tallaby.com stays open (owner, 2026-11-15).
                    target="_blank"
                    rel="noopener noreferrer"
                    tabIndex={copy === 1 ? -1 : undefined}
                    title={store.name}
                    // A fixed size whether or not the category line shows, so nothing moves.
                    className="flex h-[96px] w-[168px] flex-col items-center justify-center gap-1.5 rounded-2xl border border-line bg-white px-4 transition-[border-color,box-shadow] duration-200 hover:border-line-strong hover:shadow-soft focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-700"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element -- seller logos can live on any https host */}
                    <img
                      src={store.logoUrl ?? ""}
                      alt={store.name}
                      width={116}
                      height={44}
                      loading="lazy"
                      decoding="async"
                      className="h-11 w-auto max-w-full flex-none object-contain"
                    />
                    {industry ? (
                      <span dir={rtl ? "rtl" : "ltr"} className="block max-w-full truncate text-xs leading-4 text-ink-500">
                        {industry}
                      </span>
                    ) : null}
                  </a>
                </li>
                );
              })}
            </ul>
          ))}
        </div>
      </div>
    </section>
  );
}
