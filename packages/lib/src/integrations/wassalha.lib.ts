import { z } from "zod";
import { PACKAGE_VOLUMES, type EgyptPostBatchDefaults } from "../shipping/egypt-post.lib";

/**
 * Wassalha (Egypt Post) per store (ROADMAP.md F-12c). Wassalha has no API:
 * the seller downloads their orders as Wassalha's upload sheet and uploads it
 * on the Wassalha dashboard. These settings are the account details printed
 * on every row (store_integrations.config; nothing secret). Pure.
 */

/** Wassalha's sheet expects grams; an order whose products have no weight is sent as 998 g (owner, 2026-10-30). */
export const WASSALHA_DEFAULT_WEIGHT_KG = 0.998;

const text = (max: number) => z.string().trim().min(1).max(max);

export const wassalhaSettingsSchema = z
  .object({
    /** Post_Id: the store id on the Wassalha dashboard. */
    postId: z.string().trim().regex(/^[A-Za-z0-9-]{1,40}$/, "post_id_invalid"),
    /** Merchant_Name, exactly as registered on Wassalha. */
    merchantName: text(120),
    /** Warehouse_Name: the pickup warehouse defined on Wassalha. */
    warehouseName: text(120),
    /** SellerName: the sender shown on the parcel. */
    senderName: text(120),
    /** HasPOD: proof of delivery. */
    hasPod: z.boolean(),
    /** Package_volume used for every row. */
    volume: z.enum(PACKAGE_VOLUMES),
    /** Added to every row's Item_Special_Notes, e.g. "اتصل قبل التوصيل". */
    note: z.string().trim().max(200).optional(),
  })
  .strict();

export type WassalhaSettings = z.output<typeof wassalhaSettingsSchema>;

/** The stored settings, or null when missing or no longer valid (the export is then refused). */
export function readWassalhaSettings(config: unknown): WassalhaSettings | null {
  const parsed = wassalhaSettingsSchema.safeParse(config);
  return parsed.success ? parsed.data : null;
}

/** The sheet's fixed per-row values for this store. */
export function wassalhaSheetDefaults(settings: WassalhaSettings): EgyptPostBatchDefaults {
  return {
    weightKg: WASSALHA_DEFAULT_WEIGHT_KG,
    volume: settings.volume,
    merchantCode: settings.postId,
    merchantName: settings.merchantName,
    warehouseName: settings.warehouseName,
    sellerName: settings.senderName,
    hasPod: settings.hasPod,
    extraNotes: settings.note,
  };
}
