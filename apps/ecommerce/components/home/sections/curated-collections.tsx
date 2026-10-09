import Image from "next/image";
import { Package } from "lucide-react";
import { getLocale, getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { loadSearchImage, productsHref } from "./home-sections.lib";

// Each tile links to a product search; its picture is the most popular
// product that search returns, so the cards follow the live catalog.
// Search terms are the words product titles actually use (checked against
// the catalog), not the tile labels.
const COLLECTIONS = [
  {
    title: "mobile",
    more: { categories: "Power Banks,Car Chargers & Mounts" },
    tiles: [
      { label: "powerBanks", search: "باور بانك" },
      { label: "chargers", search: "شاحن" },
      { label: "powerBanks10000", search: "10000" },
      { label: "carMounts", search: "حامل" },
    ],
  },
  {
    title: "audio",
    more: { categories: "Headphones & Earbuds,Bluetooth Speakers" },
    tiles: [
      { label: "earbuds", search: "أذن" },
      { label: "headphones", search: "رأس" },
      { label: "neckbands", search: "رقبة" },
      { label: "speakers", search: "سبيكر" },
    ],
  },
  {
    title: "mugs",
    more: { search: "مج" },
    tiles: [
      { label: "stanley", search: "ستانلي" },
      { label: "happyTime", search: "هابي تايم" },
      { label: "stainless", search: "استانلس" },
      { label: "allMugs", search: "مج" },
    ],
  },
  {
    title: "watches",
    more: { search: "ساعة" },
    tiles: [
      { label: "Oraimo MOCO", search: "MOCO", literal: true },
      { label: "Oraimo HAYATO", search: "HAYATO", literal: true },
      { label: "HainoTeko FG-8", search: "FG-8", literal: true },
      { label: "amoled", search: "AMOLED" },
    ],
  },
] as const;

export async function CuratedCollections() {
  const locale = await getLocale();
  const t = await getTranslations("pages.home.collections");

  const collections = await Promise.all(
    COLLECTIONS.map(async (collection) => ({
      ...collection,
      tiles: await Promise.all(
        collection.tiles.map(async (tile) => ({
          ...tile,
          image: await loadSearchImage(tile.search, locale),
        })),
      ),
    })),
  );

  return (
    <section className="container mt-9">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {collections.map((collection) => (
          <article
            key={collection.title}
            className="flex flex-col rounded-[20px] border border-neutral-200 bg-white p-4.5"
          >
            <h2 className="mb-3 text-base font-bold leading-snug text-neutral-900">
              {t(collection.title)}
            </h2>
            <ul className="grid flex-1 grid-cols-2 gap-2.5">
              {collection.tiles.map((tile) => {
                const label = "literal" in tile ? tile.label : t(tile.label);
                return (
                  <li key={tile.label}>
                    <Link
                      href={productsHref({ search: tile.search })}
                      className="group flex flex-col gap-1.5 text-xs text-neutral-800 hover:text-primary"
                    >
                      <span className="relative grid aspect-square place-items-center overflow-hidden rounded-xl bg-[#f3f4f3]">
                        {tile.image ? (
                          <Image
                            src={tile.image}
                            alt=""
                            fill
                            sizes="(min-width: 1024px) 140px, (min-width: 640px) 25vw, 45vw"
                            className="object-contain p-[10%] mix-blend-multiply transition-transform duration-200 group-hover:scale-105 motion-reduce:transition-none"
                          />
                        ) : (
                          <Package className="size-1/3 text-primary/60" aria-hidden />
                        )}
                      </span>
                      <span className="line-clamp-1">{label}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
            <Link
              href={productsHref(collection.more)}
              className="mt-3.5 self-start text-[13px] font-semibold text-primary hover:underline"
            >
              {t("discoverMore")}
            </Link>
          </article>
        ))}
      </div>
    </section>
  );
}
