import { getTranslations } from "next-intl/server";
import { ArrowUpRight, MapPin } from "lucide-react";
import type { AppFeaturePage } from "@workspace/apps";
import { Link } from "@/i18n/navigation";
import { SectionCard, SellerButton } from "@/components/seller-ui";
import { featurePageHref } from "./feature-page.lib";

/**
 * The screen of an app whose feature has its own dashboard page (owner,
 * 2026-11-27): where the page is, what to do there, and a button to open it.
 * Reads nothing; the page it opens checks the store against the session.
 */
export async function FeaturePageApp({ storeId, page }: { storeId: string; page: AppFeaturePage }) {
  const t = await getTranslations("featurePageApp");
  return (
    <SectionCard icon={MapPin} title={t("title")} description={t(`pages.${page}.where`)}>
      <p className="text-[13.5px] leading-[1.7] text-(--s-body)">{t(`pages.${page}.how`)}</p>
      <div>
        <SellerButton asChild size="sm" variant="solid">
          <Link href={featurePageHref(page, storeId)}>
            <ArrowUpRight aria-hidden />
            {t("open")}
          </Link>
        </SellerButton>
      </div>
    </SectionCard>
  );
}
