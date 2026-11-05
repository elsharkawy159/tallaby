"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Download, ExternalLink, ImageIcon, Pencil, Smartphone } from "lucide-react";

import { appInitials, type StoreAppSettings as StoreAppSettingsValue } from "@workspace/lib/stores/app";
import { Note, Row, Rows, SectionCard, SellerButton, TextAction, Toggle } from "@/components/seller-ui";
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
  const tSetup = useTranslations("storeSetup");
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

  const tile = iconUrl ? (
    // eslint-disable-next-line @next/next/no-img-element -- a small seller image preview
    <img src={iconUrl} alt="" className="size-full rounded-[inherit] bg-white object-contain p-1" />
  ) : (
    <span className="font-montserrat text-[15px] font-extrabold">{appInitials(name)}</span>
  );

  return (
    <div className="flex flex-col gap-4">
      {readOnly && <Note tone="amber">{t("readOnly")}</Note>}

      <SectionCard icon={Smartphone} title={t("title")} description={t("description")}>
        <div className="grid grid-cols-[auto_minmax(0,1fr)] items-center gap-5 max-[600px]:grid-cols-1">
          {/* A home-screen tile as the phone shows it. Always dark, like a phone's wallpaper. */}
          <div className="flex w-fit flex-col items-center gap-2 justify-self-center rounded-[22px] bg-gradient-to-b from-(--tallaby-teal-700) to-(--tallaby-teal-900) px-8 py-6">
            <span className="grid size-16 place-items-center overflow-hidden rounded-[18px] bg-white text-(--tallaby-teal-900) shadow-[0_0_0_3px_var(--tallaby-amber-600)]">
              {tile}
            </span>
            <span className="max-w-24 truncate text-xs font-semibold text-white">{shortName}</span>
          </div>

          <div className="flex min-w-0 flex-col gap-2">
            <Rows>
              <Row
                title={iconUrl ? (usesLogo ? t("iconFromLogo") : t("iconFromFavicon")) : t("iconInitials")}
                description={t("appIcon")}
                end={
                  <SellerButton variant="mini" size="xs" asChild>
                    <Link href={`/stores/${storeId}/website/design`}>
                      <ImageIcon aria-hidden />
                      {t("changeIcon")}
                    </Link>
                  </SellerButton>
                }
              />
              <Row
                title={<bdi>{name}</bdi>}
                description={t("appName")}
                end={
                  <SellerButton variant="mini" size="xs" asChild>
                    <Link href={`/stores/${storeId}/settings`}>
                      <Pencil aria-hidden />
                      {tSetup("editName")}
                    </Link>
                  </SellerButton>
                }
              />
            </Rows>
            <p className="text-pretty text-xs text-(--s-faint)">{t("nameHint")}</p>
          </div>
        </div>
      </SectionCard>

      <SectionCard
        icon={Download}
        title={t("buttonTitle")}
        description={t("buttonDescription")}
        action={<Toggle className="max-[600px]:min-h-10" id="store-app-button" checked={show} disabled={readOnly || isPending} onCheckedChange={toggle} aria-label={t("buttonTitle")} />}
      >
        <TextAction asChild className="self-start max-[600px]:min-h-10">
          <a href={siteUrl} target="_blank" rel="noopener noreferrer">
            <ExternalLink aria-hidden />
            {t("viewStore")}
          </a>
        </TextAction>
      </SectionCard>
    </div>
  );
}
