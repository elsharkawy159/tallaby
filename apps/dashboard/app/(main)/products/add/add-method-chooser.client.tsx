"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { ChevronLeft, FileSpreadsheet, PencilLine, Sparkles, type LucideIcon } from "lucide-react";
import { AiCreditsNote } from "@/components/ai/ai-credits-note.client";
import { IconTile, Note, PageContainer, PageHeader, SellerButton, Tag } from "@/components/seller-ui";
import { cn } from "@/lib/utils";

const CARD =
  "flex h-full w-full items-start gap-3 rounded-2xl border-[1.5px] border-(--s-field) bg-(--s-surface) p-4 text-start min-[721px]:flex-col";
const CARD_ACTIVE =
  "cursor-pointer transition-[border-color,background-color] duration-150 hover:border-(--s-outline) hover:bg-(--s-tint) focus-visible:outline-[3px] focus-visible:outline-offset-2 focus-visible:outline-(--s-focus)";

function CardBody({
  icon,
  title,
  body,
  tag,
  arrow = true,
}: {
  icon: LucideIcon;
  title: string;
  body: string;
  tag?: ReactNode;
  arrow?: boolean;
}) {
  return (
    <>
      <IconTile icon={icon} tone={arrow ? "primary" : "neutral"} />
      <span className="min-w-0 flex-1">
        <span className="flex flex-wrap items-center gap-2 text-[15.5px] font-bold text-(--s-ink)">
          {title}
          {tag}
        </span>
        <span className="mt-0.5 block text-[13px] leading-[1.7] text-(--s-muted)">{body}</span>
      </span>
      {arrow && (
        <ChevronLeft className="mt-2.5 size-[18px] shrink-0 text-(--s-subtle) ltr:rotate-180 min-[721px]:hidden" aria-hidden />
      )}
    </>
  );
}

/** First step of adding a product: AI, a file, or the form by hand. Layout only; useAddMethod holds the behaviour. */
export function AddMethodChooser({
  aiEnabled,
  draftStored,
  onPick,
}: {
  aiEnabled: boolean;
  draftStored: boolean;
  onPick: (method: "ai" | "manual") => void;
}) {
  const t = useTranslations("productForm.method");
  const tPage = useTranslations("productForm.page");

  return (
    <PageContainer narrow>
      <PageHeader
        title={
          <span id="add-method-title" tabIndex={-1} className="outline-none">
            {tPage("newTitle")}
          </span>
        }
        description={t("description")}
      />

      {draftStored && (
        <Note tone="amber">
          <span className="block">{t("draftNote")}</span>
          <SellerButton type="button" variant="outline" size="sm" className="mt-2" onClick={() => onPick("manual")}>
            {t("draftContinue")}
          </SellerButton>
        </Note>
      )}

      <ul aria-label={t("label")} className="grid grid-cols-3 gap-3.5 max-[720px]:grid-cols-1">
        <li>
          {aiEnabled ? (
            <button type="button" className={cn(CARD, CARD_ACTIVE)} onClick={() => onPick("ai")}>
              <CardBody icon={Sparkles} title={t("aiTitle")} body={t("aiBody")} />
            </button>
          ) : (
            <div className={cn(CARD, "opacity-80")}>
              <CardBody
                icon={Sparkles}
                title={t("aiTitle")}
                body={t("aiOffBody")}
                tag={<Tag tone="muted">{t("aiOffTag")}</Tag>}
                arrow={false}
              />
            </div>
          )}
        </li>
        <li>
          <Link href="/products/add/from-file" className={cn(CARD, CARD_ACTIVE)}>
            <CardBody icon={FileSpreadsheet} title={t("fileTitle")} body={t("fileBody")} />
          </Link>
        </li>
        <li>
          <button type="button" className={cn(CARD, CARD_ACTIVE)} onClick={() => onPick("manual")}>
            <CardBody icon={PencilLine} title={t("manualTitle")} body={t("manualBody")} />
          </button>
        </li>
      </ul>
      {aiEnabled && <AiCreditsNote className="-mt-2 px-1" />}
    </PageContainer>
  );
}
