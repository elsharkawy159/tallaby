"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, ExternalLink, ImagePlus, LoaderCircle, X } from "lucide-react";
import { toast } from "sonner";
import { RichTextEditor } from "@workspace/tiptap/editor";
import type { AdminPlatformBlogPost } from "@workspace/lib/admin/server";
import {
  PLATFORM_BLOG_CATEGORIES,
  platformBlogPostInputSchema,
  platformPostState,
  slugifyPlatformPost,
} from "@workspace/lib/platform-blog";
import { Badge } from "@workspace/ui/components/badge";
import { Button } from "@workspace/ui/components/button";
import { Card, CardContent, CardHeader, CardTitle } from "@workspace/ui/components/card";
import { Input } from "@workspace/ui/components/input";
import { Label } from "@workspace/ui/components/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@workspace/ui/components/select";
import { Switch } from "@workspace/ui/components/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@workspace/ui/components/tabs";
import { Textarea } from "@workspace/ui/components/textarea";
import type { BlogPostForm } from "./blog.dto";
import { EMPTY_BLOG_FORM, formToInput, isoToLocalInput, postToForm } from "./blog.lib";
import { saveBlogPostAction } from "./blog.server";
import { blogImageUrl, uploadBlogImage } from "./blog-upload.client";
import { RemoteImage } from "@/components/media/remote-image";

const CATEGORY_LABELS: Record<(typeof PLATFORM_BLOG_CATEGORIES)[number], string> = {
  guides: "Guides",
  growth: "Growth",
  stories: "Stories",
  payments: "Payments",
  product: "Product news",
};

const LANGS = [
  { key: "ar", label: "العربية", dir: "rtl" },
  { key: "en", label: "English", dir: "ltr" },
] as const;

type LangKey = (typeof LANGS)[number]["key"];
const field = (base: "title" | "excerpt" | "body", lang: LangKey) => `${base}${lang === "ar" ? "Ar" : "En"}` as const;

/** Create or edit a tallaby.com blog post (0073). Both languages in one post. */
export function PostEditor({ post, siteUrl }: { post?: AdminPlatformBlogPost; siteUrl: string | null }) {
  const router = useRouter();
  // The publish date is shown in the browser's time zone, which the server render cannot know,
  // so it is filled in after hydration.
  const [form, setForm] = useState<BlogPostForm>(() => (post ? { ...postToForm(post), publishedAt: "" } : EMPTY_BLOG_FORM));
  const [slugEdited, setSlugEdited] = useState(Boolean(post));
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [pending, startTransition] = useTransition();
  const savedPublishedAt = post?.publishedAt ?? null;

  useEffect(() => {
    if (savedPublishedAt) setForm((f) => ({ ...f, publishedAt: isoToLocalInput(savedPublishedAt) }));
  }, [savedPublishedAt]);

  const set = <K extends keyof BlogPostForm>(key: K, value: BlogPostForm[K]) => setForm((f) => ({ ...f, [key]: value }));
  const setSeo = <K extends keyof BlogPostForm["seo"]>(key: K, value: BlogPostForm["seo"][K]) =>
    setForm((f) => ({ ...f, seo: { ...f.seo, [key]: value } }));

  const setTitle = (lang: LangKey, value: string) =>
    setForm((f) => {
      const next = { ...f, [field("title", lang)]: value };
      if (!slugEdited) next.slug = slugifyPlatformPost(next.titleEn) || f.slug;
      return next;
    });

  const state = post ? platformPostState(post.status, post.publishedAt) : "draft";
  const liveLocale = post?.titleAr ? "ar" : "en";

  const save = (status: BlogPostForm["status"]) => {
    const values = { ...form, status };
    const parsed = platformBlogPostInputSchema.safeParse(formToInput(values));
    if (!parsed.success) {
      const next: Record<string, string> = {};
      for (const issue of parsed.error.issues) next[issue.path.join(".")] ??= issue.message;
      setErrors(next);
      toast.error(Object.values(next)[0] ?? "Check the form and try again.");
      return;
    }
    setErrors({});
    startTransition(async () => {
      const result = await saveBlogPostAction(parsed.data);
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      toast.success(status === "published" ? "Post published" : result.message);
      setForm(values);
      if (!post) router.replace(`/blog/${result.id}`);
      router.refresh();
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Button asChild variant="ghost" size="icon" aria-label="Back to posts">
            <Link href="/blog">
              <ArrowLeft className="size-4" />
            </Link>
          </Button>
          <h1 className="text-2xl font-semibold">{post ? "Edit post" : "New post"}</h1>
          {post ? <Badge variant={state === "published" ? "default" : "secondary"} className="capitalize">{state}</Badge> : null}
        </div>
        <div className="flex flex-wrap gap-2">
          {siteUrl && post && state === "published" ? (
            <Button asChild variant="ghost">
              <a href={`${siteUrl.replace(/\/$/, "")}/${liveLocale}/blog/${post.slug}`} target="_blank" rel="noreferrer">
                <ExternalLink className="size-4" /> View on site
              </a>
            </Button>
          ) : null}
          <Button variant="outline" disabled={pending} onClick={() => save("draft")}>
            {form.status === "published" ? "Unpublish (save as draft)" : "Save draft"}
          </Button>
          <Button disabled={pending} onClick={() => save("published")}>
            {pending ? <LoaderCircle className="size-4 animate-spin" /> : null}
            {form.status === "published" ? "Update" : "Publish"}
          </Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <Card>
          <CardContent className="pt-6">
            <Tabs defaultValue={form.titleAr || !form.titleEn ? "ar" : "en"}>
              <TabsList>
                {LANGS.map((l) => (
                  <TabsTrigger key={l.key} value={l.key}>
                    {l.label}
                    {form[field("title", l.key)] ? null : <span className="ms-1 text-xs text-muted-foreground">(empty)</span>}
                  </TabsTrigger>
                ))}
              </TabsList>
              {LANGS.map((l) => (
                <TabsContent key={l.key} value={l.key} dir={l.dir} className="mt-4 space-y-4">
                  <p className="text-xs text-muted-foreground" dir="ltr">
                    Leave the title empty to hide this post in {l.key === "ar" ? "Arabic" : "English"}.
                  </p>
                  <div className="space-y-1.5">
                    <Label htmlFor={`title-${l.key}`}>{l.key === "ar" ? "العنوان" : "Title"}</Label>
                    <Input
                      id={`title-${l.key}`}
                      value={form[field("title", l.key)]}
                      maxLength={300}
                      onChange={(e) => setTitle(l.key, e.target.value)}
                      className="text-lg"
                    />
                    {errors[field("title", l.key)] ? <p className="text-xs text-destructive">{errors[field("title", l.key)]}</p> : null}
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor={`excerpt-${l.key}`}>{l.key === "ar" ? "الملخص" : "Excerpt"}</Label>
                    <Textarea
                      id={`excerpt-${l.key}`}
                      rows={2}
                      maxLength={1000}
                      value={form[field("excerpt", l.key)]}
                      onChange={(e) => set(field("excerpt", l.key), e.target.value)}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>{l.key === "ar" ? "المقال" : "Article"}</Label>
                    <RichTextEditor
                      value={form[field("body", l.key)]}
                      onChange={(html) => set(field("body", l.key), html)}
                      dir={l.dir}
                      placeholder={l.key === "ar" ? "اكتب المقال هنا…" : "Write the article…"}
                      onImageUpload={async (file) => {
                        try {
                          return blogImageUrl(await uploadBlogImage(file));
                        } catch (error) {
                          toast.error(error instanceof Error ? error.message : "Upload failed.");
                          return null;
                        }
                      }}
                    />
                  </div>
                </TabsContent>
              ))}
            </Tabs>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Publishing</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="published-at">Publish date</Label>
                <Input
                  id="published-at"
                  type="datetime-local"
                  value={form.publishedAt}
                  onChange={(e) => set("publishedAt", e.target.value)}
                />
                <p className="text-xs text-muted-foreground">Empty means now. A future date schedules the post.</p>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="slug">Slug</Label>
                <Input
                  id="slug"
                  dir="ltr"
                  value={form.slug}
                  maxLength={200}
                  onChange={(e) => {
                    setSlugEdited(true);
                    set("slug", e.target.value.toLowerCase().replace(/\s+/g, "-"));
                  }}
                />
                <p className="text-xs text-muted-foreground">/blog/{form.slug || "…"}. Changing it breaks old links.</p>
                {errors.slug ? <p className="text-xs text-destructive">{errors.slug}</p> : null}
              </div>
              <div className="space-y-1.5">
                <Label>Category</Label>
                <Select value={form.category} onValueChange={(v) => set("category", v as BlogPostForm["category"])}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PLATFORM_BLOG_CATEGORIES.map((c) => (
                      <SelectItem key={c} value={c}>
                        {CATEGORY_LABELS[c]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="tags">Tags</Label>
                <Input id="tags" value={form.tags} placeholder="pricing, cod" onChange={(e) => set("tags", e.target.value)} />
                <p className="text-xs text-muted-foreground">Comma separated.</p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="author">Author</Label>
                  <Input id="author" value={form.authorName} maxLength={120} placeholder="Tallaby" onChange={(e) => set("authorName", e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="minutes">Minutes</Label>
                  <Input
                    id="minutes"
                    inputMode="numeric"
                    value={form.readingMinutes}
                    placeholder="Auto"
                    onChange={(e) => set("readingMinutes", e.target.value.replace(/\D/g, "").slice(0, 3))}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Cover image</CardTitle>
            </CardHeader>
            <CardContent>
              <ImageField value={form.coverImage} onChange={(v) => set("coverImage", v)} error={errors.coverImage} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Search & sharing</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-xs text-muted-foreground">Optional. Empty fields use the title, excerpt and cover.</p>
              {LANGS.map((l) => (
                <div key={l.key} className="space-y-2" dir={l.dir}>
                  <Input
                    aria-label={`SEO title (${l.key})`}
                    placeholder={l.key === "ar" ? "عنوان محركات البحث" : "SEO title"}
                    maxLength={200}
                    value={l.key === "ar" ? form.seo.titleAr : form.seo.titleEn}
                    onChange={(e) => setSeo(l.key === "ar" ? "titleAr" : "titleEn", e.target.value)}
                  />
                  <Textarea
                    aria-label={`SEO description (${l.key})`}
                    placeholder={l.key === "ar" ? "وصف محركات البحث" : "SEO description"}
                    rows={2}
                    maxLength={500}
                    value={l.key === "ar" ? form.seo.descriptionAr : form.seo.descriptionEn}
                    onChange={(e) => setSeo(l.key === "ar" ? "descriptionAr" : "descriptionEn", e.target.value)}
                  />
                </div>
              ))}
              <div className="space-y-1.5">
                <Label>Social image</Label>
                <ImageField value={form.seo.ogImage} onChange={(v) => setSeo("ogImage", v)} error={errors["seo.ogImage"]} />
              </div>
              <div className="flex items-center justify-between gap-3">
                <Label htmlFor="noindex">Hide from search engines</Label>
                <Switch id="noindex" checked={form.seo.noindex} onCheckedChange={(v) => setSeo("noindex", v)} />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

/** One image: upload to the `platform-blog` bucket, preview, remove. Stores the bucket path. */
function ImageField({ value, onChange, error }: { value: string; onChange: (value: string) => void; error?: string }) {
  const input = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const pick = async (file: File | undefined) => {
    if (!file) return;
    setUploading(true);
    try {
      onChange(await uploadBlogImage(file));
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Upload failed.");
    } finally {
      setUploading(false);
      if (input.current) input.current.value = "";
    }
  };

  return (
    <div className="space-y-2">
      {value ? (
        <div className="relative overflow-hidden rounded-md border">
          <RemoteImage src={blogImageUrl(value)} alt="" width={640} height={360} sizes="(min-width: 768px) 640px, 100vw" className="aspect-[16/9] w-full object-cover" />
          <Button
            type="button"
            size="icon"
            variant="secondary"
            className="absolute end-2 top-2 size-7"
            aria-label="Remove image"
            onClick={() => onChange("")}
          >
            <X className="size-4" />
          </Button>
        </div>
      ) : null}
      <input
        ref={input}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/avif"
        className="hidden"
        onChange={(e) => pick(e.target.files?.[0])}
      />
      <Button type="button" variant="outline" className="w-full" disabled={uploading} onClick={() => input.current?.click()}>
        {uploading ? <LoaderCircle className="size-4 animate-spin" /> : <ImagePlus className="size-4" />}
        {value ? "Replace image" : "Upload image"}
      </Button>
      <p className="text-xs text-muted-foreground">JPG, PNG, WebP or AVIF, up to 2 MB. 1200×630 works best.</p>
      {error ? <p className="text-xs text-destructive">{error}</p> : null}
    </div>
  );
}
