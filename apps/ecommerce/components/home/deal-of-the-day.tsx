import { Link } from "@/i18n/navigation";
import { getProducts } from "@/actions/products";
import { getLocale, getTranslations } from "next-intl/server";
import ProductCard from "@/app/[locale]/(main)/products/[slug]/_components/ProductCard";
import { Button } from "@workspace/ui/components/button";
import { Badge } from "@workspace/ui/components/badge";
import { Clock, Zap } from "lucide-react";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselPrevious,
  CarouselNext,
} from "@workspace/ui/components/carousel";

interface DealOfTheDayProps {
  title?: string;
  subtitle?: string;
  limit?: number;
  showCountdown?: boolean;
  className?: string;
}

function getDiscountPercent(price: unknown): number | null {
  if (!price || typeof price !== "object") return null;
  const p = price as {
    base?: number | null;
    list?: number | null;
    final?: number | null;
    discountValue?: number | null;
    discountType?: string | null;
  };

  if (p.discountType === "percentage" && typeof p.discountValue === "number") {
    return Math.round(p.discountValue);
  }

  const original = p.list ?? p.base;
  const final = p.final;
  if (
    typeof original === "number" &&
    typeof final === "number" &&
    original > final &&
    original > 0
  ) {
    return Math.round(((original - final) / original) * 100);
  }

  return null;
}

export default async function DealOfTheDay({
  title,
  subtitle,
  limit = 6,
  showCountdown = true,
  className = "",
}: DealOfTheDayProps) {
  const locale = (await getLocale()) as "en" | "ar";
  const t = await getTranslations("pages.home");
  const productsResult = await getProducts({
    sortBy: "popular",
    limit,
    locale,
  });

  const products = productsResult.success ? productsResult.data : [];

  if (!products?.length) {
    return null;
  }

  const sectionTitle = title ?? t("dealOfTheDay");
  const sectionSubtitle = subtitle ?? t("dealOfTheDaySubtitle");

  return (
    <section className={`lg:py-10 py-6 ${className}`}>
      <div className="container mx-auto">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 sm:mb-6 gap-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
            <div className="flex items-center gap-2">
              <span className="flex size-9 items-center justify-center rounded-full bg-amber-100 text-amber-600">
                <Zap className="size-5" />
              </span>
              <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900">
                {sectionTitle}
              </h2>
            </div>
            <Badge variant="destructive" className="animate-pulse">
              {t("hotDeal")}
            </Badge>
          </div>

          {showCountdown && (
            <div className="flex items-center gap-2 rounded-full bg-white/80 px-3 py-1.5 text-xs sm:text-sm text-gray-600 shadow-sm ring-1 ring-amber-100">
              <Clock className="size-4 text-amber-600" />
              <span>23:45:12</span>
            </div>
          )}
        </div>

        {sectionSubtitle && (
          <p className="text-base sm:text-lg text-gray-600 mb-6 sm:mb-8 max-w-2xl">
            {sectionSubtitle}
          </p>
        )}

        <Carousel
          opts={{
            align: "start",
            dragFree: false,
            direction: locale === "ar" ? "rtl" : "ltr",
          }}
          className="w-full"
        >
          <CarouselContent className="p-1.5">
            {products.map((product) => {
              const discount = getDiscountPercent(product.price);

              return (
                <CarouselItem
                  key={product.id}
                  className="basis-auto md:max-w-[285px] max-w-43 md:ps-4 ps-2"
                >
                  <div className="relative group h-full">
                    <ProductCard
                      id={product.id}
                      title={product.title}
                      slug={product.slug}
                      images={
                        product.images as Array<
                          string | { url?: string } | unknown
                        >
                      }
                      price={
                        product.price as
                          | number
                          | {
                              base?: number | null;
                              list?: number | null;
                              final?: number | null;
                              discountType?: string | null;
                              discountValue?: number | null;
                            }
                          | null
                      }
                      averageRating={product.averageRating ?? undefined}
                      reviewCount={product.reviewCount ?? undefined}
                    />

                    {discount != null && discount > 0 && (
                      <div className="absolute top-2 left-2 z-10 rtl:left-auto rtl:right-2">
                        <Badge
                          variant="destructive"
                          className="text-xs font-bold shadow-sm"
                        >
                          -{discount}%
                        </Badge>
                      </div>
                    )}
                  </div>
                </CarouselItem>
              );
            })}
          </CarouselContent>

          <div className="flex justify-center mt-6 gap-2">
            <CarouselPrevious />
            <CarouselNext />
          </div>
        </Carousel>

        <div className="text-center mt-8">
          <Button asChild variant="outline" size="lg">
            <Link href="/products?sortBy=popular">{t("viewAllDeals")}</Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
