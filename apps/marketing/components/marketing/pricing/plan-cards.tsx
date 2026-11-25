import { Check, Info } from "lucide-react";
import { getLocale, getTranslations } from "next-intl/server";
import { cn } from "@workspace/ui/lib/utils";
import { Reveal } from "@/components/marketing/site/reveal.client";
import { TopUpCopy } from "@/components/marketing/site/top-up-copy.client";
import { SignupTrigger } from "@/components/marketing/signup/signup-trigger.client";
import { PLAN_PRICES, PRICE_TOKENS, formatNumber } from "@/lib/marketing/pricing.lib";
import { PlanPrice } from "./plan-price.client";
import { withPrices } from "./with-prices";

/**
 * The Free and Pro cards, on the home page and /pricing. Every number comes
 * from the code (`@workspace/lib/plans`, `@workspace/lib/billing`). Prices
 * show in the visitor's currency (owner, 2026-11-09; no "$" amount), formatted
 * by `PlanPrice` from `VisitorPricesProvider`'s rates: EGP on the Arabic
 * server render (the dashboard wallet's live rate and rounding), USD on the
 * English one, then the visitor's own currency when we have a rate for it.
 * The pages stay static.
 *
 * `reveal={false}` where the cards are above the fold (/pricing): a `Reveal`
 * keeps them at opacity 0 until hydration, which made them the page's late LCP.
 */
export async function PlanCards({ reveal = true }: { reveal?: boolean } = {}) {
  const Card = reveal ? Reveal : "article";
  const [t, locale] = await Promise.all([getTranslations("pricing.plans"), getLocale()]);
  const { free, pro } = PLAN_PRICES;

  // F-84i: stores take orders from day one; orders stay hidden until the first
  // top-up, and every store goes offline when the trial days end without one.
  // EGP at the live rate. `{days}` (ORDER_GRACE_DAYS_SHORT) comes with PRICE_TOKENS.
  const activation = withPrices(t("freeActivation", PRICE_TOKENS));

  const cards = [
    {
      plan: "free" as const,
      name: t("freeName"),
      latinName: false,
      tagline: t("freeTagline"),
      cents: free.orderFeeCents,
      per: t("perOrder"),
      note: t("freeNote"),
      activation,
      cta: t("freeCta"),
      // The most used plan (owner, 2026-11-16): the highlighted card, in the brand colour.
      tone: "amber" as const,
      featured: true,
      ribbon: t("freeRibbon"),
      features: [
        t("featureUnlimited"),
        t("featureVisits"),
        t("featureCredits", { count: formatNumber(free.aiCredits) }),
        t("featureEmails", { count: formatNumber(free.emails) }),
        t("featureShared"),
        t("featureOrderEmail"),
        t("featureAll"),
      ],
    },
    {
      plan: "pro" as const,
      name: t("proName"),
      latinName: locale === "en",
      tagline: t("proTagline"),
      cents: pro.monthlyCents,
      per: t("perMonth"),
      note: t("proNote"),
      activation: null,
      cta: t("proCta"),
      tone: "teal" as const,
      featured: false,
      ribbon: t("proRibbon"),
      features: [
        t("featureEverything"),
        t("featureCredits", { count: formatNumber(pro.aiCredits) }),
        t("featureEmails", { count: formatNumber(pro.emails) }),
        t("featureShared"),
        t("featureNoFee"),
      ],
    },
  ];

  return (
    <>
      <div className="mx-auto grid max-w-[520px] gap-5 min-[861px]:max-w-[880px] min-[861px]:grid-cols-2">
        {cards.map((card) => (
          <Card
            {...(reveal ? { as: "article" } : {})}
            key={card.name}
            className={cn(
              "relative flex flex-col gap-3.5 rounded-card border p-6 min-[641px]:rounded-card-lg min-[641px]:p-8",
              card.featured ? "border-teal-900 bg-teal-900 text-white shadow-raise" : "border-line bg-white shadow-soft",
            )}
          >
            {/* One child: Reveal passes its children on as a prop array, which made React ask for keys. */}
            <>
              {card.ribbon ? (
                <span
                  className={cn(
                    "absolute -top-3 start-6 max-w-[calc(100%-48px)] rounded-full px-3 py-0.5 text-xs font-bold min-[641px]:start-8",
                    card.featured ? "bg-amber-600 text-teal-900" : "bg-teal-900 text-white",
                  )}
                >
                  {card.ribbon}
                </span>
              ) : null}
              <div>
                <h3 className={cn("text-[22px] font-bold", card.featured ? "text-white" : "text-teal-900", card.latinName && "font-latin")}>{card.name}</h3>
                <p className={cn("text-sm", card.featured ? "text-white/75" : "text-ink-500")}>{card.tagline}</p>
              </div>
              <PlanPrice cents={card.cents} per={card.per} note={card.note} inverted={card.featured} />
              {card.activation ? (
                <p className={cn("m-0 flex items-start gap-1.5 text-[12.5px] leading-relaxed text-pretty", card.featured ? "text-white/75" : "text-ink-500")}>
                  <Info className="mt-0.5 size-3.5 flex-none" aria-hidden />
                  <span>{card.activation}</span>
                </p>
              ) : null}
              <SignupTrigger tone={card.tone} plan={card.plan === "pro" ? "pro" : undefined} className="w-full">
                {card.cta}
              </SignupTrigger>
              <ul className={cn("m-0 mt-1 flex list-none flex-col gap-2.5 p-0 text-[14.5px]", card.featured ? "text-white/90" : "text-ink-700")}>
                {card.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-2.5">
                    <Check className={cn("mt-1 size-4 flex-none", card.featured ? "text-amber-500" : "text-[#16a34a]")} aria-hidden />
                    {feature}
                  </li>
                ))}
              </ul>
            </>
          </Card>
        ))}
      </div>
      <p className="mx-auto mt-6 max-w-[720px] text-center text-xs text-pretty text-ink-400">
        <TopUpCopy egp={t("fx")} usdCard={t("fxOutsideEgypt")} />
      </p>
    </>
  );
}
