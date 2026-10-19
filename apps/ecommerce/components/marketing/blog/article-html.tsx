import { sanitizeArticleHtml } from "@workspace/store-sections/config";

const PROSE =
  "[&_a]:font-semibold [&_a]:text-teal-700 [&_a]:underline [&_blockquote]:my-8 [&_blockquote]:border-s-4 [&_blockquote]:border-amber-600 [&_blockquote]:ps-5 [&_blockquote]:text-xl [&_blockquote]:font-bold [&_blockquote]:text-teal-900 [&_code]:rounded [&_code]:bg-neutral-100 [&_code]:px-1 [&_h2]:mt-12 [&_h2]:mb-4 [&_h2]:text-[28px] [&_h2]:leading-[1.35] [&_h2]:font-bold [&_h2]:text-teal-900 [&_h3]:mt-8 [&_h3]:mb-3 [&_h3]:text-[22px] [&_h3]:font-bold [&_h3]:text-teal-900 [&_hr]:my-10 [&_hr]:border-neutral-200 [&_img]:my-7 [&_img]:h-auto [&_img]:max-w-full [&_img]:rounded-2xl [&_li]:my-1.5 [&_ol]:mb-[22px] [&_ol]:list-decimal [&_ol]:ps-[22px] [&_p]:mb-[22px] [&_pre]:overflow-x-auto [&_pre]:rounded-2xl [&_pre]:bg-neutral-100 [&_pre]:p-4 [&_ul]:mb-[22px] [&_ul]:list-disc [&_ul]:ps-[22px]";

/** A CMS post body on the marketing blog, sanitized again before it reaches the page. */
export function ArticleHtml({ html }: { html: string }) {
  const clean = sanitizeArticleHtml(html);
  if (!clean) return null;
  return <div className={PROSE} dangerouslySetInnerHTML={{ __html: clean }} />;
}
