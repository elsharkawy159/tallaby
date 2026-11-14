"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { ArrowLeft, FileSpreadsheet, Link2, PencilLine, Sparkles, type LucideIcon } from "lucide-react";
import { Note, SellerButton, Tag } from "@/components/seller-ui";
import { cn } from "@/lib/utils";
import { BULK_LIMITS } from "./from-file/from-file.dto";
import { MAX_BULK_IMPORT_URLS } from "./parse-product-import.types";
import { useProductsHref } from "@/app/(main)/stores/[storeId]/products/_components/product-store.client";

const CARD =
  "group relative flex h-full w-full flex-col items-start gap-2.5 rounded-[20px] border-[1.5px] border-(--s-line) bg-(--s-surface) p-6 text-start shadow-(--s-shadow-card) motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-2 motion-safe:duration-500 motion-safe:fill-mode-backwards max-[900px]:p-5";
const CARD_ACTIVE =
  "cursor-pointer transition-[border-color,transform,box-shadow] duration-200 hover:-translate-y-0.5 hover:border-(--s-primary) hover:shadow-[0_12px_32px_rgba(20,81,99,.10)] focus-visible:outline-[3px] focus-visible:outline-offset-2 focus-visible:outline-(--s-focus)";

const ICON_TONE = {
  amber: "bg-accent-soft text-accent-ink",
  primary: "bg-primary-soft text-primary-ink",
  neutral: "bg-(--s-surface-2) text-(--s-muted)",
} as const;

function CardBody({
  icon: Icon,
  tone,
  title,
  body,
  meta,
  badge,
  arrow = true,
}: {
  icon: LucideIcon;
  tone: keyof typeof ICON_TONE;
  title: string;
  body: string;
  meta?: string;
  badge?: ReactNode;
  arrow?: boolean;
}) {
  return (
    <>
      {badge && <span className="absolute end-5 top-5">{badge}</span>}
      <span className={cn("mb-1.5 grid size-12 place-items-center rounded-[14px] [&_svg]:size-[22px]", ICON_TONE[tone])}>
        <Icon aria-hidden />
      </span>
      <b className="text-base font-bold text-(--s-ink)">{title}</b>
      <small className="flex-1 text-[13px] leading-[1.75] text-pretty text-(--s-muted)">{body}</small>
      {meta && (
        <span className="mt-1 flex w-full items-center justify-between gap-2 border-t border-(--s-line) pt-3.5 text-xs text-(--s-faint)">
          <span>{meta}</span>
          {arrow && (
            <ArrowLeft
              className="size-4 shrink-0 text-primary-ink transition-transform duration-200 group-hover:-translate-x-[3px] ltr:rotate-180 ltr:group-hover:translate-x-[3px]"
              aria-hidden
            />
          )}
        </span>
      )}
    </>
  );
}

/** First step of adding a product: AI, product links, a file, or the form by hand. Layout only; useAddMethod holds the behaviour. */
export function AddMethodChooser({
  aiEnabled,
  draftStored,
  onPick,
}: {
  aiEnabled: boolean;
  draftStored: boolean;
  onPick: (method: "ai" | "url" | "manual") => void;
}) {
  const t = useTranslations("productForm.method");
  const productsHref = useProductsHref();

  return (
    <div className="flex min-h-[calc(100dvh-68px)] flex-col max-[600px]:min-h-[calc(100dvh-60px)]">
      <div className="m-auto flex w-full max-w-[1160px] flex-col gap-8 px-6 py-12 max-[900px]:gap-[22px] max-[900px]:px-4 max-[900px]:py-7">
        <div className="flex flex-col items-center gap-2.5 text-center motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-2 motion-safe:duration-500">
          <h1 id="add-method-title" tabIndex={-1} className="text-[26px] leading-normal font-bold text-balance text-(--s-ink) outline-none max-[640px]:text-[21px]">
            {t("title")}
          </h1>
          <p className="max-w-[520px] text-sm text-pretty text-(--s-muted)">{t("description")}</p>
        </div>

        {draftStored && (
          <Note tone="amber">
            <span className="block">{t("draftNote")}</span>
            <SellerButton type="button" variant="outline" size="sm" className="mt-2" onClick={() => onPick("manual")}>
              {t("draftContinue")}
            </SellerButton>
          </Note>
        )}

        <ul aria-label={t("label")} className="grid grid-cols-4 gap-4 max-[1100px]:grid-cols-2 max-[640px]:grid-cols-1">
          <li>
            {aiEnabled ? (
              <button type="button" className={cn(CARD, CARD_ACTIVE, "border-(--s-primary)/40")} onClick={() => onPick("ai")}>
                <CardBody
                  icon={Sparkles}
                  tone="amber"
                  title={t("aiTitle")}
                  body={t("aiBody")}
                  meta={t("aiMeta")}
                  badge={<span className="rounded-full bg-accent-soft px-2.5 text-[11px] leading-6 font-semibold text-accent-ink">{t("aiBadge")}</span>}
                />
              </button>
            ) : (
              <div className={cn(CARD, "opacity-80")}>
                <CardBody
                  icon={Sparkles}
                  tone="neutral"
                  title={t("aiTitle")}
                  body={t("aiOffBody")}
                  badge={<Tag tone="muted">{t("aiOffTag")}</Tag>}
                  arrow={false}
                />
              </div>
            )}
          </li>
          <li>
            <button type="button" className={cn(CARD, CARD_ACTIVE, "[animation-delay:60ms]")} onClick={() => onPick("url")}>
              <CardBody icon={Link2} tone="primary" title={t("urlTitle")} body={t("urlBody")} meta={t("urlMeta", { max: MAX_BULK_IMPORT_URLS })} />
            </button>
          </li>
          <li>
            <Link href={productsHref("/add/from-file")} className={cn(CARD, CARD_ACTIVE, "[animation-delay:120ms]")}>
              <CardBody icon={FileSpreadsheet} tone="primary" title={t("fileTitle")} body={t("fileBody")} meta={t("fileMeta", { products: BULK_LIMITS.maxProducts })} />
            </Link>
          </li>
          <li>
            <button type="button" className={cn(CARD, CARD_ACTIVE, "[animation-delay:180ms]")} onClick={() => onPick("manual")}>
              <CardBody icon={PencilLine} tone="neutral" title={t("manualTitle")} body={t("manualBody")} meta={t("manualMeta")} />
            </button>
          </li>
        </ul>
      </div>
    </div>
  );
}
