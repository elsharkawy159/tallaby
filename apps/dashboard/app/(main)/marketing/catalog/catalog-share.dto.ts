import { z } from "zod";
import { CATALOG_SHARE_MAX_PRODUCTS, CATALOG_SHARE_MAX_TITLE } from "@workspace/lib/catalog-share";

/** Shareable catalog (ROADMAP.md F-11c): what the dashboard sends to sign a link. */
export const catalogLinkInputSchema = z.object({
  storeId: z.string().uuid(),
  title: z.string().max(CATALOG_SHARE_MAX_TITLE * 4).optional(),
  source: z.discriminatedUnion("kind", [
    z.object({ kind: z.literal("products"), productIds: z.array(z.string().uuid()).min(1).max(500) }),
    z.object({ kind: z.literal("category"), categoryKey: z.string().min(1).max(200) }),
    z.object({ kind: z.literal("newest") }),
  ]),
});

export type CatalogLinkInput = z.infer<typeof catalogLinkInputSchema>;

export type CatalogShareStore = {
  id: string;
  name: string;
  /** The website is published: the link works for customers. */
  published: boolean;
  /** Selected catalog mode: only the store's picks show. */
  selectedCatalog: boolean;
};

export type CatalogShareCategory = { key: string; name: string; productCount: number };

export type CatalogLinkResult =
  | {
      success: true;
      url: string;
      altUrl: string | null;
      altLocale: "ar" | "en" | null;
      printUrl: string;
      /** Products the link shows now (picked products only). */
      count: number;
      /** Picked products left out: not active, in Trash, not in this store, or past the limit. */
      skipped: number;
      max: number;
      published: boolean;
    }
  | { success: false; error: "invalid" | "store" | "noProducts" | "config" | "failed" };
