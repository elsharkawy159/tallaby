"use client";

import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Copy, Heart, MessageCircle, Smartphone, UserRound } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { SellerButton } from "@/components/seller-ui";
import { whatsappShare } from "@/app/[locale]/(builder)/ai-builder/_components/workspace.lib";
import { StoreLinkSection } from "../../../settings/store-link.client";
import { welcomeShareMessage } from "./welcome.lib";
import type { WelcomeData } from "./welcome.types";

const TIPS = [
  { key: "bio", icon: UserRound },
  { key: "family", icon: Heart },
  { key: "status", icon: Smartphone },
] as const;

/**
 * Section 3 (docs/plans/seller-welcome.md): the store link (the same card as
 * Settings, with copy, open and change), three ways to share it, and a
 * pre-written message for customers with Copy and Send via WhatsApp. An
 * offline store (never published, or switched off) says so and links to the
 * Website page, where it goes live.
 */
export function WelcomeShareStep({ data }: { data: WelcomeData }) {
  const t = useTranslations("storeWelcome.share");
  const { share } = data;
  const message = welcomeShareMessage(t, { storeName: data.storeName, url: share.url });
  const offline = share.siteStatus === "draft" || share.siteStatus === "unpublished";

  const copyMessage = async () => {
    try {
      await navigator.clipboard.writeText(message);
      toast.success(t("copied"));
    } catch {
      toast.error(t("copyFailed"));
    }
  };

  return (
    <div className="flex flex-col gap-5 px-4 max-[600px]:px-3">
      <div className="flex flex-col gap-3">
        <StoreLinkSection
          storeId={data.storeId}
          initialSubdomain={share.subdomain}
          customDomain={share.customDomain}
          readOnly={data.readOnly}
          siteStatus={share.siteStatus}
        />
        {offline && (
          <Link
            href={`/stores/${data.storeId}/website`}
            className="inline-flex min-h-10 items-center self-start text-[13px] font-bold text-(--s-link) underline-offset-4 hover:underline"
          >
            {t("offlineLink")}
          </Link>
        )}
      </div>

      <div className="flex flex-col gap-2">
        <h3 className="text-[15px] font-bold text-(--s-ink)">{t("tipsTitle")}</h3>
        <ul className="flex flex-col gap-2">
          {TIPS.map(({ key, icon: Icon }) => (
            <li key={key} className="flex items-center gap-2.5 text-[13.5px] text-(--s-body)">
              <span className="grid size-8 shrink-0 place-items-center rounded-full bg-(--s-fill) text-(--s-ink) [&_svg]:size-4">
                <Icon aria-hidden />
              </span>
              {t(`tips.${key}`)}
            </li>
          ))}
        </ul>
      </div>

      <div className="flex flex-col gap-3 rounded-2xl border border-(--s-line) bg-(--s-surface) p-4 max-[600px]:p-3.5">
        <div>
          <h3 className="text-[15px] font-bold text-(--s-ink)">{t("messageTitle")}</h3>
          <p className="text-pretty text-[13px] text-(--s-muted)">{t("messageHint")}</p>
        </div>
        <p className="whitespace-pre-line break-words rounded-[14px] bg-(--s-tint) px-3.5 py-3 text-[14px] leading-[1.8] text-(--s-ink)">
          <bdi>{message}</bdi>
        </p>
        <div className="flex flex-wrap gap-2">
          <SellerButton type="button" variant="outline" size="sm" className="max-[600px]:flex-1" onClick={() => void copyMessage()}>
            <Copy aria-hidden />
            {t("copy")}
          </SellerButton>
          <SellerButton asChild variant="solid" size="sm" className="max-[600px]:flex-1">
            <a href={whatsappShare(message)} target="_blank" rel="noopener noreferrer">
              <MessageCircle aria-hidden />
              {t("whatsapp")}
            </a>
          </SellerButton>
        </div>
      </div>
    </div>
  );
}
