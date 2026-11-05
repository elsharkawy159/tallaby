import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import type { StoreAppKey } from "@workspace/lib/integrations";
import { TextAction } from "@/components/seller-ui";
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
    <header className="flex flex-col items-start gap-3">
      <TextAction asChild className="-ms-2.5 max-[600px]:min-h-10">
        <Link href={`/stores/${storeId}/apps`}>
          <ChevronLeft className="rtl:rotate-180" aria-hidden />
          {backLabel}
        </Link>
      </TextAction>
      <div className="flex items-center gap-3.5">
        <AppLogo app={app} className="size-[52px] rounded-2xl" />
        <div className="min-w-0">
          <h1 className="text-[clamp(22px,2.4vw,28px)] font-bold leading-[1.35] text-(--s-ink)">{title}</h1>
          <p className="mt-0.5 text-pretty text-[14px] text-(--s-muted)">{subtitle}</p>
        </div>
      </div>
    </header>
  );
}
