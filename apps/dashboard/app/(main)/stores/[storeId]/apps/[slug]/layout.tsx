import Link from "next/link";
import { notFound } from "next/navigation";
import { getLocale, getTranslations } from "next-intl/server";
import { ChevronLeft } from "lucide-react";
import { APP_DEVELOPERS, appPaths, getAppBySlug, localize } from "@workspace/apps";
import { getStoreApp } from "@workspace/lib/integrations";
import { PageContainer, PageTabs, Tag, TextAction } from "@/components/seller-ui";
import { AppLogo } from "../app-logo";
import { AppStateBadge } from "../app-center.client";
import { loadAppCenterPage } from "../app-center.data";
import { appState } from "../app-center.lib";

/**
 * Store › App Center › <app> (ROADMAP.md F-93): the app's header and its
 * Overview / Settings tabs. `slug` comes from the registry; an unknown one is
 * a 404. The store is the session seller's (loadStorePage, rule 5).
 */
export default async function AppLayout({ params, children }: { params: Promise<{ storeId: string; slug: string }>; children: React.ReactNode }) {
  const { storeId, slug } = await params;
  const manifest = getAppBySlug(slug);
  if (!manifest) notFound();
  const [{ store, state }, locale, t] = await Promise.all([loadAppCenterPage(storeId), getLocale(), getTranslations("appCenter")]);
  const current = appState(getStoreApp(manifest.id)!, state);
  const developer = localize(APP_DEVELOPERS[manifest.developer].name, locale);

  return (
    <PageContainer className="max-w-[1080px]">
      <header className="flex flex-col items-start gap-3">
        <TextAction asChild className="-ms-2.5 max-[600px]:min-h-10">
          <Link href={appPaths.center(store.id)}>
            <ChevronLeft className="rtl:rotate-180" aria-hidden />
            {t("detail.back")}
          </Link>
        </TextAction>
        <div className="flex w-full flex-wrap items-center gap-4">
          <AppLogo app={manifest.id} connected={current.connected && !current.failing} className="size-16 rounded-[20px] max-[600px]:size-14 max-[600px]:rounded-[18px]" />
          <div className="min-w-0 flex-1 basis-[220px]">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-[clamp(22px,2.4vw,28px)] font-bold leading-[1.3] text-(--s-ink)">{localize(manifest.name, locale)}</h1>
              <AppStateBadge badge={current.badge} />
              {manifest.status === "beta" && <Tag tone="info">{t("status.beta")}</Tag>}
            </div>
            <p className="mt-1 text-[13.5px] text-(--s-muted)">
              <bdi>{localize(manifest.vendor, locale)}</bdi>
              <span aria-hidden> · </span>
              {t(`kind.${manifest.kind}`)}
              <span aria-hidden> · </span>
              {t("byDeveloper", { developer })}
            </p>
          </div>
        </div>
      </header>

      {manifest.settingsRoute && (
        <PageTabs
          label={localize(manifest.name, locale)}
          className="self-start max-[720px]:self-stretch"
          tabs={[
            { key: "overview", label: t("detail.overview"), href: appPaths.detail(store.id, manifest) },
            { key: "settings", label: t("detail.settings"), href: appPaths.settings(store.id, manifest) },
          ]}
        />
      )}

      {children}
    </PageContainer>
  );
}
