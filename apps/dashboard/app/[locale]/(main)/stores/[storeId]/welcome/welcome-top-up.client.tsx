"use client";

import { useLocale, useTranslations } from "next-intl";
import { ArrowLeft, CircleCheck, CircleOff, Clock, Coins, Infinity as InfinityIcon, type LucideIcon } from "lucide-react";
import { FREE_ORDER_FEE_USD_CENTS } from "@workspace/lib/billing";
import { Link } from "@/i18n/navigation";
import { Note, SellerButton } from "@/components/seller-ui";
import { useEgpRate } from "@/components/egp-rate.client";
import { formatUsdPrice } from "@/lib/i18n/format";
import type { WelcomeWallet } from "./welcome.lib";

/** The tone and icon of each days line. */
const STATUS_LOOK: Record<WelcomeWallet["status"]["kind"], { tone: "default" | "amber" | "danger" | "success"; icon: LucideIcon } | null> = {
  none: null,
  activated: { tone: "success", icon: CircleCheck },
  review: { tone: "default", icon: Clock },
  offlineNow: { tone: "danger", icon: CircleOff },
  offlineIn: { tone: "amber", icon: Clock },
  graceLeft: { tone: "amber", icon: Clock },
  locked: { tone: "amber", icon: Clock },
  topUp: { tone: "amber", icon: Clock },
};

/**
 * Section 4 (docs/plans/seller-welcome.md): how the store wallet works, in
 * copy only. The balance stays and doesn't expire (the wallet is spend-only,
 * rule 7); the Free per-order fee comes from code (`FREE_ORDER_FEE_USD_CENTS`,
 * shown in EGP at today's rate), hidden on Pro and before the USD switch; the
 * days line comes from the server's order lock (`welcomeWallet`), never a typed number.
 */
export function WelcomeTopUpStep({ wallet }: { wallet: WelcomeWallet }) {
  const t = useTranslations("storeWelcome.topUp");
  const locale = useLocale();
  const rate = useEgpRate();
  const { status } = wallet;
  const look = STATUS_LOOK[status.kind];
  const statusText =
    status.kind === "none"
      ? null
      : status.kind === "offlineIn" || status.kind === "graceLeft"
        ? t(`status.${status.kind}`, { days: status.days })
        : t(`status.${status.kind}`);
  const openWallet = status.kind === "activated" || status.kind === "review";

  return (
    <div className="flex flex-col gap-4 px-4 max-[600px]:px-3">
      <ul className="flex flex-col gap-2 text-[13.5px] text-(--s-body)">
        <li className="flex items-start gap-2.5">
          <InfinityIcon className="mt-0.5 size-4 shrink-0 text-success" aria-hidden />
          {t("body")}
        </li>
        {wallet.fee && (
          <li className="flex items-start gap-2.5">
            <Coins className="mt-0.5 size-4 shrink-0 text-success" aria-hidden />
            <span>{t("fee", { fee: formatUsdPrice(FREE_ORDER_FEE_USD_CENTS, locale, rate) })}</span>
          </li>
        )}
      </ul>
      {look && statusText && (
        <Note tone={look.tone} icon={look.icon} className="text-[13px]">
          {statusText}
        </Note>
      )}
      <SellerButton asChild variant={openWallet ? "outline" : "amber"} className="self-start max-[600px]:w-full">
        <Link href={openWallet ? "/wallet" : "/wallet?topup=1"}>
          {t(openWallet ? "ctaWallet" : "cta")}
          <ArrowLeft className="ltr:rotate-180" aria-hidden />
        </Link>
      </SellerButton>
    </div>
  );
}
