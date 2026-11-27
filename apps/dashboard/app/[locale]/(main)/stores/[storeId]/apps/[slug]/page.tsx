import Image from "next/image";
import { notFound } from "next/navigation";
import { getLocale, getTranslations } from "next-intl/server";
import { BookOpen, Check, Link2, Rocket } from "lucide-react";
import { APP_DEVELOPERS, APPS, appPaths, getApp, getAppBySlug, localize } from "@workspace/apps";
import { getStoreApp } from "@workspace/lib/integrations";
import { Note, SellerCard } from "@/components/seller-ui";
import { AppActions, AppPrice } from "./app-actions.client";
import { AppPaymentMethods } from "./app-payment-methods";
import { loadAppCenterPage } from "../app-center.data";
import { appCanRemove, appPrimaryAction, appState } from "../app-center.lib";
import { appStartKind, appStartSteps } from "./app-start.lib";
import { OtherApps, type OtherApp } from "./other-apps.client";
import { pickOtherApps } from "./other-apps.lib";

// TODO: Cache Components adoption. Refactor this route so this opt-out can be removed.
// See: https://nextjs.org/docs/app/guides/migrating-to-cache-components
export const instant = false;

/**
 * Store › App Center › <app> › Overview (ROADMAP.md F-93): what it does, how to
 * start, its price and its main action, then a few apps this store has not
 * installed yet (owner, 2026-11-27).
 */
export default async function AppDetailPage({ params }: { params: Promise<{ storeId: string; slug: string }> }) {
  const { storeId, slug } = await params;
  const manifest = getAppBySlug(slug);
  if (!manifest) notFound();
  const [{ store, state, readOnly }, locale, t, tApps, tStart, tFeature] = await Promise.all([
    loadAppCenterPage(storeId),
    getLocale(),
    getTranslations("appCenter"),
    getTranslations("storeApps"),
    getTranslations("appDetail"),
    getTranslations("featurePageApp"),
  ]);
  const app = getStoreApp(manifest.id)!;
  const current = appState(app, state);
  const vendor = localize(manifest.vendor, locale);
  const bothPlans = manifest.plans.length >= 2;
  const name = localize(manifest.name, locale);
  const startKind = appStartKind(manifest, current);
  const startSteps = appStartSteps(startKind, Boolean(manifest.settingsRoute));
  // A handful of apps this store can add now, in random order (owner, 2026-11-27): not installed,
  // and not "Coming soon" (not available here, not a request-only app, not marked coming soon).
  const others: OtherApp[] = pickOtherApps(
    APPS.map((other) => ({ manifest: other, state: appState(getStoreApp(other.id)!, state) })).filter(
      (other) =>
        other.manifest.id !== manifest.id &&
        !other.state.installed &&
        other.state.available &&
        !other.state.requestable &&
        other.manifest.status !== "coming_soon",
    ),
  ).map(({ manifest: other, state: otherState }) => ({
    id: other.id,
    name: localize(other.name, locale),
    summary: localize(other.summary, locale),
    href: appPaths.detail(store.id, other),
    freeWithPro: otherState.freeWithPro,
  }));

  return (
    <>
    <div className="grid grid-cols-[minmax(0,1fr)_320px] items-start gap-5 max-[900px]:grid-cols-1">
      <div className="flex min-w-0 flex-col gap-4 max-[900px]:order-2">
        <SellerCard className="flex flex-col gap-4 p-6 max-[600px]:p-4">
          <p className="max-w-[68ch] text-pretty text-[14.5px] leading-[1.9] text-(--s-body)">{localize(manifest.description, locale)}</p>
          {manifest.requires.map((id) => {
            const needed = getApp(id);
            return needed ? (
              <Note key={id} icon={Link2}>
                {t("detail.requires", { app: localize(needed.name, locale) })}
              </Note>
            ) : null;
          })}
        </SellerCard>

        {manifest.highlights.length > 0 && (
          <SellerCard className="p-6 max-[600px]:p-4" aria-labelledby="app-does">
            <h2 id="app-does" className="mb-3 text-[15.5px] font-bold text-(--s-ink)">
              {t("detail.whatItDoes")}
            </h2>
            <ul className="flex flex-col gap-2.5">
              {manifest.highlights.map((line) => (
                <li key={line.en} className="flex items-start gap-2.5 text-[13.5px] leading-[1.7] text-(--s-body)">
                  <span className="mt-0.5 grid size-5 shrink-0 place-items-center rounded-full bg-success-soft text-success">
                    <Check className="size-3 stroke-[3]" aria-hidden />
                  </span>
                  {localize(line, locale)}
                </li>
              ))}
            </ul>
          </SellerCard>
        )}

        <SellerCard className="p-6 max-[600px]:p-4" aria-labelledby="app-start">
          <h2 id="app-start" className="mb-3 flex items-center gap-2 text-[15.5px] font-bold text-(--s-ink)">
            <Rocket className="size-4 text-(--s-primary)" aria-hidden />
            {tStart("start.title")}
          </h2>
          <ol className="flex flex-col gap-2.5">
            {startSteps.map((step, index) => (
              <li key={step} className="flex items-start gap-2.5 text-[13.5px] leading-[1.7] text-(--s-body)">
                <span className="mt-0.5 grid size-5 shrink-0 place-items-center rounded-full bg-(--s-surface-2) font-montserrat text-[11px] font-bold text-(--s-ink)">
                  {index + 1}
                </span>
                {tStart(`start.${startKind}.${step}`, {
                  app: name,
                  vendor,
                  where: manifest.opens ? tFeature(`pages.${manifest.opens}.where`) : "",
                  store: store.name,
                })}
              </li>
            ))}
          </ol>
        </SellerCard>

        <AppPaymentMethods methods={manifest.paymentMethods} vendor={vendor} />

        {manifest.surfaces.length > 0 && (
          <SellerCard className="p-6 max-[600px]:p-4" aria-labelledby="app-where">
            <h2 id="app-where" className="mb-3 text-[15.5px] font-bold text-(--s-ink)">
              {t("detail.worksOn")}
            </h2>
            <ul className="flex flex-wrap gap-2">
              {manifest.surfaces.map((surface) => (
                <li key={surface} className="rounded-full border border-(--s-line) bg-(--s-surface) px-3 py-1.5 text-[12.5px] font-semibold text-(--s-body)">
                  {t(`surface.${surface.replaceAll(".", "_")}`)}
                </li>
              ))}
            </ul>
          </SellerCard>
        )}

        {manifest.screenshots.length > 0 && (
          <SellerCard className="p-6 max-[600px]:p-4" aria-labelledby="app-shots">
            <h2 id="app-shots" className="mb-3 text-[15.5px] font-bold text-(--s-ink)">
              {t("detail.screenshots")}
            </h2>
            <div className="flex snap-x gap-3 overflow-x-auto pb-1">
              {manifest.screenshots.map((shot) => (
                <Image
                  key={shot.src}
                  src={shot.src}
                  alt={localize(shot.alt, locale)}
                  width={640}
                  height={400}
                  className="h-[220px] w-auto shrink-0 snap-start rounded-2xl border border-(--s-line) object-cover"
                />
              ))}
            </div>
          </SellerCard>
        )}
      </div>

      <aside className="flex flex-col gap-4 max-[900px]:order-1 min-[901px]:sticky min-[901px]:top-[88px]">
        <SellerCard className="flex flex-col gap-4 p-5">
          <p className="text-pretty text-[13px] leading-[1.7] text-(--s-muted)">{localize(manifest.summary, locale)}</p>
          <AppActions
            storeId={store.id}
            appId={manifest.id}
            name={name}
            action={appPrimaryAction(manifest, current)}
            canRemove={appCanRemove(manifest, current)}
            readOnly={readOnly}
            settingsHref={manifest.settingsRoute ? appPaths.settings(store.id, manifest) : null}
            connectFirst={manifest.installMode === "connect" && !current.connected}
            freeWithPro={current.freeWithPro}
          />
          <dl className="flex flex-col divide-y divide-(--s-line-soft) border-t border-(--s-line-soft) text-[13px]">
            <Row label={t("detail.pricing")}>
              <AppPrice appId={manifest.id} freeWithPro={current.freeWithPro} />
            </Row>
            <Row label={t("detail.plans")}>{bothPlans ? t("detail.allPlans") : manifest.plans.join(", ")}</Row>
            <Row label={t("detail.category")}>{tApps(`groups.${manifest.category}`)}</Row>
            <Row label={t("detail.developer")}>{localize(APP_DEVELOPERS[manifest.developer].name, locale)}</Row>
          </dl>
          {manifest.providerFees && <p className="text-[12px] leading-[1.7] text-(--s-subtle)">{t("detail.providerFees", { vendor })}</p>}
          {manifest.docsUrl && (
            <a
              href={manifest.docsUrl}
              target="_blank"
              rel="noopener"
              className="inline-flex min-h-6 items-center gap-1.5 text-[13px] font-bold text-(--s-link) hover:underline max-[600px]:min-h-10"
            >
              <BookOpen className="size-4" aria-hidden />
              {t("detail.docs")}
            </a>
          )}
          {!manifest.settingsRoute && current.installed && <Note>{t("detail.noSettings")}</Note>}
          <p className="text-xs text-(--s-faint)">{t("detail.onlyThisStore", { store: store.name })}</p>
        </SellerCard>
      </aside>
    </div>

    <OtherApps apps={others} allHref={appPaths.center(store.id)} />
    </>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-baseline justify-between gap-3 py-2.5">
      <dt className="text-(--s-subtle)">{label}</dt>
      <dd className="text-end font-semibold text-(--s-ink)">{children}</dd>
    </div>
  );
}

