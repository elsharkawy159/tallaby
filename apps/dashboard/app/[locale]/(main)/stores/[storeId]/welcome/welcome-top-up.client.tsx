"use client";

import { useLocale, useTranslations } from "next-intl";
import { CircleOff, Clock, type LucideIcon } from "lucide-react";
import { FREE_ORDER_FEE_USD_CENTS } from "@workspace/lib/billing";
import { Link } from "@/i18n/navigation";
import { Note, SellerButton } from "@/components/seller-ui";
import { useEgpRate } from "@/components/egp-rate.client";
import { formatUsdPrice } from "@/lib/i18n/format";
import { welcomeTopUpLine, type WelcomeTopUpLine, type WelcomeWallet } from "./welcome.lib";

/** The tone and icon of each line. */
const LOOK: Record<WelcomeTopUpLine["kind"], { tone: "default" | "amber" | "danger"; icon: LucideIcon }> = {
  review: { tone: "default", icon: Clock },
  offlineNow: { tone: "danger", icon: CircleOff },
  offlineIn: { tone: "amber", icon: Clock },
  locked: { tone: "amber", icon: Clock },
};

/**
 * The top-up line under the steps (docs/seller-top-up-rules.md), copy only:
 * what the server's order lock says (`welcomeWallet`, never a typed number of
 * days) and a Top up button. Nothing for an activated seller. The Free
 * per-order fee comes from code (`FREE_ORDER_FEE_USD_CENTS`, shown in EGP at
 * today's rate) and is hidden on Pro and before the USD switch.
 */
export function WelcomeTopUpLine({ wallet }: { wallet: WelcomeWallet }) {
  const t = useTranslations("storeWelcome.topUp");
  const locale = useLocale();
  const rate = useEgpRate();
  const line = welcomeTopUpLine(wallet.status);
  if (!line) return null;
  const look = LOOK[line.kind];

  return (
    <div id="welcome-topUp" className="flex scroll-mt-24 flex-col gap-1.5">
      <Note tone={look.tone} icon={look.icon} className="items-center text-[13px] [&>svg]:mt-0">
        <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
          <span className="min-w-0 text-pretty font-semibold">{line.kind === "offlineIn" ? t("status.offlineIn", { days: line.days }) : t(`status.${line.kind}`)}</span>
          {line.href && (
            <SellerButton asChild size="sm" className="h-11 max-[600px]:h-11 max-[600px]:w-full">
              <Link href={line.href}>{t("cta")}</Link>
            </SellerButton>
          )}
        </div>
      </Note>
      {wallet.fee && <p className="px-3 text-xs text-(--s-subtle)">{t("fee", { fee: formatUsdPrice(FREE_ORDER_FEE_USD_CENTS, locale, rate) })}</p>}
    </div>
  );
}
