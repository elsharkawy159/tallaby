"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useFormatter, useLocale, useTranslations } from "next-intl";
import { toast } from "sonner";
import { ArrowRight, ExternalLink, FileText, History, ImageIcon, Search, Tags } from "lucide-react";
import { CMS_ITEM_SLUG_RE, slugifyCms } from "@workspace/lib/cms";
import { RichTextEditor } from "@workspace/tiptap/editor";
import { Field, FieldRow, InputGroup, Note, OptionCard, OptionCards, PageHeader, Row, Rows, SaveBar, SectionCard, SellerButton, StatusBadge, TextAction, TextArea, TextInput, Toggle } from "@/components/seller-ui";
import { MediaPicker } from "@/components/media/media-adapter.client";
import { cn } from "@/lib/utils";
import { parseTags, toPostInput } from "./blog.lib";
import type { BlogPostForm, BlogPostState, BlogRevision } from "./blog.dto";
import { listPostRevisions, restorePostRevision, savePost } from "./blog.server";
import { RemoteImage } from "@/components/media/remote-image";

const TITLE_MAX = 200;
const EXCERPT_MAX = 500;
const SEO_TITLE_MAX = 120;
const SEO_DESCRIPTION_MAX = 320;

/**
 * Website › Blog post editor (PLAN.md §8.9, P4-16). Saves through `savePost`,
 * which re-checks the store and sanitizes the body on the server. A post is
 * published per post (no site publish needed); "schedule" keeps it off the
 * store until its date.
 */
export function PostEditor({
  storeId,
  postId,
  initial,
  publishedAt,
  state,
  liveBaseUrl,
  defaultAuthor,
  readOnly,
}: {
  storeId: string;
  postId: string | null;
  initial: BlogPostForm;
  publishedAt: string | null;
  state?: BlogPostState;
  liveBaseUrl: string;
  defaultAuthor: string;
  readOnly: boolean;
}) {
  const t = useTranslations("websiteBlog.editor");
  const tErrors = useTranslations("websiteBlog.errors");
  const tStates = useTranslations("websiteBlog.states");
  const format = useFormatter();
  const uiLocale = useLocale() === "en" ? "en" : "ar";
  const router = useRouter();
  const [form, setForm] = useState<BlogPostForm>(() => ({ ...initial, authorName: initial.authorName || defaultAuthor }));
  const [saved, setSaved] = useState(() => JSON.stringify({ ...initial, authorName: initial.authorName || defaultAuthor }));
  const [tagsText, setTagsText] = useState(initial.tags.join(", "));
  const [slugTouched, setSlugTouched] = useState(Boolean(initial.slug));
  const [fieldErrors, setFieldErrors] = useState<string[]>([]);
  const [revisions, setRevisions] = useState<BlogRevision[] | null>(null);
  const [isPending, startTransition] = useTransition();

  const disabled = readOnly || isPending;
  const dirty = JSON.stringify(form) !== saved;
  const slugInvalid = Boolean(form.slug) && !CMS_ITEM_SLUG_RE.test(form.slug);
  const scheduleMissing = form.mode === "schedule" && !form.scheduledAt;
  const canSave = !disabled && dirty && form.title.trim() && form.slug && !slugInvalid && !scheduleMissing;
  const base = `/stores/${storeId}/website/blog`;

  const set = <K extends keyof BlogPostForm>(key: K, value: BlogPostForm[K]) => setForm((prev) => ({ ...prev, [key]: value }));
  const setSeo = <K extends keyof BlogPostForm["seo"]>(key: K, value: BlogPostForm["seo"][K]) =>
    setForm((prev) => ({ ...prev, seo: { ...prev.seo, [key]: value } }));

  const onTitle = (title: string) => setForm((prev) => ({ ...prev, title, ...(!slugTouched && { slug: slugifyCms(title) }) }));

  const onSave = () =>
    startTransition(async () => {
      const result = await savePost(storeId, postId, toPostInput(form, publishedAt));
      if (!result.success) {
        setFieldErrors(result.fields ?? []);
        toast.error(tErrors(result.error));
        return;
      }
      setFieldErrors([]);
      setSaved(JSON.stringify(form));
      toast.success(t(`saved.${result.data.state}`));
      if (postId === null) router.replace(`${base}/${result.data.id}`);
      else router.refresh();
    });

  const onDiscard = () => {
    const previous = JSON.parse(saved) as BlogPostForm;
    setForm(previous);
    setTagsText(previous.tags.join(", "));
    setFieldErrors([]);
  };

  const loadRevisions = () =>
    startTransition(async () => {
      if (!postId) return;
      const result = await listPostRevisions(storeId, postId);
      if (result.success) setRevisions(result.data);
      else toast.error(tErrors(result.error));
    });

  const onRestore = (revisionId: string) =>
    startTransition(async () => {
      if (!postId) return;
      const result = await restorePostRevision(storeId, postId, revisionId);
      if (result.success) {
        toast.success(t("revisions.restored"));
        router.refresh();
      } else {
        toast.error(tErrors(result.error));
      }
    });

  const hasError = (key: string) => fieldErrors.includes(key);
  const danger = (on: boolean) => cn(on && "border-destructive");

  return (
    <>
      <TextAction asChild className="sui-rise -mb-3 self-start">
        <Link href={base}>
          <ArrowRight aria-hidden className="ltr:-scale-x-100" />
          {t("back")}
        </Link>
      </TextAction>
      <PageHeader
        className="sui-rise"
        title={postId ? form.title || t("untitled") : t("newTitle")}
        actions={
          <>
            {state && <StatusBadge tone={state === "published" ? "success" : state === "scheduled" ? "warning" : "muted"}>{tStates(state)}</StatusBadge>}
            {state === "published" && (
              <SellerButton asChild variant="outline" size="sm">
                <a href={`${liveBaseUrl}/blog/${initial.slug}`} target="_blank" rel="noopener noreferrer">
                  <ExternalLink aria-hidden className="rtl:-scale-x-100" />
                  {t("viewLive")}
                </a>
              </SellerButton>
            )}
          </>
        }
      />

      {readOnly && <Note>{t("readOnly")}</Note>}

      <SectionCard id="content" icon={FileText} title={t("content.title")} description={t("content.description")}>
        <Field label={t("content.postTitle")} htmlFor="post-title" required>
          <TextInput id="post-title" className={danger(hasError("title"))} maxLength={TITLE_MAX} value={form.title} disabled={disabled} onChange={(e) => onTitle(e.target.value)} />
        </Field>
        <Field label={t("content.slug")} htmlFor="post-slug" required note={t("content.slugHint")} error={slugInvalid ? t("content.slugInvalid") : undefined}>
          <div dir="ltr">
            <InputGroup
              id="post-slug"
              start="/blog/"
              className={danger(slugInvalid || hasError("slug"))}
              inputClassName="font-mono text-[13px]"
              maxLength={200}
              value={form.slug}
              disabled={disabled}
              onChange={(e) => {
                setSlugTouched(true);
                set("slug", e.target.value.toLowerCase().replace(/\s+/g, "-"));
              }}
            />
          </div>
        </Field>
        <Field label={t("content.excerpt")} htmlFor="post-excerpt" hint={<Count value={form.excerpt.length} max={EXCERPT_MAX} />} note={t("content.excerptHint")}>
          <TextArea id="post-excerpt" rows={2} maxLength={EXCERPT_MAX} value={form.excerpt} disabled={disabled} onChange={(e) => set("excerpt", e.target.value)} />
        </Field>
        <Field label={t("content.body")}>
          <div className={cn(hasError("body") && "rounded-xl ring-1 ring-destructive")}>
            <RichTextEditor
              value={form.body}
              onChange={(html) => set("body", html === "<p></p>" ? "" : html)}
              placeholder={t("content.bodyPlaceholder")}
              dir={uiLocale === "ar" ? "rtl" : "ltr"}
              disabled={disabled}
            />
          </div>
        </Field>
      </SectionCard>

      <SectionCard id="cover" icon={ImageIcon} title={t("cover.title")} description={t("cover.description")}>
        <div className="flex items-start gap-3 max-[600px]:flex-col">
          <div className="relative grid aspect-[16/9] w-56 shrink-0 place-items-center overflow-hidden rounded-2xl border border-(--s-line) bg-(--s-fill) text-(--s-subtle) max-[600px]:w-full">
            {form.coverImage ? <RemoteImage src={form.coverImage} alt="" fill sizes="(min-width: 600px) 224px, 100vw" className="object-cover" /> : <ImageIcon className="size-6" aria-hidden />}
          </div>
          <div className="flex min-w-0 flex-1 flex-col gap-2 max-[600px]:w-full">
            <MediaPicker storeId={storeId} disabled={disabled} readOnly={readOnly} onPick={(asset) => set("coverImage", asset.url)} />
            <TextInput
              dir="ltr"
              className={danger(hasError("coverImage"))}
              placeholder="https://"
              aria-label={t("cover.title")}
              value={form.coverImage}
              disabled={disabled}
              onChange={(e) => set("coverImage", e.target.value.trim())}
            />
            {form.coverImage && (
              <SellerButton variant="mini" size="xs" className="self-start" disabled={disabled} onClick={() => set("coverImage", "")}>
                {t("cover.remove")}
              </SellerButton>
            )}
          </div>
        </div>
      </SectionCard>

      <SectionCard id="details" icon={Tags} title={t("details.title")} description={t("details.description")}>
        <FieldRow>
          <Field label={t("details.tags")} htmlFor="post-tags" note={t("details.tagsHint")}>
            <TextInput
              id="post-tags"
              value={tagsText}
              disabled={disabled}
              onChange={(e) => {
                setTagsText(e.target.value);
                set("tags", parseTags(e.target.value));
              }}
            />
          </Field>
          <Field label={t("details.author")} htmlFor="post-author">
            <TextInput id="post-author" maxLength={80} value={form.authorName} disabled={disabled} onChange={(e) => set("authorName", e.target.value)} />
          </Field>
        </FieldRow>
        <Field label={t("details.visibility")}>
          <OptionCards role="radiogroup" aria-label={t("details.visibility")}>
            {(["draft", "publish", "schedule"] as const).map((mode) => (
              <OptionCard
                key={mode}
                name="post-mode"
                value={mode}
                checked={form.mode === mode}
                disabled={disabled}
                onChange={() => set("mode", mode)}
                title={t(`modes.${mode}.title`)}
                description={t(`modes.${mode}.description`)}
              />
            ))}
          </OptionCards>
        </Field>
        {form.mode === "schedule" && (
          <Field label={t("details.scheduleAt")} htmlFor="post-schedule" required>
            <TextInput
              id="post-schedule"
              type="datetime-local"
              dir="ltr"
              className={cn("w-64 max-[600px]:w-full", danger(scheduleMissing))}
              value={form.scheduledAt}
              disabled={disabled}
              onChange={(e) => set("scheduledAt", e.target.value)}
            />
          </Field>
        )}
        {form.mode === "publish" && publishedAt && (
          <p className="text-xs text-(--s-faint)">{t("details.publishedOn", { date: format.dateTime(new Date(publishedAt), { dateStyle: "medium" }) })}</p>
        )}
      </SectionCard>

      <SectionCard id="seo" icon={Search} title={t("seo.title")} description={t("seo.description")}>
        <Field label={t("seo.metaTitle")} htmlFor="post-seo-title" hint={<Count value={form.seo.title.length} max={SEO_TITLE_MAX} />}>
          <TextInput id="post-seo-title" maxLength={SEO_TITLE_MAX} placeholder={form.title} value={form.seo.title} disabled={disabled} onChange={(e) => setSeo("title", e.target.value)} />
        </Field>
        <Field label={t("seo.metaDescription")} htmlFor="post-seo-description" hint={<Count value={form.seo.description.length} max={SEO_DESCRIPTION_MAX} />} note={t("seo.hint")}>
          <TextArea id="post-seo-description" rows={2} maxLength={SEO_DESCRIPTION_MAX} placeholder={form.excerpt} value={form.seo.description} disabled={disabled} onChange={(e) => setSeo("description", e.target.value)} />
        </Field>
        <div className="flex items-center gap-3.5 rounded-[18px] border border-(--s-line) bg-(--s-tint) px-4 py-3.5">
          <Toggle aria-labelledby="post-index-title" checked={!form.seo.noindex} disabled={disabled} onCheckedChange={(checked) => setSeo("noindex", !checked)} />
          <div className="min-w-0 flex-1">
            <b id="post-index-title" className="block text-sm font-bold text-(--s-text)">
              {t("seo.indexTitle")}
            </b>
            <small className="block text-pretty text-[12.5px] text-(--s-subtle)">{t("seo.indexDescription")}</small>
          </div>
        </div>
      </SectionCard>

      {postId && (
        <SectionCard id="revisions" icon={History} title={t("revisions.title")} description={t("revisions.description")}>
          {revisions === null ? (
            <SellerButton variant="mini" size="sm" className="self-start" disabled={isPending} onClick={loadRevisions}>
              {t("revisions.show")}
            </SellerButton>
          ) : revisions.length === 0 ? (
            <p className="text-[13px] text-(--s-subtle)">{t("revisions.empty")}</p>
          ) : (
            <Rows>
              {revisions.map((revision) => (
                <Row
                  key={revision.id}
                  title={<span className="min-w-0 truncate">{revision.title || t("untitled")}</span>}
                  description={format.dateTime(new Date(revision.createdAt), { dateStyle: "medium", timeStyle: "short" })}
                  end={
                    <SellerButton variant="mini" size="xs" disabled={disabled} onClick={() => onRestore(revision.id)}>
                      {t("revisions.restore")}
                    </SellerButton>
                  }
                />
              ))}
            </Rows>
          )}
        </SectionCard>
      )}

      <SaveBar dirty={dirty} saving={isPending} saveDisabled={!canSave} onSave={onSave} onDiscard={onDiscard} message={t("unsaved")} saveLabel={t(`save.${form.mode}`)} />
    </>
  );
}

function Count({ value, max }: { value: number; max: number }) {
  return (
    <bdi dir="ltr" className="font-montserrat tabular-nums">
      {value}/{max}
    </bdi>
  );
}
