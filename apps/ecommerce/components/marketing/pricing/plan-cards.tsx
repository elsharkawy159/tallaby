import { Check } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { cn } from "@workspace/ui/lib/utils";
import { Num } from "@/components/marketing/site/layout-primitives";
import { Reveal } from "@/components/marketing/site/reveal.client";
import { SignupTrigger } from "@/components/marketing/signup/signup-trigger.client";
import { APPROX_EGP_PER_USD, PLAN_PRICES, formatNumber, formatUsd } from "@/lib/marketing/pricing.lib";

/**
 * The Free and Pro cards, on the home page and /pricing. Every number comes
 * from the code (`@workspace/lib/plans`, `@workspace/lib/billing`).
 */
export async function PlanCards() {
  const t = await getTranslations("pricing.plans");
  const { free, pro } = PLAN_PRICES;
  const egp = (usdCents: number, digits = 0) =>
    ((usdCents / 100) * APPROX_EGP_PER_USD).toLocaleString("en-US", { minimumFractionDigits: digits, maximumFractionDigits: digits });

  const cards = [
    {
      name: t("freeName"),
      latinName: false,
      tagline: t("freeTagline"),
      price: formatUsd(free.orderFeeCents),
      per: t("perOrder"),
      approx: t("freeApprox", { egp: egp(free.orderFeeCents, 1) }),
      cta: t("freeCta"),
      tone: "outline" as const,
      features: [
        t("featureUnlimited"),
        t("featureVisits"),
        t("featureCredits", { count: formatNumber(free.aiCredits) }),
        t("featureEmails", { count: formatNumber(free.emails) }),
        t("featureShared"),
        t("featureAll"),
      ],
    },
    {
      name: "Pro",
      latinName: true,
      tagline: t("proTagline"),
      price: formatUsd(pro.monthlyCents),
      per: t("perMonth"),
      approx: t("proApprox", { egp: egp(pro.monthlyCents) }),
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
              <p className="text-sm text-[#5f7277]">{card.tagline}</p>
            </div>
            <div className="flex flex-wrap items-baseline gap-2">
              <Num dir="ltr" className="text-[44px] leading-none font-extrabold text-teal-900 min-[641px]:text-[54px]">
                {card.price}
              </Num>
              <span className="text-[15px] font-semibold text-ink-500">{card.per}</span>
            </div>
            <p className="text-[13px] text-ink-500">{card.approx}</p>
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
      <p className="mx-auto mt-6 max-w-[720px] text-center text-[13.5px] text-pretty text-[#56696e]">
        {t("plainly", { topUp: formatUsd(PLAN_PRICES.topUp.minCents) })}
      </p>
      <p className="mt-2 text-center text-xs text-ink-400">{t("fx", { rate: APPROX_EGP_PER_USD })}</p>
    </>
  );
}
