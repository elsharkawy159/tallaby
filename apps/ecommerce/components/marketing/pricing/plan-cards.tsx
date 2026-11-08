import { Check } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { cn } from "@workspace/ui/lib/utils";
import { Reveal } from "@/components/marketing/site/reveal.client";
import { SignupTrigger } from "@/components/marketing/signup/signup-trigger.client";
import { getMarketingUsdRates } from "@/lib/marketing/exchange-rate.server";
import { LOCAL_CURRENCIES, formatLocalAmount, formatRate } from "@/lib/marketing/local-currency.lib";
import { PLAN_PRICES, formatNumber, formatUsd } from "@/lib/marketing/pricing.lib";
import { LocalCurrencyProvider, PlanFxNote, PlanPrice, type LocalPrice, type PlanKey } from "./plan-price.client";

/**
 * The Free and Pro cards, on the home page and /pricing. Every number comes
 * from the code (`@workspace/lib/plans`, `@workspace/lib/billing`). The price
 * shows in the visitor's currency with USD under it (owner, 2026-11-08): EGP
 * on the server render, with the dashboard wallet's live rate and rounding,
 * then the client swaps it by the visitor's country. The pages stay static.
 */
export async function PlanCards() {
  const [t, rates] = await Promise.all([getTranslations("pricing.plans"), getMarketingUsdRates()]);
  const { free, pro } = PLAN_PRICES;
  const cents: Record<PlanKey, number> = { free: free.orderFeeCents, pro: pro.monthlyCents };

  const prices: Record<string, LocalPrice> = {};
  for (const code of LOCAL_CURRENCIES) {
    const rate = rates[code];
    if (!rate) continue;
    const label = t(`currency.${code}` as "currency.EGP");
    prices[code] = {
      label,
      fx: t("fx", { rate: formatRate(rate), currency: label }),
      amounts: { free: formatLocalAmount(cents.free, code, rate), pro: formatLocalAmount(cents.pro, code, rate) },
    };
  }

  const cards = [
    {
      plan: "free" as const,
      name: t("freeName"),
      latinName: false,
      tagline: t("freeTagline"),
      price: formatUsd(free.orderFeeCents),
      per: t("perOrder"),
      note: t("freeNote"),
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
      price: formatUsd(pro.monthlyCents),
      per: t("perMonth"),
      note: t("proNote"),
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
    <LocalCurrencyProvider prices={prices}>
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
              <p className="text-sm text-[#5f7277]">{card.tagline}</p>
            </div>
            <PlanPrice plan={card.plan} usd={card.price} per={card.per} note={card.note} />
            <SignupTrigger tone={card.tone} className="w-full">
              {card.cta}
            </SignupTrigger>
            <ul className="m-0 mt-1 flex list-none flex-col gap-2.5 p-0 text-[14.5px] text-[#33464b]">
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
      <PlanFxNote className="mx-auto mt-6 max-w-[720px] text-center text-xs text-pretty text-ink-400" />
    </LocalCurrencyProvider>
  );
}
