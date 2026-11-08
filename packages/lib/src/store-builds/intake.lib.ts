import { z } from "zod";

/**
 * The tallaby.com hero composer's intake (ROADMAP.md F-82d, 0157; design:
 * docs/superpowers/specs/2026-11-08-ai-store-builder-v2-design.md §3). Pure
 * helpers shared by the browser, the ecommerce routes and the dashboard claim
 * route. Nothing here calls a model: before an account exists the intake is
 * only what the visitor typed, plus a code-read summary of their file.
 */

/** Private bucket, no storage policies (0157). Only the service role signs. */
export const STORE_BUILD_INTAKE_BUCKET = "store-build-intake";

export const INTAKE_LIMITS = {
  promptChars: 1000,
  fileBytes: 2 * 1024 * 1024,
  fileRows: 500,
  fileColumns: 30,
  logoBytes: Math.round(1.5 * 1024 * 1024),
  headerChars: 80,
  /** Intakes per IP hash per Cairo day (DB count). */
  perIpPerDay: 10,
} as const;

/** A signed-in seller's intake is claimed from the URL; the link works this long after it was made. */
export const INTAKE_SIGNED_IN_MAX_AGE_MS = 10 * 60_000;

export const INTAKE_FILE_TYPES = ["csv", "xlsx", "xls"] as const;
export const INTAKE_LOGO_TYPES = ["png", "jpeg", "webp"] as const;
export type IntakeFileType = (typeof INTAKE_FILE_TYPES)[number];
export type IntakeLogoType = (typeof INTAKE_LOGO_TYPES)[number];
export type IntakeObjectType = IntakeFileType | IntakeLogoType;
export type IntakeObjectKind = "file" | "logo";

export const INTAKE_CONTENT_TYPES: Record<IntakeObjectType, string> = {
  csv: "text/csv",
  xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  xls: "application/vnd.ms-excel",
  png: "image/png",
  jpeg: "image/jpeg",
  webp: "image/webp",
};

const EXTENSIONS: Record<IntakeObjectType, string> = { csv: "csv", xlsx: "xlsx", xls: "xls", png: "png", jpeg: "jpg", webp: "webp" };
const TYPE_BY_EXTENSION: Record<string, IntakeObjectType> = { csv: "csv", xlsx: "xlsx", xls: "xls", png: "png", jpg: "jpeg", jpeg: "jpeg", webp: "webp" };
const BASENAME: Record<IntakeObjectKind, string> = { file: "products", logo: "logo" };

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export const isIntakeId = (value: unknown): value is string => typeof value === "string" && UUID.test(value);

/** 32 random bytes as base64url (43 characters). */
const TOKEN = /^[A-Za-z0-9_-]{43}$/;
export const isIntakeToken = (value: unknown): value is string => typeof value === "string" && TOKEN.test(value);

export const intakeRefSchema = z.object({
  intakeId: z.string().refine(isIntakeId, "invalid_intake"),
  token: z.string().refine(isIntakeToken, "invalid_token"),
});
export type IntakeRef = z.infer<typeof intakeRefSchema>;

/** The code-read summary of the product file (rows, valid names, rows missing a price, headers). */
export const intakeFileSummarySchema = z
  .object({
    rows: z.number().int().min(0).max(INTAKE_LIMITS.fileRows),
    valid: z.number().int().min(0).max(INTAKE_LIMITS.fileRows),
    missingPrice: z.number().int().min(0).max(INTAKE_LIMITS.fileRows),
    headers: z.array(z.string().max(INTAKE_LIMITS.headerChars)).max(INTAKE_LIMITS.fileColumns),
  })
  .refine((s) => s.valid <= s.rows && s.missingPrice <= s.rows, "summary_counts");
export type IntakeFileSummary = z.infer<typeof intakeFileSummarySchema>;

const HEX = /^#[0-9a-fA-F]{6}$/;

/** POST /api/store-build/intake body. At least a prompt, a file or a logo. */
export const intakeCreateSchema = z
  .object({
    prompt: z.string().trim().max(INTAKE_LIMITS.promptChars).default(""),
    primaryColor: z.string().regex(HEX).nullish(),
    locale: z.enum(["ar", "en"]).default("ar"),
    file: z
      .object({ type: z.enum(INTAKE_FILE_TYPES), size: z.number().int().positive().max(INTAKE_LIMITS.fileBytes) })
      .nullish(),
    logo: z
      .object({ type: z.enum(INTAKE_LOGO_TYPES), size: z.number().int().positive().max(INTAKE_LIMITS.logoBytes) })
      .nullish(),
    fileSummary: intakeFileSummarySchema.nullish(),
  })
  .refine((v) => v.prompt.length > 0 || Boolean(v.file) || Boolean(v.logo), "empty")
  .refine((v) => !v.fileSummary || Boolean(v.file), "summary_without_file");
export type IntakeCreateInput = z.input<typeof intakeCreateSchema>;
export type IntakeCreateValue = z.output<typeof intakeCreateSchema>;

/** The file or logo type from a file name, or null for anything else (SVG included). */
export function intakeTypeFromName(name: string): IntakeObjectType | null {
  const ext = /\.([a-z0-9]+)$/i.exec(name.trim())?.[1]?.toLowerCase();
  return ext ? (TYPE_BY_EXTENSION[ext] ?? null) : null;
}

export const isIntakeFileType = (t: IntakeObjectType | null): t is IntakeFileType =>
  (INTAKE_FILE_TYPES as readonly string[]).includes(t ?? "");
export const isIntakeLogoType = (t: IntakeObjectType | null): t is IntakeLogoType =>
  (INTAKE_LOGO_TYPES as readonly string[]).includes(t ?? "");

/** Where the browser uploads before signup: `guest/<intakeId>/products.xlsx`, `guest/<intakeId>/logo.png`. */
export function guestIntakePath(intakeId: string, kind: IntakeObjectKind, type: IntakeObjectType): string {
  return `guest/${intakeId}/${BASENAME[kind]}.${EXTENSIONS[type]}`;
}

export const guestIntakeFolder = (intakeId: string) => `guest/${intakeId}`;

/** The same object once claimed: `<sellerId>/<intakeId>/logo.png`. */
export function claimedIntakePath(sellerId: string, guestPath: string): string | null {
  const match = /^guest\/([0-9a-f-]{36})\/([a-z]+\.[a-z]+)$/i.exec(guestPath);
  return match ? `${sellerId}/${match[1]}/${match[2]}` : null;
}

/** An object name in the intake folder (`logo.png`) as its kind and type, or null when it is not one we signed. */
export function parseIntakeObjectName(name: string): { kind: IntakeObjectKind; type: IntakeObjectType } | null {
  const match = /^(products|logo)\.([a-z]+)$/.exec(name);
  if (!match) return null;
  const kind: IntakeObjectKind = match[1] === "products" ? "file" : "logo";
  const type = TYPE_BY_EXTENSION[match[2]!] ?? null;
  if (!type || EXTENSIONS[type] !== match[2]) return null;
  if (kind === "file" ? !isIntakeFileType(type) : !isIntakeLogoType(type)) return null;
  return { kind, type };
}

export const intakeByteLimit = (kind: IntakeObjectKind) => (kind === "file" ? INTAKE_LIMITS.fileBytes : INTAKE_LIMITS.logoBytes);

// ── File type from the bytes ─────────────────────────────────────────────────

export type SniffedKind = "png" | "jpeg" | "webp" | "zip" | "ole" | "text" | "unknown";

const startsWith = (bytes: Uint8Array, magic: readonly number[], offset = 0) =>
  bytes.length >= offset + magic.length && magic.every((b, i) => bytes[offset + i] === b);

const PNG = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
const JPEG = [0xff, 0xd8, 0xff];
const RIFF = [0x52, 0x49, 0x46, 0x46];
const WEBP = [0x57, 0x45, 0x42, 0x50];
const ZIP = [0x50, 0x4b, 0x03, 0x04];
const OLE = [0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1];

/** What the first bytes say the file is. Text is "no NUL byte in the first 4 KB". */
export function sniffBytes(bytes: Uint8Array): SniffedKind {
  if (startsWith(bytes, PNG)) return "png";
  if (startsWith(bytes, JPEG)) return "jpeg";
  if (startsWith(bytes, RIFF) && startsWith(bytes, WEBP, 8)) return "webp";
  if (startsWith(bytes, ZIP)) return "zip";
  if (startsWith(bytes, OLE)) return "ole";
  if (bytes.length === 0) return "unknown";
  const head = bytes.subarray(0, 4096);
  for (const byte of head) if (byte === 0) return "unknown";
  return "text";
}

const EXPECTED: Record<IntakeObjectType, SniffedKind> = { png: "png", jpeg: "jpeg", webp: "webp", xlsx: "zip", xls: "ole", csv: "text" };

/** The bytes are what the name says (an SVG or HTML named .png fails here). */
export const bytesMatchType = (type: IntakeObjectType, bytes: Uint8Array) => sniffBytes(bytes) === EXPECTED[type];

// ── Claims ───────────────────────────────────────────────────────────────────

export type IntakeClaimError = "not_found" | "wrong_token" | "expired" | "claimed" | "too_old";

export type IntakeClaimRow = {
  tokenHash: string;
  sellerId: string | null;
  claimedAt: string | Date | null;
  expiresAt: string | Date;
  createdAt: string | Date;
};

const time = (value: string | Date) => (value instanceof Date ? value.getTime() : new Date(value).getTime());

/** Constant-time compare of two hex hashes. */
export function sameHash(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

/**
 * Whether `sellerId` may claim this intake with a token whose hash is
 * `tokenHash`. A second claim by the same seller with the right token is fine
 * (a refreshed callback); anyone else gets `claimed`. `maxAgeMs` is the
 * signed-in path's 10-minute window.
 */
export function decideIntakeClaim(
  row: IntakeClaimRow | null | undefined,
  tokenHash: string,
  sellerId: string,
  now: number,
  maxAgeMs?: number,
): { ok: true; already: boolean } | { ok: false; error: IntakeClaimError } {
  if (!row) return { ok: false, error: "not_found" };
  if (!sameHash(row.tokenHash, tokenHash)) return { ok: false, error: "wrong_token" };
  if (row.claimedAt) return row.sellerId === sellerId ? { ok: true, already: true } : { ok: false, error: "claimed" };
  if (time(row.expiresAt) <= now) return { ok: false, error: "expired" };
  if (maxAgeMs !== undefined && now - time(row.createdAt) > maxAgeMs) return { ok: false, error: "too_old" };
  return { ok: true, already: false };
}

/** An unclaimed, unexpired intake the token opens (used before writing it into signup). */
export function intakeIsOpen(row: IntakeClaimRow | null | undefined, tokenHash: string, now: number): boolean {
  return Boolean(row && sameHash(row.tokenHash, tokenHash) && !row.claimedAt && time(row.expiresAt) > now);
}

export const isOverDailyIntakeLimit = (countToday: number) => countToday >= INTAKE_LIMITS.perIpPerDay;
