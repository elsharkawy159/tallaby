"use client";

import * as React from "react";
import Image from "next/image";
import { Search } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { cn } from "@workspace/ui/lib/utils";
import { Link } from "@/i18n/navigation";
import { ChoiceGroup } from "@/components/marketing/site/choice-group.client";
import { BLOG_CATEGORIES, type BlogCategory, type MarketingPost } from "@/lib/marketing/blog.data";
import { isOptimizableImage } from "@/lib/marketing/blog.lib";
import { PostMeta } from "./post-meta";

/** Category chips, search and the post grid (everything after the featured post). */
export function BlogIndex({ posts: all }: { posts: MarketingPost[] }) {
  const t = useTranslations("blog");
  const locale = useLocale();
  const [category, setCategory] = React.useState<BlogCategory>("all");
  const [query, setQuery] = React.useState("");

  const q = query.trim().toLowerCase();
  const posts = all.filter((p) => {
    if (category !== "all" && p.category !== category) return false;
    if (!q) return true;
    return `${p.title} ${p.excerpt}`.toLowerCase().includes(q);
  });
  const browsing = category === "all" && !q;
  // A category with no posts isn't offered, so the chips never promise content that doesn't exist.
  const categories = BLOG_CATEGORIES.filter((c) => c === "all" || all.some((p) => p.category === c));

  return (
    <>
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <ChoiceGroup
          value={category}
          onChange={setCategory}
          label={t("index.search")}
          options={categories.map((c) => ({ value: c, label: t(`categories.${c}`) }))}
        />
        <label className="flex h-[42px] w-full items-center gap-2 rounded-full border border-line-strong bg-white px-4 text-neutral-500 transition-[border-color,box-shadow] duration-150 focus-within:border-teal-700 focus-within:shadow-[var(--ring-focus)] sm:w-auto sm:min-w-60">
          <Search className="size-[18px]" aria-hidden />
          <span className="sr-only">{t("index.search")}</span>
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t("index.search")}
            className="min-w-0 flex-1 bg-transparent text-sm text-teal-900 outline-none"
          />
        </label>
      </div>

      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {posts.length ? (
          posts.map((post, i) => <PostCard key={post.id} post={post} locale={locale} wide={browsing && i === 0} />)
        ) : (
          <div className="col-span-full rounded-[20px] border border-dashed border-line-strong p-12 text-center text-neutral-600">{t("index.none")}</div>
        )}
      </div>
    </>
  );
}

function PostCard({ post, locale, wide }: { post: MarketingPost; locale: string; wide?: boolean }) {
  return (
    <Link
      href={`/blog/${post.id}`}
      className={cn(
        "group flex flex-col gap-3 rounded-card border border-line bg-white px-3 pt-3 pb-5 text-inherit shadow-[0_14px_36px_rgba(13,55,67,0.05)] transition-[transform,box-shadow] duration-200 hover:-translate-y-[3px] hover:no-underline hover:shadow-raise",
        wide && "sm:col-span-2 sm:grid sm:grid-cols-[1.1fr_1fr] sm:items-center sm:gap-6",
      )}
    >
      <div className="relative aspect-[16/10] overflow-hidden rounded-2xl">
        <Image src={post.image} alt="" fill sizes="(min-width: 1024px) 400px, 100vw" unoptimized={!isOptimizableImage(post.image)} className="object-cover" />
        <span className="absolute inset-0 bg-teal-900 opacity-0 transition-opacity duration-200 group-hover:opacity-15" />
      </div>
      <div className="grid gap-2.5 px-2">
        <PostMeta post={post} locale={locale} />
        <h3 className="text-[19px] leading-[1.5] font-bold text-teal-900 transition-colors group-hover:text-teal-700 en:leading-[1.25] en:tracking-[-0.01em]">
          {post.title}
        </h3>
        <p className="text-[15px] text-slate-ink">{post.excerpt}</p>
      </div>
    </Link>
  );
}
