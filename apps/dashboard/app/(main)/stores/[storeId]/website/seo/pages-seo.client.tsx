"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { EyeOff, FileText, Home, LoaderCircle, Pencil } from "lucide-react";
import {
  SEO_DESCRIPTION_RANGE,
  SEO_KEYWORDS_MAX,
  SEO_TITLE_RANGE,
  pageSearchTitle,
  seoChecklist,
  seoScore,
  suggestPageKeywords,
} from "@workspace/lib/stores";
import type { EditorErrorKey } from "@workspace/store-editor/editor.dto";
import { CheckRow, Field, IconButton, IconTile, Modal, Note, SectionCard, SellerButton, StatusBadge, Tag, TextArea, TextInput } from "@/components/seller-ui";
import { updatePage } from "@/app/(builder)/stores/[storeId]/editor/server/editor.server";
import { cleanSeo, pageName } from "../pages/pages.lib";
import type { WebsitePageRow } from "../website.types";
import { writeSeoWithAi } from "./ai/ai-seo.server";
import { AiWriteButton, DefaultHint, KeywordsInput, LengthMeter, SearchPreview, SeoChecklist, aiSeoErrorKey } from "./seo-fields.client";

const TITLE_MAX = 120;
const DESCRIPTION_MAX = 320;

/** What every page falls back to: the store's saved SEO, else its defaults. */
export type PagesSeoContext = {
  storeName: string;
  storeUrl: string;
  /** The store's title template in use ("%s | Store"). */
  template: string;
  /** The home page title when it has none of its own. */
  homeDefault: string;
  description: string;
  keywords: string[];
  /** The store's default language: page names and defaults are shown in it. */
  locale: "ar" | "en";
};

type PageForm = { title: string; description: string; keywords: string[]; ogImage: string; noindex: boolean };

const toForm = (page: WebsitePageRow): PageForm => ({
  title: page.seo.title ?? "",
  description: page.seo.description ?? "",
  keywords: page.seo.keywords ?? [],
  ogImage: page.seo.ogImage ?? "",
  noindex: Boolean(page.seo.noindex),
});

function pageChecks(page: WebsitePageRow, form: PageForm, ctx: PagesSeoContext) {
  const name = pageName(page.name, ctx.locale) || page.slug;
  const title = pageSearchTitle({ isHome: page.isHome, title: form.title, pageName: name, storeName: ctx.storeName, template: ctx.template, homeDefault: ctx.homeDefault });
  return {
    name,
    title,
    description: form.description.trim() || ctx.description,
    checks: seoChecklist({
      title,
      description: form.description.trim() || ctx.description,
      ownTitle: Boolean(form.title.trim()),
      ownDescription: Boolean(form.description.trim()),
      keywords: form.keywords,
      // A page without its own image shows the store's: only the seller's own counts here.
      hasImage: Boolean(form.ogImage.trim()),
      indexing: !form.noindex,
    }),
  };
}

const pagePath = (page: WebsitePageRow) => (page.isHome ? "/" : `/${page.slug}`);

/**
 * Website › SEO › Pages SEO (2026-11-09): every page's title, description,
 * keywords, share image and noindex, edited in a sheet. Saves through the
 * editor's updatePage (store-scoped, validated by pageSeoSchema). Page SEO is
 * part of the draft site, so it goes live with the next Publish.
 */
export function PagesSeo({ storeId, initial, readOnly, ctx }: { storeId: string; initial: WebsitePageRow[]; readOnly: boolean; ctx: PagesSeoContext }) {
  const t = useTranslations("domainSeo.pages");
  const [pages, setPages] = useState(initial);
  const [editing, setEditing] = useState<WebsitePageRow | null>(null);

  return (
    <SectionCard
      id="pages-list"
      icon={FileText}
      title={
        <>
          {t("title")}
          <Tag>{t("count", { count: pages.length })}</Tag>
        </>
      }
      description={
        <>
          {t("description")}{" "}
          <Link href={`/stores/${storeId}/website`} className="font-semibold text-(--s-link)">
            {t("publishLink")}
          </Link>
        </>
      }
    >
      <ul className="flex flex-col overflow-hidden rounded-[20px] border border-(--s-line) bg-(--s-surface)">
        {pages.map((page) => {
          const { name, title, checks } = pageChecks(page, toForm(page), ctx);
          const score = seoScore(checks);
          return (
            <li key={page.id} className="flex items-center gap-3 px-3.5 py-3 [&+&]:border-t [&+&]:border-(--s-line-soft)">
              <IconTile icon={page.isHome ? Home : FileText} className="size-10 max-[600px]:hidden [&_svg]:size-[18px]" />
              <div className="min-w-0 flex-1">
                <b className="flex flex-wrap items-center gap-2 text-sm font-bold text-(--s-text)">
                  {name}
                  {page.seo.noindex && (
                    <Tag>
                      <EyeOff aria-hidden />
                      {t("hidden")}
                    </Tag>
                  )}
                </b>
                <p dir="auto" className="truncate text-[12.5px] text-(--s-info)">
                  {title}
                </p>
                <bdi dir="ltr" className="block truncate font-mono text-[11.5px] text-(--s-subtle)">
                  {pagePath(page)}
                </bdi>
              </div>
              <StatusBadge tone={score >= 80 ? "success" : score >= 50 ? "warning" : "danger"}>
                <bdi dir="ltr" className="font-montserrat tabular-nums">
                  {score}%
                </bdi>
              </StatusBadge>
              <IconButton aria-label={`${t("edit")}: ${name}`} disabled={readOnly} onClick={() => setEditing(page)}>
                <Pencil aria-hidden />
              </IconButton>
            </li>
          );
        })}
      </ul>

      <Modal open={editing !== null} onOpenChange={(open) => !open && setEditing(null)} title={editing ? t("editTitle", { page: pageName(editing.name, ctx.locale) || editing.slug }) : ""} width={620}>
        {editing && (
          <PageSeoForm
            key={editing.id}
            storeId={storeId}
            page={editing}
            ctx={ctx}
            onCancel={() => setEditing(null)}
            onSaved={(seo) => {
              setPages((list) => list.map((p) => (p.id === editing.id ? { ...p, seo } : p)));
              setEditing(null);
            }}
          />
        )}
      </Modal>
    </SectionCard>
  );
}

function PageSeoForm({
  storeId,
  page,
  ctx,
  onCancel,
  onSaved,
}: {
  storeId: string;
  page: WebsitePageRow;
  ctx: PagesSeoContext;
  onCancel: () => void;
  onSaved: (seo: WebsitePageRow["seo"]) => void;
}) {
  const t = useTranslations("domainSeo.pages");
  const tf = useTranslations("domainSeo.fields");
  const tai = useTranslations("domainSeo.ai");
  const te = useTranslations("storeEditor");
  const router = useRouter();
  const [form, setForm] = useState<PageForm>(() => toForm(page));
  const [saving, startSaving] = useTransition();
  const [aiPending, startAi] = useTransition();
  const [aiUsed, setAiUsed] = useState(false);
  const set = <K extends keyof PageForm>(key: K, value: PageForm[K]) => setForm((f) => ({ ...f, [key]: value }));

  const { name, title, description, checks } = pageChecks(page, form, ctx);
  const suggested = suggestPageKeywords(page, ctx.storeName, ctx.keywords).filter((k) => !form.keywords.includes(k));
  const busy = saving || aiPending;

  const writeWithAi = () =>
    startAi(async () => {
      const result = await writeSeoWithAi(storeId, { kind: "page", pageId: page.id }).catch(() => null);
      if (!result?.ok) {
        toast.error(tai(aiSeoErrorKey(result?.error ?? "failed")));
        return;
      }
      setForm((f) => ({
        ...f,
        title: result.title || f.title,
        description: result.description || f.description,
        keywords: result.keywords.length ? result.keywords : f.keywords,
      }));
      setAiUsed(true);
      toast.success(result.creditsRemaining === undefined ? tai("done") : tai("doneCredits", { count: result.creditsRemaining }));
    });

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    const seo = cleanSeo(form);
    startSaving(async () => {
      const result = await updatePage(storeId, page.id, { seo }).catch(() => null);
      if (!result?.success) {
        toast.error(te(`errors.${(result?.error ?? "generic") as EditorErrorKey}` as "errors.generic"));
        return;
      }
      toast.success(t("saved"));
      onSaved(seo);
      router.refresh();
    });
  };

  return (
    <form onSubmit={submit} className="flex max-h-[70vh] flex-col gap-4 overflow-y-auto pe-1 max-[480px]:max-h-none" noValidate>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-[12.5px] text-(--s-subtle)">{t("draftNote")}</p>
        <AiWriteButton onClick={writeWithAi} pending={aiPending} disabled={saving} />
      </div>
      {aiUsed && <Note>{tai("review")}</Note>}

      <Field label={tf("pageTitle")} hint={<LengthMeter text={title} range={SEO_TITLE_RANGE} />} htmlFor="page-seo-title" note={form.title.trim() ? tf("resultTitle", { title }) : <DefaultHint value={title} />}>
        <TextInput id="page-seo-title" dir="auto" value={form.title} maxLength={TITLE_MAX} disabled={busy} placeholder={page.isHome ? ctx.homeDefault : name} onChange={(e) => set("title", e.target.value)} />
      </Field>

      <Field
        label={tf("description")}
        hint={<LengthMeter text={form.description} range={SEO_DESCRIPTION_RANGE} />}
        htmlFor="page-seo-description"
        note={form.description.trim() ? undefined : <DefaultHint value={ctx.description} disabled={busy} onUse={() => set("description", ctx.description.slice(0, DESCRIPTION_MAX))} />}
      >
        <TextArea id="page-seo-description" dir="auto" rows={3} value={form.description} maxLength={DESCRIPTION_MAX} disabled={busy} placeholder={ctx.description} onChange={(e) => set("description", e.target.value)} />
      </Field>

      <Field
        label={tf("keywords")}
        hint={
          <bdi dir="ltr" className="font-montserrat tabular-nums">
            {form.keywords.length}/{SEO_KEYWORDS_MAX}
          </bdi>
        }
        htmlFor="page-seo-keywords"
        note={form.keywords.length ? tf("pageKeywordsHint") : <DefaultHint value={ctx.keywords.join("، ")} />}
      >
        <KeywordsInput id="page-seo-keywords" value={form.keywords} onChange={(next) => set("keywords", next)} disabled={busy} placeholder={tf("keywordsPlaceholder")} />
        {suggested.length > 0 && form.keywords.length < SEO_KEYWORDS_MAX && (
          <SellerButton variant="mini" size="xs" className="self-start" disabled={busy} onClick={() => set("keywords", [...form.keywords, ...suggested].slice(0, SEO_KEYWORDS_MAX))}>
            {tf("addSuggested", { count: Math.min(suggested.length, SEO_KEYWORDS_MAX - form.keywords.length) })}
          </SellerButton>
        )}
      </Field>

      <Field label={tf("shareImage")} htmlFor="page-seo-image" note={tf("shareImageHint")}>
        <TextInput id="page-seo-image" dir="ltr" type="url" inputMode="url" placeholder="https://" value={form.ogImage} maxLength={2048} disabled={busy} onChange={(e) => set("ogImage", e.target.value)} />
      </Field>

      <CheckRow label={tf("noindex")} description={tf("noindexHint")} checked={form.noindex} disabled={busy} onChange={(e) => set("noindex", e.target.checked)} />

      <Field label={tf("preview")}>
        <SearchPreview url={`${ctx.storeUrl}${page.isHome ? "" : pagePath(page)}`} title={title} description={description} />
      </Field>

      <SeoChecklist checks={checks} />

      <div className="flex gap-2 [&>*]:flex-1">
        <SellerButton variant="outline" onClick={onCancel}>
          {t("cancel")}
        </SellerButton>
        <SellerButton type="submit" variant="solid" disabled={busy}>
          {saving && <LoaderCircle className="animate-spin" aria-hidden />}
          {t("save")}
        </SellerButton>
      </div>
    </form>
  );
}
