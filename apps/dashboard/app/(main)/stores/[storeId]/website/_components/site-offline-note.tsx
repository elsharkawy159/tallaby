import Link from "next/link";
import { EyeOff } from "lucide-react";
import { useTranslations } from "next-intl";
import { Note } from "@/components/seller-ui";

/**
 * The design's amber note at the top of a Website page (`.note.am`): visitors
 * cannot see this store yet, with a link to where it is switched on. Nothing
 * for a published store. `stores.site_status` is the source, so it is never a guess.
 */
export function SiteOfflineNote({ storeId, siteStatus }: { storeId: string; siteStatus: string | null | undefined }) {
  const t = useTranslations("storeSiteStatus");
  const ts = useTranslations("sellerWebsite.common");
  if (siteStatus !== "unpublished" && siteStatus !== "draft") return null;
  return (
    <Note tone="amber" icon={EyeOff}>
      {t(siteStatus === "unpublished" ? "offline" : "draft")}{" "}
      <Link href={`/stores/${storeId}/website`} className="underline underline-offset-2">
        {ts("openOverview")}
      </Link>
    </Note>
  );
}
