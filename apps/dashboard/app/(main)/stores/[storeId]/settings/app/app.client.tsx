"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { ExternalLink, ImageIcon, Smartphone } from "lucide-react";

import { appInitials, type StoreAppSettings as StoreAppSettingsValue } from "@workspace/lib/stores/app";
import { Switch } from "@workspace/ui/components/switch";
import { getPublicUrl } from "@/lib/utils";
import { saveStoreAppSettings } from "./app.server";

/**
 * Store settings › App (ROADMAP.md F-36e). The store website installs as an
 * app with the store's name and its favicon (Website › Design), else its logo,
 * else its initials. The seller can hide the footer's Download application
 * button; the app itself stays installable from the browser menu.
 */
export function StoreAppSettings({
  storeId,
  name,
  shortName,
  icon,
  usesLogo,
  siteUrl,
  initial,
  readOnly,
}: {
  storeId: string;
  name: string;
  shortName: string;
  icon: string | null;
  usesLogo: boolean;
  siteUrl: string;
  initial: StoreAppSettingsValue;
  readOnly: boolean;
}) {
  const t = useTranslations("storeApp");
  const [show, setShow] = useState(initial.showDownloadButton);
  const [isPending, startTransition] = useTransition();
  const iconUrl = icon ? getPublicUrl(icon, "sellers") : null;

  const toggle = (next: boolean) => {
    setShow(next);
    startTransition(async () => {
      const result = await saveStoreAppSettings(storeId, { showDownloadButton: next });
      if (!result.success) {
        setShow(!next);
        toast.error(t(`errors.${result.error}`));
        return;
      }
      toast.success(next ? t("shown") : t("hidden"));
    });
  };

  return (
    <div className="space-y-5">
      {readOnly && <p className="rounded-xl border bg-muted/40 px-4 py-3 text-sm text-muted-foreground">{t("readOnly")}</p>}

      <section className="space-y-4 rounded-xl border bg-card p-4 sm:p-5">
        <div className="space-y-1">
          <h2 className="flex items-center gap-2 font-semibold">
            <Smartphone className="size-4" />
            {t("title")}
          </h2>
          <p className="text-sm text-muted-foreground">{t("description")}</p>
        </div>

        <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
          {/* A home-screen tile as the phone shows it. */}
          <div className="flex w-fit flex-col items-center gap-2 rounded-2xl bg-gradient-to-b from-slate-700 to-slate-900 px-8 py-6">
            {iconUrl ? (
              // eslint-disable-next-line @next/next/no-img-element -- a small seller image preview
              <img src={iconUrl} alt="" className="size-16 rounded-[18px] bg-white object-contain p-1.5 shadow-lg" />
            ) : (
              <span className="grid size-16 place-items-center rounded-[18px] bg-gray-900 text-xl font-bold text-white shadow-lg ring-1 ring-white/20">
                {appInitials(name)}
              </span>
            )}
            <span className="max-w-24 truncate text-xs font-medium text-white">{shortName}</span>
          </div>

          <dl className="min-w-0 flex-1 space-y-3 text-sm">
            <div>
              <dt className="text-muted-foreground">{t("appName")}</dt>
              <dd className="font-medium">{name}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">{t("appIcon")}</dt>
              <dd className="flex flex-wrap items-center gap-x-3 gap-y-1">
                <span>{iconUrl ? (usesLogo ? t("iconFromLogo") : t("iconFromFavicon")) : t("iconInitials")}</span>
                <Link
                  href={`/stores/${storeId}/website/design`}
                  className="inline-flex items-center gap-1 text-primary-ink underline-offset-4 hover:underline"
                >
                  <ImageIcon className="size-3.5" />
                  {t("changeIcon")}
                </Link>
              </dd>
            </div>
            <p className="text-xs text-muted-foreground">{t("nameHint")}</p>
          </dl>
        </div>
      </section>

      <section className="flex items-start justify-between gap-4 rounded-xl border bg-card p-4 sm:p-5">
        <div className="space-y-1">
          <label htmlFor="store-app-button" className="font-semibold">
            {t("buttonTitle")}
          </label>
          <p className="text-sm text-muted-foreground">{t("buttonDescription")}</p>
          <a
            href={siteUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-sm text-primary-ink underline-offset-4 hover:underline"
          >
            {t("viewStore")}
            <ExternalLink className="size-3.5" />
          </a>
        </div>
        <Switch
          id="store-app-button"
          checked={show}
          disabled={readOnly || isPending}
          onCheckedChange={toggle}
          aria-label={t("buttonTitle")}
        />
      </section>
    </div>
  );
}
