import { getLocale, getTranslations } from "next-intl/server";
import { cn } from "@workspace/ui/lib/utils";
import { Link } from "@/i18n/navigation";
import { ForwardArrow } from "@/components/marketing/site/direction-icons";
import type { TemplateCategory } from "@/lib/marketing/templates.data";
import { categoryShowcase, type GalleryEntry } from "@/lib/marketing/templates.lib";
import { TemplateRandomCover } from "./template-random-cover.client";

/** The five categories the home page leads with (owner, 2026-10-29); the sixth card is "More". */
const FEATURED: readonly Exclude<TemplateCategory, "all">[] = ["fa", "el", "be", "ho", "fo"];

const CARD =
  "group relative block overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-card transition-[transform,box-shadow] duration-200 hover:-translate-y-1.5 hover:no-underline hover:shadow-lift";

/**
 * Home page template categories: Fashion, Electronics, … each shown by a
 * random template of it (never the newest), linking to /templates filtered to it, and a dark "More"
 * card for the rest of the gallery.
 */
export async function TemplateCategories({ entries }: { entries: GalleryEntry[] }) {
  const locale = await getLocale();
  const [t, th] = await Promise.all([getTranslations("templates"), getTranslations("home.templates")]);
  const { cards, more } = categoryShowcase(entries, FEATURED);

  return (
    // `data-stagger`: the cards rise in once under @workspace/motion.
    <div data-stagger="" className="grid gap-5 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3">
      {cards.map((card) => (
        <Link key={card.category} href={`/templates?category=${card.category}`} className={CARD}>
          <TemplateRandomCover covers={card.covers} locale={locale} />
          <div className="pointer-events-none absolute inset-x-0 bottom-0 flex items-end justify-between gap-3 bg-gradient-to-t from-teal-900 via-teal-900/80 to-transparent px-5 pt-20 pb-4 text-white">
            <div>
              <b className="block text-xl font-extrabold">{t(`categories.${card.category}`)}</b>
              <small className="text-[13px] text-mist">{th("count", { count: card.count })}</small>
            </div>
            <span className="grid size-9 shrink-0 place-items-center rounded-full bg-white text-teal-900 transition-transform duration-200 group-hover:scale-110">
              <ForwardArrow />
            </span>
          </div>
        </Link>
      ))}
      {more ? (
        <Link href="/templates" className={cn(CARD, "border-teal-900")}>
          <TemplateRandomCover covers={more.covers} locale={locale} />
          <div className="pointer-events-none absolute inset-0 grid place-items-center bg-teal-900/85 p-5 text-center text-white transition-colors duration-200 group-hover:bg-teal-900/90">
            <div className="grid justify-items-center gap-1.5">
              <b className="text-2xl font-extrabold">{th("more")}</b>
              <small className="text-sm text-mist">{th("moreBody", { count: more.count })}</small>
              <span className="mt-2 inline-flex items-center gap-2 rounded-full bg-white px-[18px] py-2 text-sm font-bold text-teal-900">
                {th("seeAll")}
                <ForwardArrow />
              </span>
            </div>
          </div>
        </Link>
      ) : null}
    </div>
  );
}
