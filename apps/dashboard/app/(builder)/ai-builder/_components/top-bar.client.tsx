"use client";

import { ArrowRight, ExternalLink, Monitor, PenLine, Smartphone, Tablet } from "lucide-react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import { SellerButton } from "@/components/seller-ui";
import { TallabyMark } from "./chat-thread.client";
import type { PreviewDevice } from "./workspace.lib";

export type BuildStatusPill = "new" | "collecting" | "building" | "published" | "ready";

const PILL_TONE: Record<BuildStatusPill, string> = {
  new: "bg-(--s-fill) text-(--s-muted)",
  collecting: "bg-(--s-info-soft) text-(--s-info)",
  building: "bg-accent-soft text-accent-ink",
  published: "bg-success-soft text-success",
  ready: "bg-(--s-fill) text-(--s-ink)",
};

const DEVICES: { value: PreviewDevice; icon: typeof Monitor }[] = [
  { value: "phone", icon: Smartphone },
  { value: "tablet", icon: Tablet },
  { value: "desktop", icon: Monitor },
];

/** The slim bar over both panes (spec §10): mark, store name, status, device, Open store, Edit in builder, back. */
export function TopBar({
  storeName,
  status,
  device,
  onDevice,
  showDevice,
  openStoreHref,
  editorHref,
}: {
  storeName: string | null;
  status: BuildStatusPill;
  device: PreviewDevice;
  onDevice: (device: PreviewDevice) => void;
  showDevice: boolean;
  openStoreHref: string | null;
  editorHref: string | null;
}) {
  const t = useTranslations("aiBuilder.ws");
  return (
    <header className="flex h-14 shrink-0 items-center gap-2 border-b border-(--s-line) bg-(--s-surface)/90 px-3 backdrop-blur max-[600px]:px-2">
      <Link href="/" aria-label={t("back")} className="grid size-10 shrink-0 place-items-center rounded-xl text-(--s-subtle) hover:bg-(--s-hover) hover:text-(--s-ink)">
        <ArrowRight className="size-[18px] ltr:rotate-180" aria-hidden />
      </Link>
      <TallabyMark />
      <div className="flex min-w-0 items-center gap-2">
        <span className="truncate text-[14px] font-bold text-(--s-ink)">{storeName || t("untitled")}</span>
        <span className={cn("inline-flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11.5px] font-bold", PILL_TONE[status])}>
          <span className={cn("size-1.5 rounded-full bg-current", status === "building" && "motion-safe:animate-pulse")} aria-hidden />
          {t(`status.${status}`)}
        </span>
      </div>

      <div className="ms-auto flex items-center gap-1.5">
        {showDevice && (
          <div role="group" aria-label={t("device.label")} className="inline-flex gap-0.5 rounded-full bg-(--s-fill) p-[3px] max-[1023px]:hidden">
            {DEVICES.map(({ value, icon: Icon }) => (
              <button
                key={value}
                type="button"
                aria-pressed={device === value}
                aria-label={t(`device.${value}`)}
                title={t(`device.${value}`)}
                onClick={() => onDevice(value)}
                className="grid h-8 w-9 cursor-pointer place-items-center rounded-full text-(--s-muted) transition-colors aria-pressed:bg-(--s-surface) aria-pressed:text-(--s-ink) aria-pressed:shadow-[0_1px_3px_rgb(13_55_67/0.12)]"
              >
                <Icon className="size-4" aria-hidden />
              </button>
            ))}
          </div>
        )}
        {editorHref && (
          <SellerButton variant="mini" size="sm" asChild className="max-[600px]:hidden">
            <Link href={editorHref}>
              <PenLine aria-hidden />
              {t("editInBuilder")}
            </Link>
          </SellerButton>
        )}
        {openStoreHref && (
          <SellerButton variant="solid" size="sm" asChild>
            <a href={openStoreHref} target="_blank" rel="noreferrer">
              <ExternalLink aria-hidden />
              <span className="max-[420px]:sr-only">{t("openStore")}</span>
            </a>
          </SellerButton>
        )}
      </div>
    </header>
  );
}
