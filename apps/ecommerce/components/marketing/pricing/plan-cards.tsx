import { Check, Info } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { cn } from "@workspace/ui/lib/utils";
import { Reveal } from "@/components/marketing/site/reveal.client";
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
 */
export async function PlanCards() {
  const t = await getTranslations("pricing.plans");
  const { free, pro } = PLAN_PRICES;

  // F-84: stores take orders from day one; the first top-up keeps new orders
  // visible after the grace window and unlocks campaigns. EGP at the live rate.
  // `{days}` (ORDER_GRACE_DAYS) comes with PRICE_TOKENS.
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
      tone: "outline" as const,
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
      name: "Pro",
      latinName: true,
      tagline: t("proTagline"),
      cents: pro.monthlyCents,
      per: t("perMonth"),
      note: t("proNote"),
      activation: null,
      cta: t("proCta"),
      tone: "amber" as const,
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
          <Reveal
            as="article"
            key={card.name}
            className={cn(
              "relative flex flex-col gap-3.5 rounded-card border border-line bg-white p-6 shadow-soft min-[641px]:rounded-card-lg min-[641px]:p-8",
              card.ribbon && "border-teal-900 shadow-raise",
            )}
          >
            {card.ribbon ? (
              <span className="absolute -top-3 start-6 max-w-[calc(100%-48px)] rounded-full bg-teal-900 px-3 py-0.5 text-xs font-bold text-white min-[641px]:start-8">{card.ribbon}</span>
            ) : null}
            <div>
              <h3 className={cn("text-[22px] font-bold text-teal-900", card.latinName && "font-latin")}>{card.name}</h3>
              <p className="text-sm text-ink-500">{card.tagline}</p>
            </div>
            <PlanPrice cents={card.cents} per={card.per} note={card.note} />
            {card.activation ? (
              <p className="m-0 flex items-start gap-1.5 text-[12.5px] leading-relaxed text-pretty text-ink-500">
                <Info className="mt-0.5 size-3.5 flex-none" aria-hidden />
                <span>{card.activation}</span>
              </p>
            ) : null}
            <SignupTrigger tone={card.tone} plan={card.plan === "pro" ? "pro" : undefined} className="w-full">
              {card.cta}
            </SignupTrigger>
            <ul className="m-0 mt-1 flex list-none flex-col gap-2.5 p-0 text-[14.5px] text-ink-700">
              {card.features.map((feature) => (
                <li key={feature} className="flex items-start gap-2.5">
                  <Check className="mt-1 size-4 flex-none text-[#16a34a]" aria-hidden />
                  {feature}
                </li>
              ))}
            </ul>
          </Reveal>
        ))}
      </div>
      <p className="mx-auto mt-6 max-w-[720px] text-center text-xs text-pretty text-ink-400">{t("fx")}</p>
    </>
  );
}
