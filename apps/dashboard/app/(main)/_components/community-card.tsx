import { siFacebook, siInstagram, siPinterest, siThreads, siTiktok, siWhatsapp, siX, siYoutube } from "simple-icons";
import { getTranslations } from "next-intl/server";
import { SellerButton, SellerCard } from "@/components/seller-ui";
import { TALLABY_SOCIAL_LINKS, TALLABY_WHATSAPP_CHANNEL_URL } from "@/lib/constants";
import { BrandIcon } from "./home-ui";

const SOCIALS: { key: keyof typeof TALLABY_SOCIAL_LINKS; label: string; path: string }[] = [
  { key: "instagram", label: "Instagram", path: siInstagram.path },
  { key: "facebook", label: "Facebook", path: siFacebook.path },
  { key: "tiktok", label: "TikTok", path: siTiktok.path },
  { key: "youtube", label: "YouTube", path: siYoutube.path },
  { key: "x", label: "X", path: siX.path },
  { key: "threads", label: "Threads", path: siThreads.path },
  { key: "pinterest", label: "Pinterest", path: siPinterest.path },
];

/** Tallaby's WhatsApp channel and social accounts (`.com`), the end of the home page. */
export async function CommunityCard() {
  const t = await getTranslations("home.community");
  return (
    <SellerCard
      aria-labelledby="community-title"
      className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-5 px-[22px] py-[18px] max-[1180px]:grid-cols-1 max-[600px]:px-4"
    >
      <div className="flex items-center gap-3.5">
        <span className="grid size-[46px] shrink-0 place-items-center rounded-[15px] bg-success-soft text-(--s-whatsapp)">
          <BrandIcon path={siWhatsapp.path} className="size-[22px]" />
        </span>
        <div className="min-w-0">
          <h2 id="community-title" className="text-[14.5px] font-bold text-(--s-ink)">
            {t("title")}
          </h2>
          <p className="text-pretty text-[12.5px] text-(--s-subtle)">{t("description")}</p>
        </div>
      </div>
      <div className="flex flex-wrap items-center justify-end gap-4 max-[1180px]:justify-start">
        <nav className="flex flex-wrap items-center gap-1.5" aria-label={t("socialTitle")}>
          <span className="me-1.5 whitespace-nowrap text-[12.5px] text-(--s-subtle)">{t("socialTitle")}</span>
          {SOCIALS.map((social) => (
            <a
              key={social.key}
              href={TALLABY_SOCIAL_LINKS[social.key]}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={social.label}
              title={social.label}
              className="grid size-9 place-items-center rounded-full border border-(--s-field) bg-(--s-surface) text-(--s-link) transition-colors duration-150 hover:border-(--s-solid) hover:bg-(--s-solid) hover:text-(--s-solid-fg) max-[600px]:size-10"
            >
              <BrandIcon path={social.path} className="size-4" />
            </a>
          ))}
        </nav>
        <SellerButton asChild variant="whatsapp" size="sm">
          <a href={TALLABY_WHATSAPP_CHANNEL_URL} target="_blank" rel="noopener noreferrer">
            <BrandIcon path={siWhatsapp.path} className="size-4" />
            {t("join")}
          </a>
        </SellerButton>
      </div>
    </SellerCard>
  );
}
