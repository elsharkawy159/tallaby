"use client";

import { useTranslations } from "next-intl";
import { ArrowUpRight, Brain, ChevronDown, Lightbulb, Mail, Search, ShieldCheck, ShoppingBag, Sparkles, Store, Truck } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { IconTile, Note, Tag } from "@/components/seller-ui";
import { DOMAIN_BENEFITS, SORTED_DOMAIN_PROVIDERS, type DomainBenefit } from "./domain-providers.lib";

const BENEFIT_ICONS: Record<DomainBenefit, LucideIcon> = {
  remember: Brain,
  trust: ShieldCheck,
  brand: Store,
  seo: Search,
  keep: Truck,
  email: Mail,
};

/**
 * Website › Domain & SEO › Domain (ROADMAP.md F-78): why to use your own
 * domain and where to buy one. Open while the store has no custom domain,
 * folded (still openable) once one is added.
 */
export function DomainBuyGuide({ hasDomain }: { hasDomain: boolean }) {
  const t = useTranslations("domainSeo.domain.buy");

  return (
    <details
      id="buy-domain"
      open={!hasDomain}
      className="group min-w-0 scroll-mt-24 rounded-[24px] border border-(--s-line) bg-(--s-glass) px-6 pb-6 pt-[22px] text-(--s-body) shadow-(--s-shadow-card) max-[720px]:px-4 max-[720px]:pb-5 max-[720px]:pt-[18px] max-[600px]:rounded-[20px] [&:not([open])]:pb-[22px] max-[720px]:[&:not([open])]:pb-[18px]"
    >
      <summary className="flex cursor-pointer list-none items-start gap-3.5 max-[720px]:gap-2.5 [&::-webkit-details-marker]:hidden">
        <IconTile icon={Sparkles} className="max-[720px]:size-[34px]" />
        <span className="min-w-0 flex-1">
          <span className="flex flex-wrap items-center gap-2 text-[16.5px] font-bold leading-normal text-(--s-ink)">{t("title")}</span>
          <span className="block text-pretty text-[13px] text-(--s-subtle)">{t("description")}</span>
        </span>
        <ChevronDown
          className="mt-1.5 size-[17px] shrink-0 text-(--s-primary) transition-transform duration-[250ms] group-open:rotate-180"
          aria-hidden
        />
      </summary>

      <div className="mt-[18px] flex flex-col gap-[18px] max-[720px]:mt-4 max-[720px]:gap-4">
        <section aria-labelledby="buy-domain-why" className="flex flex-col gap-2.5">
          <h3 id="buy-domain-why" className="text-sm font-bold text-(--s-ink)">
            {t("whyTitle")}
          </h3>
          <ul className="grid grid-cols-2 gap-2.5 max-[720px]:grid-cols-1">
            {DOMAIN_BENEFITS.map((key) => {
              const Icon = BENEFIT_ICONS[key];
              return (
                <li key={key} className="flex items-start gap-2.5 rounded-2xl bg-(--s-tint) p-3 text-[12.5px] leading-[1.6] text-(--s-muted)">
                  <Icon className="mt-0.5 size-4 shrink-0 text-(--s-primary)" aria-hidden />
                  <span className="min-w-0">
                    <b className="block font-bold text-(--s-text)">{t(`benefits.${key}.title`)}</b>
                    {t(`benefits.${key}.body`)}
                  </span>
                </li>
              );
            })}
          </ul>
        </section>

        <section aria-labelledby="buy-domain-where" className="flex flex-col gap-2.5">
          <h3 id="buy-domain-where" className="flex items-center gap-2 text-sm font-bold text-(--s-ink)">
            <ShoppingBag className="size-4 text-(--s-primary)" aria-hidden />
            {t("whereTitle")}
          </h3>
          <ul className="flex flex-col overflow-hidden rounded-2xl border border-(--s-line-soft)">
            {SORTED_DOMAIN_PROVIDERS.map((p) => (
              <li key={p.id} className="[&+&]:border-t [&+&]:border-(--s-line-soft)">
                <a
                  href={p.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex min-h-12 items-center gap-3 px-3.5 py-2.5 transition-colors duration-150 hover:bg-(--s-tint) focus-visible:bg-(--s-tint) focus-visible:outline-none"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element -- tiny static logo */}
                  <img
                    src={p.logo}
                    alt=""
                    width={32}
                    height={32}
                    loading="lazy"
                    className="size-8 shrink-0 rounded-lg border border-(--s-line-soft) bg-white object-contain p-0.5"
                  />
                  <span className="min-w-0 flex-1">
                    <span className="flex flex-wrap items-center gap-2 text-sm font-bold text-(--s-text)">
                      <bdi dir="ltr" className="font-montserrat">
                        {p.name}
                      </bdi>
                      {p.paysInEgp && <Tag tone="success">{t("paysInEgp")}</Tag>}
                    </span>
                    <small className="block text-pretty text-xs text-(--s-subtle)">{t(`providers.${p.id}`)}</small>
                  </span>
                  <ArrowUpRight className="size-4 shrink-0 text-(--s-faint) rtl:-scale-x-100" aria-hidden />
                  <span className="sr-only">{t("opensNewTab")}</span>
                </a>
              </li>
            ))}
          </ul>
          <p className="text-pretty text-xs text-(--s-faint)">{t("disclaimer")}</p>
        </section>

        <Note icon={Lightbulb}>{t("afterBuying")}</Note>
      </div>
    </details>
  );
}
