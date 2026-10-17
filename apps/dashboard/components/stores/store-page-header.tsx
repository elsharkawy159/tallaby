import { getTranslations } from "next-intl/server";
import { storeHostname } from "@workspace/lib/storefront";
import { Badge } from "@workspace/ui/components/badge";
import type { StoreRow } from "@workspace/lib/stores/server";
import { StoreLogo } from "./store-logo.client";

/** Logo, name and address of the store a /stores/[storeId]/… page edits. */
export async function StorePageHeader({ store }: { store: Pick<StoreRow, "name" | "logoUrl" | "subdomain" | "status"> }) {
  const t = await getTranslations("storeSettings");
  return (
    <div className="flex items-center gap-3">
      <StoreLogo name={store.name} logoUrl={store.logoUrl} className="size-11 rounded-xl" />
      <div className="min-w-0">
        <h1 className="truncate text-lg font-bold">{store.name}</h1>
        <p dir="ltr" className="truncate text-start text-sm text-muted-foreground rtl:text-end">
          {storeHostname(store.subdomain)}
        </p>
      </div>
      {store.status !== "active" && (
        <Badge variant="outline" className="ms-auto">
          {t("readOnlyBadge")}
        </Badge>
      )}
    </div>
  );
}
