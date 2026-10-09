import { getLocale, getTranslations } from "next-intl/server";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@workspace/ui/components/tabs";
import ProductCard from "@/app/[locale]/(main)/products/[slug]/_components/ProductCard";
import { loadCards } from "./home-sections.lib";
import { pillListClass, pillTriggerClass } from "./category-hub";
import { SectionHeader } from "./section-header";

const SORTS = [
  { key: "bestSellers", sortBy: "popular", param: "popularity" },
  { key: "newest", sortBy: "newest", param: "newest" },
  { key: "topRated", sortBy: "rating", param: "rating" },
  { key: "lowestPrice", sortBy: "price_asc", param: "price-low" },
] as const;

export async function PickedForYou() {
  const locale = await getLocale();
  const t = await getTranslations("pages.home.picks");

  const lists = await Promise.all(
    SORTS.map(async (sort) => ({
      ...sort,
      products: await loadCards({ sortBy: sort.sortBy, limit: 10 }, locale),
    })),
  );

  if (lists.every((list) => list.products.length === 0)) return null;

  return (
    <section aria-labelledby="picks-title" className="container mt-9">
      <SectionHeader
        id="picks-title"
        title={t("title")}
        more={{ label: t("viewAll"), href: "/products" }}
      />
      <Tabs defaultValue="bestSellers" dir={locale === "ar" ? "rtl" : "ltr"} className="gap-0">
        <TabsList className={pillListClass}>
          {lists.map((list) => (
            <TabsTrigger key={list.key} value={list.key} className={pillTriggerClass}>
              {t(list.key)}
            </TabsTrigger>
          ))}
        </TabsList>
        {lists.map((list) => (
          <TabsContent key={list.key} value={list.key}>
            <div className="grid grid-cols-2 gap-2 md:grid-cols-3 md:gap-4 lg:grid-cols-4 xl:grid-cols-5">
              {list.products.map((product) => (
                <ProductCard key={String(product.id)} {...product} />
              ))}
            </div>
          </TabsContent>
        ))}
      </Tabs>
    </section>
  );
}
