import { getTranslations } from "next-intl/server";
import { buildLlmsTxt, llmsTxtSections } from "@/lib/marketing/llms-txt.lib";
import { getTallabyPayFacts } from "@/lib/marketing/tallaby-pay.server";

/**
 * tallaby.com's /llms.txt: a plain English summary for AI assistants
 * (lib/marketing/llms-txt.lib.ts). proxy.ts lets it through on the marketing
 * host only; a store host's /llms.txt is the store's 404.
 *
 * Static like app/sitemap.xml: rebuilt daily so a comparison whose facts age
 * out drops from the links without a deploy, and Tallaby Pay is named only
 * while its switch is on (a failed read leaves it out).
 */
export const revalidate = 86400;

export async function GET() {
  const [t, pay] = await Promise.all([getTranslations({ locale: "en", namespace: "meta" }), getTallabyPayFacts()]);
  return new Response(buildLlmsTxt((key) => t(`${key}.title`), llmsTxtSections(), pay), {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
