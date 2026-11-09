import { z } from "zod";

/**
 * "Write with AI" on Website › SEO (owner, 2026-11-09): one click writes the
 * title, description and keywords of ONE target, the store or one page. The
 * result fills the form; nothing is saved until the seller clicks Save.
 * 1 AI credit per click (F-57). Cost rules: docs/ai.md.
 */

export const AI_SEO_FEATURE = "seo_write";

/** Every input is cut to these before it reaches the prompt (docs/ai.md rule 3). */
export const AI_SEO_LIMITS = {
  storeName: 80,
  storeDescription: 400,
  category: 40,
  categories: 5,
  pageName: 80,
  pageText: 600,
  /** Output, clamped again in code after the call. */
  title: 60,
  /** The store's part of its title template ("%s | <this>"). */
  storeTitle: 35,
  description: 160,
  keywords: 10,
} as const;

/** Credits one click costs: shown next to the button. */
export const AI_SEO_CREDITS = 1;

export type AiSeoTarget = { kind: "store" } | { kind: "page"; pageId: string };

// Flat and short on purpose (docs/ai.md rule 9); every value is clamped in cleanAiSeoOutput.
export const aiSeoOutputSchema = z.object({
  title: z.string().describe("The title. At most the character limit given in the request."),
  description: z.string().describe("One or two sentences, 70 to 160 characters."),
  keywords: z.array(z.string()).describe("5 to 10 short search phrases shoppers type, 1 to 4 words each."),
});
export type AiSeoOutput = z.output<typeof aiSeoOutputSchema>;

export type AiSeoErrorCode =
  | "notFound"
  | "readOnly"
  | "disabled"
  | "rateLimited"
  | "dailyLimit"
  | "noCredits"
  | "busy"
  | "timeout"
  | "failed";

export type AiSeoResult =
  | {
      ok: true;
      /** Page: the page title (the store name is added by the template). Store: the part after "%s | ". */
      title: string;
      description: string;
      keywords: string[];
      creditsRemaining?: number;
    }
  | { ok: false; error: AiSeoErrorCode };
