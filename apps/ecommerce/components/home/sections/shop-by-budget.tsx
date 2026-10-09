import { ArrowLeft } from "lucide-react";
import { getLocale, getTranslations } from "next-intl/server";
import { formatPricePlain } from "@workspace/lib";
import { Link } from "@/i18n/navigation";
import { productsHref } from "./home-sections.lib";

const TILES = [
  { kind: "under", amount: 250, tint: "bg-[#eef3f4]" },
  { kind: "under", amount: 500, tint: "bg-[#fff7e6]" },
  { kind: "under", amount: 1000, tint: "bg-[#faf3f3]" },
  { kind: "over", amount: 1000, tint: "bg-[#e9eee6]" },
] as const;

export async function ShopByBudget() {
  const locale = await getLocale();
  const t = await getTranslations("pages.home.budget");

  return (
    <section aria-labelledby="budget-title" className="container mt-9">
      <h2 id="budget-title" className="mb-4 text-xl font-bold text-neutral-900 md:text-[22px]">
        {t("title")}
      </h2>
      <ul className="grid grid-cols-2 gap-3 md:gap-4 lg:grid-cols-4">
        {TILES.map((tile) => (
          <li key={`${tile.kind}-${tile.amount}`}>
            <Link
              href={productsHref(
                tile.kind === "under"
                  ? { priceMax: String(tile.amount) }
                  : { priceMin: String(tile.amount) },
              )}
              className={`flex items-center gap-3 rounded-[18px] border border-transparent p-4 text-[#0d3743] transition-colors hover:border-secondary hover:text-[#0d3743] md:p-5 ${tile.tint}`}
            >
              <span>
                <span className="block text-xs text-neutral-700">{t(tile.kind)}</span>
                <span className="block font-[family-name:var(--font-montserrat)] text-xl font-extrabold leading-tight md:text-[26px]">
                  {formatPricePlain(tile.amount, locale)}
                </span>
              </span>
              <span className="ms-auto hidden size-9 shrink-0 place-items-center rounded-full bg-white sm:grid">
                <ArrowLeft className="size-4 ltr:rotate-180" aria-hidden />
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
