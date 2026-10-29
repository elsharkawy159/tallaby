import { siFacebook, siInstagram, siPinterest, siThreads, siTiktok, siWhatsapp, siX, siYoutube } from "simple-icons";
import { getTranslations } from "next-intl/server";
import { Button } from "@workspace/ui/components/button";
import { TALLABY_SOCIAL_LINKS, TALLABY_WHATSAPP_CHANNEL_URL } from "@/lib/constants";
import { BrandIcon, HomeCard } from "./home-ui";

const SOCIALS: { key: keyof typeof TALLABY_SOCIAL_LINKS; label: string; path: string }[] = [
  { key: "instagram", label: "Instagram", path: siInstagram.path },
  { key: "facebook", label: "Facebook", path: siFacebook.path },
  { key: "tiktok", label: "TikTok", path: siTiktok.path },
  { key: "youtube", label: "YouTube", path: siYoutube.path },
  { key: "x", label: "X", path: siX.path },
  { key: "threads", label: "Threads", path: siThreads.path },
  { key: "pinterest", label: "Pinterest", path: siPinterest.path },
];

/** Tallaby's WhatsApp channel and social accounts. */
export async function CommunityCard() {
  const t = await getTranslations("home.community");
  return (
    <HomeCard
      aria-labelledby="community-title"
      className="grid grid-cols-1 overflow-hidden lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]"
    >
      <div className="flex flex-wrap items-center gap-4 p-[22px]">
        <span className="flex size-[52px] shrink-0 items-center justify-center rounded-[14px] bg-[#1fa855]/15 text-[#1fa855]">
          <BrandIcon path={siWhatsapp.path} className="size-[26px]" />
        </span>
        <div className="min-w-[220px] flex-1">
          <h2 id="community-title" className="text-base font-bold leading-normal">
            {t("title")}
          </h2>
          <p className="mt-0.5 text-pretty text-[13px] text-muted-foreground">{t("description")}</p>
        </div>
        <Button asChild className="h-[42px] rounded-xl bg-[#1fa855] px-[18px] text-white hover:bg-[#1fa855]/90">
          <a href={TALLABY_WHATSAPP_CHANNEL_URL} target="_blank" rel="noopener noreferrer">
            <BrandIcon path={siWhatsapp.path} className="size-4" />
            {t("join")}
          </a>
        </Button>
      </div>
      <div className="flex flex-col justify-center gap-3 border-t bg-muted/50 p-[22px] lg:border-s lg:border-t-0">
        <div>
          <b className="text-sm font-semibold">{t("socialTitle")}</b>
          <small className="block text-xs text-muted-foreground">{t("socialDescription")}</small>
        </div>
        <nav className="flex flex-wrap gap-2" aria-label={t("socialTitle")}>
          {SOCIALS.map((social) => (
            <a
              key={social.key}
              href={TALLABY_SOCIAL_LINKS[social.key]}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={social.label}
              title={social.label}
              className="flex size-[42px] items-center justify-center rounded-xl border bg-card text-primary-ink transition-[border-color,transform] hover:-translate-y-0.5 hover:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
            >
              <BrandIcon path={social.path} className="size-[18px]" />
            </a>
          ))}
        </nav>
      </div>
    </HomeCard>
  );
}
