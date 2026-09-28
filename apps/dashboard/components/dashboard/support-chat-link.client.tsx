"use client";

import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import { getStorefrontStoreUrl, getSupportWhatsAppUrl } from "@/lib/constants";
import { useSiteData } from "@/providers/site-data";

interface SupportChatLinkProps {
  isCollapsed?: boolean;
  className?: string;
}

const WhatsAppIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" className={className}>
    <path d="M17.47 14.38c-.3-.15-1.76-.87-2.03-.97-.27-.1-.47-.15-.67.15-.2.3-.77.97-.94 1.17-.17.2-.35.22-.65.07-.3-.15-1.26-.46-2.4-1.48-.89-.79-1.49-1.77-1.66-2.07-.17-.3-.02-.46.13-.61.13-.13.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.02-.52-.07-.15-.67-1.62-.92-2.22-.24-.58-.49-.5-.67-.51h-.57c-.2 0-.52.07-.8.37-.27.3-1.04 1.02-1.04 2.49s1.07 2.89 1.22 3.09c.15.2 2.1 3.2 5.08 4.49.71.31 1.26.49 1.69.63.71.23 1.36.2 1.87.12.57-.09 1.76-.72 2.01-1.41.25-.7.25-1.29.17-1.41-.07-.13-.27-.2-.57-.35M12.05 21.5h-.01a9.44 9.44 0 0 1-4.8-1.32l-.35-.2-3.57.93.95-3.48-.22-.36a9.4 9.4 0 0 1-1.44-5.02c0-5.2 4.24-9.44 9.45-9.44a9.4 9.4 0 0 1 6.68 2.77 9.38 9.38 0 0 1 2.76 6.68c0 5.21-4.24 9.44-9.45 9.44m8.04-17.48A11.3 11.3 0 0 0 12.05.7C5.78.7.68 5.8.68 12.06c0 2 .52 3.96 1.52 5.68L.58 23.7l6.1-1.6a11.3 11.3 0 0 0 5.37 1.37h.01c6.26 0 11.36-5.1 11.36-11.37 0-3.03-1.18-5.89-3.33-8.03" />
  </svg>
);

/**
 * WhatsApp chat URL for Tallaby support, pre-filled with the seller's store
 * name and link so the support team knows who is asking.
 */
export const useSupportWhatsAppUrl = () => {
  const t = useTranslations("nav");
  const { seller } = useSiteData();
  const storeName = seller.data?.businessName;
  const slug = seller.data?.slug;

  const message = [
    storeName
      ? t("supportMessage", { store: storeName })
      : t("supportMessageNoStore"),
    slug ? t("supportMessageStoreLink", { url: getStorefrontStoreUrl(slug) }) : null,
    "",
    t("supportMessageQuestion"),
  ]
    .filter((line) => line !== null)
    .join("\n");

  return getSupportWhatsAppUrl(message);
};

export const SupportChatLink = ({ isCollapsed, className }: SupportChatLinkProps) => {
  const t = useTranslations("nav");
  const href = useSupportWhatsAppUrl();

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      title={isCollapsed ? t("chatWithSupport") : t("chatWithSupportHint")}
      aria-label={t("chatWithSupport")}
      className={cn(
        "flex items-center rounded-lg bg-[#25D366] text-sm font-semibold text-white shadow-sm transition-colors hover:bg-[#1ebe5b] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#25D366] focus-visible:ring-offset-2",
        isCollapsed ? "justify-center px-2 py-3" : "gap-3 px-4 py-2.5",
        className
      )}
    >
      <WhatsAppIcon className="h-5 w-5 shrink-0" />
      {!isCollapsed && <span className="truncate">{t("chatWithSupport")}</span>}
    </a>
  );
};
