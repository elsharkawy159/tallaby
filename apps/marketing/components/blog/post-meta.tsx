import { useTranslations } from "next-intl";
import { cn } from "@workspace/ui/lib/utils";
import type { BlogPost } from "@/lib/blog.data";
import { formatLongDate } from "@/lib/format.lib";

/** "Guides · 12 October 2026 · 7 min read". Works in server and client trees. */
export function PostMeta({ post, locale, className }: { post: BlogPost; locale: string; className?: string }) {
  const t = useTranslations("blog");
  const tc = useTranslations("common");
  const dot = <i aria-hidden className="block size-1 rounded-full bg-neutral-300" />;
  return (
    <div className={cn("flex flex-wrap items-center gap-3.5 text-[13px] text-neutral-600", className)}>
      <span className="font-bold text-amber-700">{t(`categories.${post.category}`)}</span>
      {dot}
      <time dateTime={post.date}>{formatLongDate(post.date, locale)}</time>
      {dot}
      <span>{tc("minRead", { minutes: post.minutes })}</span>
    </div>
  );
}
