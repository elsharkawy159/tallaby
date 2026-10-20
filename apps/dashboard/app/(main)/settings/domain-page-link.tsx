import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { ArrowRight } from "lucide-react";

/** Points from /settings to the store's Website › Domain & SEO page (P4-14, §7.2). */
export async function DomainPageLink({ storeId }: { storeId: string }) {
  const t = await getTranslations("domainSeo");
  return (
    <Link
      href={`/stores/${storeId}/website/domain`}
      className="inline-flex items-center gap-1 self-start text-xs font-medium text-primary-ink hover:underline"
    >
      {t("settingsLink")}
      <ArrowRight className="size-3.5 rtl:-scale-x-100" aria-hidden />
    </Link>
  );
}
