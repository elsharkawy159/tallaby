import Link from "next/link";
import { Package, Plus } from "lucide-react";
import { getLocale, getTranslations } from "next-intl/server";
import { Button } from "@workspace/ui/components/button";
import { formatNumber } from "@/lib/i18n/format";
import { getTopProducts } from "./home.queries";
import type { HomeRange } from "./home.shared";
import { EmptyState, HeaderLink, HomeCard, HomeCardHeader, ProductThumb } from "./home-ui";

export async function TopProductsData({ range }: { range: HomeRange }) {
  const locale = await getLocale();
  const [products, t] = await Promise.all([
    getTopProducts(range, locale),
    getTranslations("home.topProducts"),
  ]);
  const max = products[0]?.revenue || 1;

  return (
    <HomeCard aria-labelledby="top-title">
      <HomeCardHeader
        id="top-title"
        title={t("title")}
        description={t("description")}
        action={<HeaderLink href="/products">{t("viewAll")}</HeaderLink>}
      />
      {products.length === 0 ? (
        <EmptyState
          icon={Package}
          title={t("emptyTitle")}
          description={t("emptyDescription")}
          action={
            <Button asChild variant="secondary" size="sm" className="rounded-[9px]">
              <Link href="/products/add">
                <Plus aria-hidden />
                {t("addProduct")}
              </Link>
            </Button>
          }
        />
      ) : (
        <ul className="flex flex-col gap-3.5 px-5 pb-[18px] pt-3">
          {products.map((p) => (
            <li key={p.productId} className="flex items-center gap-3">
              <ProductThumb src={p.image} />
              <span className="flex min-w-0 flex-1 flex-col gap-[5px]">
                <b className="truncate text-[13px] font-semibold">{p.title}</b>
                <span className="h-[5px] overflow-hidden rounded-full bg-muted">
                  <i
                    className="block h-full rounded-full bg-primary"
                    style={{ width: `${(p.revenue / max) * 100}%` }}
                  />
                </span>
              </span>
              <span className="whitespace-nowrap text-end text-xs text-muted-foreground">
                <b className="block font-montserrat text-sm text-foreground tabular-nums">
                  {formatNumber(p.revenue, locale, { maximumFractionDigits: 0 })}
                </b>
                {t("sold", { count: p.units })}
              </span>
            </li>
          ))}
        </ul>
      )}
    </HomeCard>
  );
}
