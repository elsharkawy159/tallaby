/**
 * Payment evidence: the screenshot a customer attaches to a manual-transfer
 * order (owner, 2026-10-31; ROADMAP.md F-21p). Pure.
 *
 * Files go to the private `order-payment-proofs` bucket (0132) through server
 * code only, at `<order id>/<uuid>.<ext>`. `orders.metadata.paymentProof`
 * keeps the path; the dashboard shows it through a short-lived signed URL.
 */

export const PAYMENT_PROOF_BUCKET = "order-payment-proofs";
export const PAYMENT_PROOF_MAX_BYTES = 5 * 1024 * 1024;
export const PAYMENT_PROOF_TYPES = ["image/jpeg", "image/png", "image/webp"] as const;
export type PaymentProofType = (typeof PAYMENT_PROOF_TYPES)[number];
/** Seconds a dashboard link to the screenshot stays valid. */
export const PAYMENT_PROOF_URL_TTL = 300;

const EXT: Record<PaymentProofType, string> = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp" };
const UUID = "[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}";

/** The image type from the file's first bytes; the browser-sent type is not trusted. */
export function sniffPaymentProofType(bytes: Uint8Array): PaymentProofType | null {
  if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return "image/jpeg";
  if (bytes.length >= 8 && [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a].every((b, i) => bytes[i] === b)) return "image/png";
  if (
    bytes.length >= 12 &&
    String.fromCharCode(...bytes.slice(0, 4)) === "RIFF" &&
    String.fromCharCode(...bytes.slice(8, 12)) === "WEBP"
  ) {
    return "image/webp";
  }
  return null;
}

export function buildPaymentProofPath(orderId: string, fileId: string, type: PaymentProofType): string {
  return `${orderId}/${fileId}.${EXT[type]}`;
}

export type PaymentProof = { path: string; uploadedAt: string };

/** `orders.metadata.paymentProof` when it points inside this order's folder, else null. */
export function readPaymentProof(orderId: string, metadata: unknown): PaymentProof | null {
  if (!metadata || typeof metadata !== "object" || !new RegExp(`^${UUID}$`, "i").test(orderId)) return null;
  const raw = (metadata as Record<string, unknown>).paymentProof;
  if (!raw || typeof raw !== "object") return null;
  const { path, uploadedAt } = raw as Record<string, unknown>;
  if (typeof path !== "string" || !new RegExp(`^${orderId}/${UUID}\\.(jpg|png|webp)$`, "i").test(path)) return null;
  return { path, uploadedAt: typeof uploadedAt === "string" ? uploadedAt : "" };
}
