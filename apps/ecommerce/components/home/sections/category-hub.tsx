import Image from "next/image";
import { getLocale, getTranslations } from "next-intl/server";
import { Button } from "@workspace/ui/components/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@workspace/ui/components/tabs";
import { Link } from "@/i18n/navigation";
import ProductCard from "@/app/[locale]/(main)/products/[slug]/_components/ProductCard";
import { loadTopCategories } from "@/lib/top-categories";
import { loadCards } from "./home-sections.lib";
import { SectionHeader } from "./section-header";

export const pillListClass =
  "mb-4 h-auto w-full justify-start gap-1.5 overflow-x-auto rounded-none border-0 bg-transparent p-0 [scrollbar-width:none] md:h-auto";
export const pillTriggerClass =
  "h-auto flex-none rounded-full border border-neutral-200 bg-white px-4 py-1.75 text-[13px] font-semibold text-neutral-700 hover:text-primary data-[state=active]:border-primary data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-none";

// Tabs over the busiest categories: a dark banner that names the category and
// four of its most popular products.
export async function CategoryHub() {
  const locale = await getLocale();
  const [t, categories] = await Promise.all([
    getTranslations("pages.home.hub"),
    loadTopCategories(locale),
  ]);

  const withProducts = (
    await Promise.all(
      categories.slice(0, 6).map(async (category) => ({
        category,
        products: await loadCards(
          { categoryName: category.name, sortBy: "popular", limit: 4 },
          locale,
        ),
      })),
    )
  ).filter((entry) => entry.products.length > 0);

  if (withProducts.length === 0) return null;

  return (
    <section aria-labelledby="hub-title" className="container mt-9">
      <SectionHeader id="hub-title" title={t("title")} description={t("subtitle")} />
      <Tabs
        defaultValue={withProducts[0]!.category.id}
        dir={locale === "ar" ? "rtl" : "ltr"}
        className="gap-0"
      >
        <TabsList className={pillListClass}>
          {withProducts.map(({ category }) => (
            <TabsTrigger key={category.id} value={category.id} className={pillTriggerClass}>
              {category.displayName}
            </TabsTrigger>
          ))}
        </TabsList>

        {withProducts.map(({ category, products }) => (
          <TabsContent
            key={category.id}
            value={category.id}
            className="grid items-start gap-4 lg:grid-cols-[280px_minmax(0,1fr)]"
          >
            <div className="flex flex-col gap-2.5 rounded-[18px] bg-[#0d3743] p-5.5 text-white">
              <h3 className="text-[22px] font-bold leading-snug">{category.displayName}</h3>
              <p className="text-[13px] text-[#b9cfd5]">
                {t("bannerText", { count: category.productCount })}
              </p>
              <div className="relative my-1 hidden min-h-44 flex-1 overflow-hidden rounded-[14px] bg-white lg:block">
                {category.image && (
                  <Image
                    src={category.image}
                    alt=""
                    fill
                    sizes="240px"
                    className="object-contain p-[10%]"
                  />
                )}
              </div>
              <Button
                asChild
                className="rounded-full bg-accent font-bold text-white hover:bg-[#e89318]"
              >
                <Link href={category.href}>
                  {t("shopCategory", { name: category.displayName })}
                </Link>
              </Button>
            </div>

            <div className="grid grid-cols-2 gap-2 md:grid-cols-4 md:gap-3.5">
              {products.map((product) => (
                <ProductCard key={String(product.id)} {...product} />
              ))}
            </div>
          </TabsContent>
        ))}
      </Tabs>
    </section>
  );
}
