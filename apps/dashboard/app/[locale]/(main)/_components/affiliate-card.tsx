import { HandCoins } from "lucide-react";
import { getLocale, getTranslations } from "next-intl/server";
import {
  REFERRAL_SIGNUP_BONUS_PIASTRES,
  REFERRAL_SIGNUP_BONUS_THRESHOLD_USD_CENTS,
  fromPiastres,
} from "@workspace/lib/referrals";
import { Link } from "@/i18n/navigation";
import { SellerButton } from "@/components/seller-ui";
import { formatMoney } from "@/lib/i18n/format";

/**
 * The affiliate program on the home page (ROADMAP.md F-37h, owner 2026-11-16):
 * EGP 100 per invited seller who tops up $5, linking to /earn. Same dark teal
 * and amber as the /earn hero. Amounts come from the referral rules, never typed.
 */
export async function AffiliateCard() {
  const [t, locale] = await Promise.all([
    getTranslations("home.affiliate"),
    getLocale(),
  ]);
  const bonusAmount = Math.round(REFERRAL_SIGNUP_BONUS_PIASTRES / 100);
  const bonus = formatMoney(
    fromPiastres(REFERRAL_SIGNUP_BONUS_PIASTRES),
    locale,
  );
  const usd = REFERRAL_SIGNUP_BONUS_THRESHOLD_USD_CENTS / 100;

  return (
    // Always dark, in both themes, like the /earn hero.
    <section
      aria-labelledby="affiliate-title"
      className="relative grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-4 overflow-hidden rounded-[22px] bg-(--tallaby-teal-900) px-[22px] py-[18px] text-white max-[720px]:grid-cols-[auto_minmax(0,1fr)] max-[600px]:px-4"
    >
      <span
        aria-hidden
        className="pointer-events-none absolute -inset-y-1/2 end-[-10%] start-[55%] bg-[radial-gradient(50%_50%_at_50%_40%,rgb(253_173_40/.22),transparent_70%)]"
      />
      <div
        aria-hidden
        className="relative grid size-[58px] shrink-0 place-items-center rounded-full border border-white/10 bg-white/5 text-center"
      >
        <b
          dir="ltr"
          className="block font-montserrat text-lg font-extrabold leading-none text-(--tallaby-amber-600)"
        >
          {bonusAmount} {t("unit")}
        </b>
      </div>
      <div className="relative min-w-0">
        <h2 id="affiliate-title" className="text-[15px] font-bold">
          {t("title")}
        </h2>
        <p className="text-pretty text-[13px] text-[#c6d8dc]">
          {t("description", { bonus, usd })}
        </p>
      </div>
      <SellerButton
        asChild
        size="sm"
        className="relative max-[720px]:col-span-full max-[720px]:w-full"
      >
        <Link href="/earn">
          <HandCoins aria-hidden />
          {t("cta")}
        </Link>
      </SellerButton>
    </section>
  );
}
