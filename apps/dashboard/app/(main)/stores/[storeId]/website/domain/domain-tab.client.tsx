"use client";

import Link from "next/link";
import { useFormatter, useTranslations } from "next-intl";
import { ArrowRight, CornerDownLeft, Globe, History, Link2 } from "lucide-react";

import { Badge } from "@workspace/ui/components/badge";
import { storeHostname } from "@workspace/lib/storefront";
import { FieldHint, SectionCard } from "@/components/form/form-ui";
import { StoreLinkSection } from "@/app/(main)/settings/store-link.client";
import { CustomDomainSection } from "@/app/(main)/settings/custom-domain.client";
import type { CustomDomainView } from "@/actions/custom-domain";

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
    <div className="space-y-5">
      {store.readOnly && (
        <p className="rounded-lg border bg-muted/40 px-4 py-3 text-sm text-muted-foreground">{t("readOnly")}</p>
      )}

      <SectionCard id="address" icon={Link2} title={t("address.title")} description={t("address.description")}>
        <StoreLinkSection
          storeId={store.id}
          initialSubdomain={store.subdomain}
          customDomain={liveDomain}
          readOnly={store.readOnly}
        />
      </SectionCard>

      <SectionCard
        id="custom-domain"
        icon={Globe}
        title={t("custom.title")}
        description={t("custom.description")}
        tag={store.isPrimary ? undefined : <Badge variant="muted">{t("custom.primaryOnlyBadge")}</Badge>}
      >
        {store.isPrimary ? (
          <CustomDomainSection storeId={store.id} initial={customDomain} />
        ) : (
          <div className="flex flex-col gap-2">
            <FieldHint>{t("custom.primaryOnly")}</FieldHint>
            {primaryStore && (
              <Link
                href={`/stores/${primaryStore.id}/website/domain`}
                className="inline-flex items-center gap-1 self-start text-xs font-medium text-primary-ink hover:underline"
              >
                {t("custom.openPrimary", { store: primaryStore.name })}
                <ArrowRight className="size-3.5 rtl:-scale-x-100" aria-hidden />
              </Link>
            )}
          </div>
        )}
      </SectionCard>

      <SectionCard id="redirects" icon={History} title={t("redirects.title")} description={t("redirects.description")}>
        {redirects.length === 0 ? (
          <FieldHint>{t("redirects.empty")}</FieldHint>
        ) : (
          <ul className="divide-y rounded-xl border">
            {redirects.map((r) => (
              <li key={r.subdomain} className="flex flex-wrap items-center gap-x-3 gap-y-1 px-4 py-3 text-[13px]">
                <span dir="ltr" className="font-mono text-muted-foreground line-through decoration-muted-foreground/40">
                  {storeHostname(r.subdomain)}
                </span>
                <CornerDownLeft className="size-3.5 text-muted-foreground rtl:-scale-x-100" aria-hidden />
                <span dir="ltr" className="font-mono">
                  {storeHostname(store.subdomain, liveDomain)}
                </span>
                <span className="ms-auto text-xs text-muted-foreground">
                  {t("redirects.since", { date: format.dateTime(new Date(r.createdAt), { dateStyle: "medium" }) })}
                </span>
              </li>
            ))}
          </ul>
        )}
      </SectionCard>
    </div>
  );
}
