import { Suspense } from "react";
import Link from "next/link";
import { ChevronRight, Warehouse } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { SellerSettingsData } from "./seller-settings.data";
import { SellerSettingsSkeleton } from "./seller-settings.skeleton";

// Force dynamic rendering since this page uses cookies for authentication
export const dynamic = "force-dynamic";

const Settings = async () => {
  const t = await getTranslations("fulfillment");
  return (
    <>
      <div className="px-4 pt-4 sm:px-6 sm:pt-6">
        <Link
          href="/settings/fulfillment"
          className="flex items-center justify-between gap-3 rounded-lg border bg-white p-4 transition-colors hover:bg-gray-50 dark:bg-gray-950 dark:hover:bg-gray-900"
        >
          <span className="flex items-center gap-3">
            <Warehouse className="h-5 w-5 text-gray-600" />
            <span>
              <span className="block font-medium">{t("title")}</span>
              <span className="block text-sm text-muted-foreground">{t("description")}</span>
            </span>
          </span>
          <ChevronRight className="h-4 w-4 shrink-0 text-gray-400" />
        </Link>
      </div>
      <Suspense fallback={<SellerSettingsSkeleton />}>
        <SellerSettingsData />
      </Suspense>
    </>
  );
};

export default Settings;
