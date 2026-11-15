import type { BlogPostForm } from "./blog.dto";

/** Blog editor helpers (PLAN.md P4-16). Pure: used by the client editor and its tests. */

export const EMPTY_POST: BlogPostForm = {
  slug: "",
  title: "",
  excerpt: "",
  coverImage: "",
  body: "",
  tags: [],
  authorName: "",
  mode: "draft",
  scheduledAt: "",
  seo: { title: "", description: "", ogImage: "", noindex: false },
};

/** `datetime-local` value (local time) for an ISO date. */
export function toLocalInput(iso: string | null | undefined): string {
  if (!iso) return "";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

/** Tags typed as "a, b; c" → normalized, deduplicated list. */
export function parseTags(value: string): string[] {
  const out: string[] = [];
  for (const raw of value.split(/[,،;\n]/)) {
    const tag = raw.trim().replace(/\s+/g, " ").toLowerCase().slice(0, 40);
    if (tag && !out.includes(tag)) out.push(tag);
  }
  return out.slice(0, 20);
}

/**
 * The save payload for @workspace/lib/cms (cmsItemInputSchema). Publishing
 * "now" keeps an existing past date; scheduling sends the chosen date.
 */
export function toPostInput(form: BlogPostForm, currentPublishedAt: string | null) {
  const status = form.mode === "draft" ? "draft" : "published";
  let publishedAt: string | null = null;
  if (form.mode === "schedule" && form.scheduledAt) {
    const date = new Date(form.scheduledAt);
    publishedAt = Number.isNaN(date.getTime()) ? null : date.toISOString();
  } else if (form.mode === "publish") {
    const keep = currentPublishedAt && new Date(currentPublishedAt).getTime() <= Date.now();
    publishedAt = keep ? currentPublishedAt : new Date().toISOString();
  } else {
    publishedAt = currentPublishedAt;
  }
  return {
    slug: form.slug.trim().toLowerCase(),
    status,
    publishedAt,
    data: {
      title: form.title,
      excerpt: form.excerpt,
      coverImage: form.coverImage,
      body: form.body,
      tags: form.tags,
      authorName: form.authorName,
    },
    seo: form.seo,
  };
}

/** Editor form values for a stored post. */
export function toPostForm(item: {
  slug: string;
  state: "draft" | "scheduled" | "published";
  publishedAt: string | null;
  data: Record<string, unknown>;
  seo: { title: string; description: string; ogImage: string; noindex: boolean };
}): BlogPostForm {
  const str = (v: unknown) => (typeof v === "string" ? v : "");
  return {
    slug: item.slug,
    title: str(item.data.title),
    excerpt: str(item.data.excerpt),
    coverImage: str(item.data.coverImage),
    body: str(item.data.body),
    tags: Array.isArray(item.data.tags) ? item.data.tags.filter((t): t is string => typeof t === "string") : [],
    authorName: str(item.data.authorName),
    mode: item.state === "draft" ? "draft" : item.state === "scheduled" ? "schedule" : "publish",
    scheduledAt: item.state === "scheduled" ? toLocalInput(item.publishedAt) : "",
    seo: item.seo,
  };
}
