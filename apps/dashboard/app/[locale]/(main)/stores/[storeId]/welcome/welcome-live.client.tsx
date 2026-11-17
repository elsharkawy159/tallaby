"use client";

import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { ArrowLeft, Copy, ExternalLink, MessageCircle, PartyPopper } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { IconButton, SellerButton, SellerCard } from "@/components/seller-ui";
import { whatsappShare } from "@/app/[locale]/(builder)/ai-builder/_components/workspace.lib";
import { welcomeShareMessage } from "./welcome.lib";

/**
 * Under the steps once the store is published: "Your store is live", its link
 * with copy and open, one button that sends the pre-written message on
 * WhatsApp (`wa.me`), and the way to the dashboard.
 */
export function WelcomeLiveCard({ storeName, url }: { storeName: string; url: string }) {
  const t = useTranslations("storeWelcome.live");
  const tPage = useTranslations("storeWelcome");
  const message = welcomeShareMessage(t, { storeName, url });

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(url);
      toast.success(t("copied"));
    } catch {
      toast.error(t("copyFailed"));
    }
  };

  return (
    <SellerCard id="welcome-live" className="flex scroll-mt-24 flex-col gap-4 border-success p-5 max-[600px]:p-4">
      <div className="flex items-center gap-3">
        <span className="grid size-11 shrink-0 place-items-center rounded-[14px] bg-success-soft text-success [&_svg]:size-5">
          <PartyPopper aria-hidden />
        </span>
        <h2 className="text-[17px] font-bold text-(--s-ink)">{t("title")}</h2>
      </div>

      <div className="flex items-center gap-1 rounded-2xl border border-(--s-line) bg-(--s-surface) py-1 ps-3.5 pe-1">
        <bdi dir="ltr" className="min-w-0 flex-1 truncate text-start font-montserrat text-[14px] font-semibold text-(--s-ink)">
          {url.replace(/^https?:\/\//, "")}
        </bdi>
        <IconButton className="size-11 max-[600px]:size-11" onClick={() => void copyLink()} aria-label={t("copy")} title={t("copy")}>
          <Copy aria-hidden />
        </IconButton>
        <IconButton asChild className="size-11 max-[600px]:size-11" aria-label={t("open")} title={t("open")}>
          <a href={url} target="_blank" rel="noopener noreferrer">
            <ExternalLink aria-hidden />
          </a>
        </IconButton>
      </div>

      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 max-[600px]:flex-col max-[600px]:items-stretch">
        <SellerButton asChild variant="whatsapp" className="h-11">
          <a href={whatsappShare(message)} target="_blank" rel="noopener noreferrer">
            <MessageCircle aria-hidden />
            {t("whatsapp")}
          </a>
        </SellerButton>
        <Link
          href="/"
          className="inline-flex min-h-11 items-center justify-center gap-1 text-[13.5px] font-bold text-(--s-link) underline-offset-4 hover:underline"
        >
          {tPage("skip")}
          <ArrowLeft className="size-4 ltr:rotate-180" aria-hidden />
        </Link>
      </div>
    </SellerCard>
  );
}

/** Theme and product are done but the store is still offline: one line to the Website page, where it goes live. */
export function WelcomeOfflineLine({ storeId }: { storeId: string }) {
  const t = useTranslations("storeWelcome.offline");
  return (
    <p id="welcome-live" className="flex scroll-mt-24 flex-wrap items-center gap-x-2 px-1 text-[13.5px] text-(--s-muted)">
      {t("note")}
      <Link href={`/stores/${storeId}/website`} className="inline-flex min-h-11 items-center gap-1 font-bold text-(--s-link) underline-offset-4 hover:underline">
        {t("link")}
        <ArrowLeft className="size-4 ltr:rotate-180" aria-hidden />
      </Link>
    </p>
  );
}
