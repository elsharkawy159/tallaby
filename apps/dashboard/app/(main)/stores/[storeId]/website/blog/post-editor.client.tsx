"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useFormatter, useLocale, useTranslations } from "next-intl";
import { toast } from "sonner";
import {
  ArrowRight,
  CalendarClock,
  ExternalLink,
  FilePen,
  FileText,
  History,
  ImageIcon,
  LoaderCircle,
  Save,
  Search,
  Send,
  Tags,
  type LucideIcon,
} from "lucide-react";
import { CMS_ITEM_SLUG_RE, slugifyCms } from "@workspace/lib/cms";
import { RichTextEditor } from "@workspace/tiptap/editor";
import { Badge } from "@workspace/ui/components/badge";
import { Button } from "@workspace/ui/components/button";
import { Input } from "@workspace/ui/components/input";
import { Textarea } from "@workspace/ui/components/textarea";
import {
  BUTTON_CLASS,
  ChoiceCard,
  FIELD_CLASS,
  FieldError,
  FieldHint,
  FieldLabel,
  SMALL_BUTTON_CLASS,
  SectionCard,
  TEXTAREA_CLASS,
  ToggleRow,
} from "@/components/form/form-ui";
import { MediaPicker } from "@/components/media/media-picker.client";
import { cn } from "@/lib/utils";
import { parseTags, toPostInput } from "./blog.lib";
import type { BlogPostForm, BlogPostState, BlogRevision } from "./blog.dto";
import { listPostRevisions, restorePostRevision, savePost } from "./blog.server";

const TITLE_MAX = 200;
const EXCERPT_MAX = 500;
const SEO_TITLE_MAX = 120;
const SEO_DESCRIPTION_MAX = 320;
const MODE_ICONS: Record<BlogPostForm["mode"], LucideIcon> = { draft: FilePen, publish: Send, schedule: CalendarClock };

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

  const onTitle = (title: string) =>
    setForm((prev) => ({ ...prev, title, ...(!slugTouched && { slug: slugifyCms(title) }) }));

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

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <Link href={base} className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground">
            <ArrowRight className="size-3.5 ltr:-scale-x-100" aria-hidden />
            {t("back")}
          </Link>
          <h2 className="mt-1 truncate text-xl font-bold">{postId ? form.title || t("untitled") : t("newTitle")}</h2>
        </div>
        <div className="flex items-center gap-2">
          {state && <Badge variant="outline">{tStates(state)}</Badge>}
          {state === "published" && (
            <Button asChild variant="outline" className={BUTTON_CLASS}>
              <a href={`${liveBaseUrl}/blog/${initial.slug}`} target="_blank" rel="noopener noreferrer">
                <ExternalLink />
                {t("viewLive")}
              </a>
            </Button>
          )}
        </div>
      </div>

      {readOnly && <p className="rounded-lg border bg-muted/40 px-4 py-3 text-sm text-muted-foreground">{t("readOnly")}</p>}

      <SectionCard id="content" icon={FileText} title={t("content.title")} description={t("content.description")}>
        <div className="space-y-1.5">
          <FieldLabel htmlFor="post-title" required>
            {t("content.postTitle")}
          </FieldLabel>
          <Input
            id="post-title"
            className={cn(FIELD_CLASS, hasError("title") && "border-destructive")}
            maxLength={TITLE_MAX}
            value={form.title}
            disabled={disabled}
            onChange={(e) => onTitle(e.target.value)}
          />
        </div>
        <div className="space-y-1.5">
          <FieldLabel htmlFor="post-slug" required>
            {t("content.slug")}
          </FieldLabel>
          <div className="flex items-center gap-2" dir="ltr">
            <span className="shrink-0 text-sm text-muted-foreground">/blog/</span>
            <Input
              id="post-slug"
              dir="ltr"
              className={cn(FIELD_CLASS, (slugInvalid || hasError("slug")) && "border-destructive")}
              maxLength={200}
              value={form.slug}
              disabled={disabled}
              onChange={(e) => {
                setSlugTouched(true);
                set("slug", e.target.value.toLowerCase().replace(/\s+/g, "-"));
              }}
            />
          </div>
          {slugInvalid ? <FieldError>{t("content.slugInvalid")}</FieldError> : <FieldHint>{t("content.slugHint")}</FieldHint>}
        </div>
        <div className="space-y-1.5">
          <FieldLabel htmlFor="post-excerpt" note={`${form.excerpt.length}/${EXCERPT_MAX}`}>
            {t("content.excerpt")}
          </FieldLabel>
          <Textarea
            id="post-excerpt"
            className={TEXTAREA_CLASS}
            rows={2}
            maxLength={EXCERPT_MAX}
            value={form.excerpt}
            disabled={disabled}
            onChange={(e) => set("excerpt", e.target.value)}
          />
          <FieldHint>{t("content.excerptHint")}</FieldHint>
        </div>
        <div className="space-y-1.5">
          <FieldLabel>{t("content.body")}</FieldLabel>
          <div className={cn(hasError("body") && "rounded-xl ring-1 ring-destructive")}>
            <RichTextEditor
              value={form.body}
              onChange={(html) => set("body", html === "<p></p>" ? "" : html)}
              placeholder={t("content.bodyPlaceholder")}
              dir={uiLocale === "ar" ? "rtl" : "ltr"}
              disabled={disabled}
            />
          </div>
        </div>
      </SectionCard>

      <SectionCard id="cover" icon={ImageIcon} title={t("cover.title")} description={t("cover.description")}>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
          <div className="grid aspect-[16/9] w-full shrink-0 place-items-center overflow-hidden rounded-xl border bg-muted sm:w-56">
            {form.coverImage ? (
              // eslint-disable-next-line @next/next/no-img-element -- seller media URL
              <img src={form.coverImage} alt="" className="size-full object-cover" />
            ) : (
              <ImageIcon className="size-6 text-muted-foreground" />
            )}
          </div>
          <div className="min-w-0 flex-1 space-y-2">
            <MediaPicker storeId={storeId} disabled={disabled} readOnly={readOnly} onPick={(asset) => set("coverImage", asset.url)} />
            <Input
              dir="ltr"
              className={cn(FIELD_CLASS, hasError("coverImage") && "border-destructive")}
              placeholder="https://"
              value={form.coverImage}
              disabled={disabled}
              onChange={(e) => set("coverImage", e.target.value.trim())}
            />
            {form.coverImage && (
              <Button type="button" variant="ghost" className={SMALL_BUTTON_CLASS} disabled={disabled} onClick={() => set("coverImage", "")}>
                {t("cover.remove")}
              </Button>
            )}
          </div>
        </div>
      </SectionCard>

      <SectionCard id="details" icon={Tags} title={t("details.title")} description={t("details.description")}>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <FieldLabel htmlFor="post-tags">{t("details.tags")}</FieldLabel>
            <Input
              id="post-tags"
              className={FIELD_CLASS}
              value={tagsText}
              disabled={disabled}
              onChange={(e) => {
                setTagsText(e.target.value);
                set("tags", parseTags(e.target.value));
              }}
            />
            <FieldHint>{t("details.tagsHint")}</FieldHint>
          </div>
          <div className="space-y-1.5">
            <FieldLabel htmlFor="post-author">{t("details.author")}</FieldLabel>
            <Input
              id="post-author"
              className={FIELD_CLASS}
              maxLength={80}
              value={form.authorName}
              disabled={disabled}
              onChange={(e) => set("authorName", e.target.value)}
            />
          </div>
        </div>
        <div className="space-y-2">
          <FieldLabel>{t("details.visibility")}</FieldLabel>
          <div
            className={cn("grid gap-2 sm:grid-cols-3", disabled && "pointer-events-none opacity-60")}
            role="radiogroup"
            aria-label={t("details.visibility")}
            aria-disabled={disabled || undefined}
          >
            {(["draft", "publish", "schedule"] as const).map((mode) => (
              <ChoiceCard
                key={mode}
                icon={MODE_ICONS[mode]}
                selected={form.mode === mode}
                onSelect={() => set("mode", mode)}
                title={t(`modes.${mode}.title`)}
                description={t(`modes.${mode}.description`)}
              />
            ))}
          </div>
          {form.mode === "schedule" && (
            <div className="space-y-1.5 pt-1">
              <FieldLabel htmlFor="post-schedule" required>
                {t("details.scheduleAt")}
              </FieldLabel>
              <Input
                id="post-schedule"
                type="datetime-local"
                dir="ltr"
                className={cn(FIELD_CLASS, "sm:w-64", scheduleMissing && "border-destructive")}
                value={form.scheduledAt}
                disabled={disabled}
                onChange={(e) => set("scheduledAt", e.target.value)}
              />
            </div>
          )}
          {form.mode === "publish" && publishedAt && (
            <FieldHint>{t("details.publishedOn", { date: format.dateTime(new Date(publishedAt), { dateStyle: "medium" }) })}</FieldHint>
          )}
        </div>
      </SectionCard>

      <SectionCard id="seo" icon={Search} title={t("seo.title")} description={t("seo.description")}>
        <div className="space-y-1.5">
          <FieldLabel htmlFor="post-seo-title" note={`${form.seo.title.length}/${SEO_TITLE_MAX}`}>
            {t("seo.metaTitle")}
          </FieldLabel>
          <Input
            id="post-seo-title"
            className={FIELD_CLASS}
            maxLength={SEO_TITLE_MAX}
            placeholder={form.title}
            value={form.seo.title}
            disabled={disabled}
            onChange={(e) => setSeo("title", e.target.value)}
          />
        </div>
        <div className="space-y-1.5">
          <FieldLabel htmlFor="post-seo-description" note={`${form.seo.description.length}/${SEO_DESCRIPTION_MAX}`}>
            {t("seo.metaDescription")}
          </FieldLabel>
          <Textarea
            id="post-seo-description"
            className={TEXTAREA_CLASS}
            rows={2}
            maxLength={SEO_DESCRIPTION_MAX}
            placeholder={form.excerpt}
            value={form.seo.description}
            disabled={disabled}
            onChange={(e) => setSeo("description", e.target.value)}
          />
          <FieldHint>{t("seo.hint")}</FieldHint>
        </div>
        <ToggleRow
          id="post-noindex"
          boxed
          checked={!form.seo.noindex}
          disabled={disabled}
          onCheckedChange={(checked) => setSeo("noindex", !checked)}
          title={t("seo.indexTitle")}
          description={t("seo.indexDescription")}
        />
      </SectionCard>

      {postId && (
        <SectionCard id="revisions" icon={History} title={t("revisions.title")} description={t("revisions.description")}>
          {revisions === null ? (
            <Button type="button" variant="outline" className={SMALL_BUTTON_CLASS} disabled={isPending} onClick={loadRevisions}>
              {t("revisions.show")}
            </Button>
          ) : revisions.length === 0 ? (
            <p className="text-sm text-muted-foreground">{t("revisions.empty")}</p>
          ) : (
            <ul className="divide-y rounded-xl border">
              {revisions.map((revision) => (
                <li key={revision.id} className="flex flex-wrap items-center justify-between gap-2 px-3 py-2.5 text-sm">
                  <span className="min-w-0">
                    <span className="block truncate font-medium">{revision.title || t("untitled")}</span>
                    <span className="text-xs text-muted-foreground">
                      {format.dateTime(new Date(revision.createdAt), { dateStyle: "medium", timeStyle: "short" })}
                    </span>
                  </span>
                  <Button
                    type="button"
                    variant="outline"
                    className={SMALL_BUTTON_CLASS}
                    disabled={disabled}
                    onClick={() => onRestore(revision.id)}
                  >
                    {t("revisions.restore")}
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </SectionCard>
      )}

      <div className="sticky bottom-0 flex flex-wrap items-center justify-end gap-2 border-t bg-background/95 py-3 backdrop-blur">
        <FieldHint className="me-auto">{dirty ? t("unsaved") : t("noChanges")}</FieldHint>
        <Button type="button" className={BUTTON_CLASS} disabled={!canSave} onClick={onSave}>
          {isPending ? <LoaderCircle className="animate-spin" /> : <Save />}
          {t(`save.${form.mode}`)}
        </Button>
      </div>
    </div>
  );
}
