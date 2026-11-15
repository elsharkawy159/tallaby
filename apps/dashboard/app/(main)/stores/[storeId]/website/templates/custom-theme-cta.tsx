import { getTranslations } from "next-intl/server";
import { SellerButton } from "@/components/seller-ui";
import { WhatsAppIcon } from "@/components/dashboard/support-chat-link.client";
import { getSupportWhatsAppUrl } from "@/lib/constants";

/**
 * "Didn't find a suitable template?" at the end of the Templates gallery:
 * opens Tallaby support on WhatsApp with a message naming the store. It sits
 * after the grid on purpose, so sellers browse the templates first (the F-77
 * request banner above the gallery is hidden for that reason, owner 2026-11-07).
 */
export async function CustomThemeCta({ storeName }: { storeName: string | null | undefined }) {
  const t = await getTranslations("websiteTemplates.customTheme");
  const name = storeName?.trim();
  const href = getSupportWhatsAppUrl(name ? t("message", { store: name }) : t("messageNoStore"));

  return (
    <aside className="flex items-center justify-between gap-4 rounded-[22px] border-[1.5px] border-dashed border-(--s-whatsapp-line) bg-(--s-whatsapp-soft) px-5 py-4 max-[600px]:flex-col max-[600px]:items-stretch max-[600px]:gap-3 max-[600px]:px-4">
      <div className="flex min-w-0 flex-col gap-0.5 text-start">
        <h2 className="text-[15px] font-bold text-(--s-whatsapp-ink)">{t("title")}</h2>
        <p className="text-[13px] text-(--s-whatsapp-sub)">{t("body")}</p>
      </div>
      <SellerButton asChild variant="whatsapp">
        <a href={href} target="_blank" rel="noopener noreferrer">
          <WhatsAppIcon />
          {t("button")}
        </a>
      </SellerButton>
    </aside>
  );
}
