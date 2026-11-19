import { getTranslations } from "next-intl/server";
import { buildLlmsTxt } from "@/lib/marketing/llms-txt.lib";

/**
 * tallaby.com's /llms.txt: a plain English summary for AI assistants
 * (lib/marketing/llms-txt.lib.ts). proxy.ts lets it through on the marketing
 * host only; a store host's /llms.txt is the store's 404.
 *
 * Static like app/sitemap.xml: rebuilt daily so a comparison whose facts age
 * out drops from the links without a deploy.
 */
export const revalidate = 86400;

export async function GET() {
  const t = await getTranslations({ locale: "en", namespace: "meta" });
  return new Response(buildLlmsTxt((key) => t(`${key}.title`)), {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
