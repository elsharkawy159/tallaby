import { Zap } from "lucide-react";
import { getLocale, getTranslations } from "next-intl/server";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@workspace/ui/components/carousel";
import ProductCard from "@/app/[locale]/(main)/products/[slug]/_components/ProductCard";
import { productCardCarouselItemClass } from "../home.lib";
import { loadCards } from "./home-sections.lib";
import { SectionHeader } from "./section-header";

const arrowClass =
  "z-10 hidden size-10 border-0 bg-white text-primary shadow-lg hover:bg-white disabled:opacity-0 md:inline-flex";

// Teal panel of products that are currently discounted. Renders nothing when
// no active product has a list price above its selling price.
export async function TodaysDeals() {
  const locale = await getLocale();
  const [t, deals] = await Promise.all([
    getTranslations("pages.home.deals"),
    loadCards({ onSale: true, sortBy: "popular", limit: 16 }, locale),
  ]);

  if (deals.length === 0) return null;

  return (
    <section id="deals" aria-labelledby="deals-title" className="container mt-9 scroll-mt-32">
      <div className="rounded-3xl bg-primary p-4 md:p-6">
        <SectionHeader
          id="deals-title"
          inverted
          title={
            <span className="flex items-center gap-2.5">
              <Zap className="size-5.5 text-[#ffd166]" aria-hidden />
              {t("title")}
            </span>
          }
          description={t("subtitle")}
          more={{ label: t("viewAll"), href: "/products?sale=1" }}
        />
        <Carousel
          opts={{ align: "start", direction: locale === "ar" ? "rtl" : "ltr" }}
          className="relative"
        >
          <CarouselContent className="-ms-2 md:-ms-4">
            {deals.map((product) => (
              <CarouselItem key={String(product.id)} className={productCardCarouselItemClass}>
                <ProductCard {...product} />
              </CarouselItem>
            ))}
          </CarouselContent>
          <CarouselPrevious className={`${arrowClass} -start-3.5`} />
          <CarouselNext className={`${arrowClass} -end-3.5`} />
        </Carousel>
      </div>
    </section>
  );
}
