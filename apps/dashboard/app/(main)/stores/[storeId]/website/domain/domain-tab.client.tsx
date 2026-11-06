"use client";

import Link from "next/link";
import { useFormatter, useTranslations } from "next-intl";
import { ArrowRight, BadgeCheck, CornerDownLeft, History, Link2 } from "lucide-react";
import { storeHostname } from "@workspace/lib/storefront";
import { EmptyState, IconTile, Note, Row, Rows, SectionCard, Tag } from "@/components/seller-ui";
import type { CustomDomainView } from "@/actions/custom-domain";
import { CustomDomainCard } from "./custom-domain-card.client";
import { DomainBuyGuide } from "./domain-buy-guide.client";
import { StoreAddressCard } from "./store-address-card.client";

/**
 * Website › Domain & SEO › Domain (P4-14): the store's Tallaby address (any
 * store can change it), its custom domain (primary store only until P3-03b),
 * and the old addresses that still redirect here.
 */
export function DomainTab({
  store,
  customDomain,
  liveDomain,
  redirects,
  primaryStore,
}: {
  store: { id: string; subdomain: string; isPrimary: boolean; readOnly: boolean };
  customDomain: CustomDomainView | null;
  liveDomain: string | null;
  redirects: { subdomain: string; createdAt: string }[];
  primaryStore: { id: string; name: string } | null;
}) {
  const t = useTranslations("domainSeo.domain");
  const format = useFormatter();

  return (
    <>
      {store.readOnly && <Note>{t("readOnly")}</Note>}

      <SectionCard id="address" icon={Link2} title={t("address.title")} description={t("address.description")}>
        <StoreAddressCard storeId={store.id} initialSubdomain={store.subdomain} customDomain={liveDomain} readOnly={store.readOnly} />
      </SectionCard>

      {store.isPrimary ? (
        <>
          <CustomDomainCard storeId={store.id} initial={customDomain} readOnly={store.readOnly} />
          <DomainBuyGuide hasDomain={Boolean(customDomain)} />
        </>
      ) : (
        <SectionCard
          id="custom-domain"
          icon={BadgeCheck}
          title={
            <>
              {t("custom.title")}
              <Tag>{t("custom.primaryOnlyBadge")}</Tag>
            </>
          }
          description={t("custom.description")}
        >
          <Note>
            {t("custom.primaryOnly")}
            {primaryStore && (
              <Link href={`/stores/${primaryStore.id}/website/domain`} className="ms-1.5 inline-flex items-center gap-1 text-(--s-link)">
                {t("custom.openPrimary", { store: primaryStore.name })}
                <ArrowRight className="size-3.5 rtl:-scale-x-100" aria-hidden />
              </Link>
            )}
          </Note>
        </SectionCard>
      )}

      <SectionCard id="redirects" icon={History} title={t("redirects.title")} description={t("redirects.description")}>
        <Rows>
          {redirects.length === 0 ? (
            <EmptyState description={t("redirects.empty")} title="" className="py-[18px]" />
          ) : (
            redirects.map((r) => (
              <Row
                key={r.subdomain}
                start={<IconTile icon={CornerDownLeft} className="size-[34px]" />}
                title={
                  <bdi dir="ltr" className="min-w-0 truncate font-montserrat text-[13px]">
                    {storeHostname(r.subdomain)}
                  </bdi>
                }
                description={
                  <>
                    <bdi dir="ltr" className="font-montserrat">
                      {storeHostname(store.subdomain, liveDomain)}
                    </bdi>
                    {" · "}
                    {t("redirects.since", { date: format.dateTime(new Date(r.createdAt), { dateStyle: "medium" }) })}
                  </>
                }
              />
            ))
          )}
        </Rows>
      </SectionCard>
    </>
  );
}
