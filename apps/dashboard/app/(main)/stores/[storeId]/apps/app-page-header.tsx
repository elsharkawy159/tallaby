import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import type { StoreAppKey } from "@workspace/lib/integrations";
import { AppLogo } from "./app-logo";

/** The top of an app's own page (Bosta, Wassalha): back to Apps, logo, title and subtitle. */
export function AppPageHeader({
  storeId,
  app,
  backLabel,
  title,
  subtitle,
}: {
  storeId: string;
  app: StoreAppKey;
  backLabel: string;
  title: string;
  subtitle: string;
}) {
  return (
    <div>
      <Link
        href={`/stores/${storeId}/apps`}
        className="mb-4 inline-flex items-center gap-1 text-[13px] font-semibold text-muted-foreground hover:text-foreground"
      >
        <ChevronLeft className="size-4 rtl:rotate-180" aria-hidden />
        {backLabel}
      </Link>
      <div className="flex items-center gap-3.5">
        <AppLogo app={app} className="size-14 rounded-2xl" />
        <div className="min-w-0">
          <h1 className="text-[22px] leading-tight font-extrabold tracking-tight sm:text-[26px]">{title}</h1>
          <p className="mt-0.5 text-[13px] text-muted-foreground">{subtitle}</p>
        </div>
      </div>
    </div>
  );
}
