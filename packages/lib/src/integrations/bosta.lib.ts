import { z } from "zod";
import type { BostaPackageSize } from "../shipping/bosta/bosta.types";

/**
 * Per-store Bosta settings (docs/superpowers/plans/2026-10-26-bosta-shipping.md
 * §4.1). Pure. They live in `store_integrations.config` (public, shown in the
 * dashboard); the API key and the webhook token are in `credentials_encrypted`.
 */

export const BOSTA_AUTO_SHIP = ["manual", "on_confirm"] as const;
export type BostaAutoShip = (typeof BOSTA_AUTO_SHIP)[number];

export const BOSTA_PACKAGE_SIZES = ["SMALL", "MEDIUM", "LARGE"] as const satisfies readonly BostaPackageSize[];

export const BOSTA_NOTE_MAX = 200;

export type BostaSettings = {
  pickupLocationId: string | null;
  pickupLocationName: string | null;
  /** When the Bosta shipment is created; manual is the default (owner, 2026-10-26). */
  autoShip: BostaAutoShip;
  size: BostaPackageSize;
  allowToOpenPackage: boolean;
  /** Added to every shipment's notes. */
  note: string;
  /** The key's last 4 characters, so the seller can tell keys apart. */
  keyHint: string | null;
  /** The seller says the key has Full access, so Tallaby may cancel shipments. */
  canCancel: boolean;
};

export const DEFAULT_BOSTA_SETTINGS: BostaSettings = {
  pickupLocationId: null,
  pickupLocationName: null,
  autoShip: "manual",
  size: "SMALL",
  allowToOpenPackage: false,
  note: "",
  keyHint: null,
  canCancel: false,
};

/** Reads stored settings, falling back to the default for anything missing or invalid. */
export function readBostaSettings(config: unknown): BostaSettings {
  const source = config && typeof config === "object" ? (config as Record<string, unknown>) : {};
  const text = (value: unknown, max: number) => (typeof value === "string" && value.length <= max ? value : null);
  return {
    pickupLocationId: text(source.pickupLocationId, 64) || null,
    pickupLocationName: text(source.pickupLocationName, 200) || null,
    autoShip: (BOSTA_AUTO_SHIP as readonly unknown[]).includes(source.autoShip) ? (source.autoShip as BostaAutoShip) : "manual",
    size: (BOSTA_PACKAGE_SIZES as readonly unknown[]).includes(source.size) ? (source.size as BostaPackageSize) : "SMALL",
    allowToOpenPackage: source.allowToOpenPackage === true,
    note: text(source.note, BOSTA_NOTE_MAX) ?? "",
    keyHint: text(source.keyHint, 4) || null,
    canCancel: source.canCancel === true,
  };
}

/** Bosta keys are long opaque tokens; this only rejects obvious paste mistakes. */
const apiKeySchema = z
  .string()
  .trim()
  .max(512)
  .refine((value) => value === "" || /^[\x21-\x7e]{16,512}$/.test(value), "invalid_key");

export function bostaKeyHint(apiKey: string): string {
  return apiKey.slice(-4);
}

export type BostaKeyInputError = "invalid_key";

/** The pasted key; an empty string means "keep the saved key". */
export function validateBostaKeyInput(raw: unknown): { success: true; apiKey: string } | { success: false; error: BostaKeyInputError } {
  const parsed = apiKeySchema.safeParse(raw ?? "");
  return parsed.success ? { success: true, apiKey: parsed.data } : { success: false, error: "invalid_key" };
}

const settingsSchema = z
  .object({
    pickupLocationId: z.string().trim().min(1).max(64),
    autoShip: z.enum(BOSTA_AUTO_SHIP),
    size: z.enum(BOSTA_PACKAGE_SIZES),
    allowToOpenPackage: z.boolean(),
    note: z.string().trim().max(BOSTA_NOTE_MAX),
    canCancel: z.boolean(),
  })
  .partial()
  .strict();

export type BostaSettingsInput = z.infer<typeof settingsSchema>;

/** A partial settings update from the dashboard; unknown keys are rejected. */
export function validateBostaSettingsInput(
  raw: unknown,
): { success: true; data: BostaSettingsInput } | { success: false; error: "invalid_settings" } {
  const parsed = settingsSchema.safeParse(raw);
  return parsed.success ? { success: true, data: parsed.data } : { success: false, error: "invalid_settings" };
}

/** Bosta's public tracking page for a shipment. */
export function bostaTrackingUrl(trackingNumber: string): string {
  return `https://bosta.co/tracking-shipments?shipment-number=${encodeURIComponent(trackingNumber)}`;
}
