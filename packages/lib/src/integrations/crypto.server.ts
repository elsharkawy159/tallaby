import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";
import type { IntegrationProvider } from "./registry";

/**
 * Integration secrets at rest (PLAN.md §9.1, P7-01): AES-256-GCM with the
 * server-only key INTEGRATIONS_ENCRYPTION_KEY (32 bytes, base64 or hex; never
 * NEXT_PUBLIC_). The store id and provider are bound as additional
 * authenticated data, so a ciphertext copied to another store's row does not
 * decrypt. Never log the plaintext or the key.
 *
 * Format: `v1.<iv>.<tag>.<ciphertext>` (base64url parts).
 */

const VERSION = "v1";
const IV_BYTES = 12;

export class IntegrationCryptoError extends Error {
  constructor(public readonly code: "missing_key" | "invalid_key" | "invalid_payload" | "decrypt_failed") {
    super(`integration crypto: ${code}`);
    this.name = "IntegrationCryptoError";
  }
}

export type CredentialBinding = { storeId: string; provider: IntegrationProvider };

/** Parses a 32-byte key given as 64 hex characters or base64/base64url. */
export function parseIntegrationKey(raw: string | undefined = process.env.INTEGRATIONS_ENCRYPTION_KEY): Buffer {
  const value = raw?.trim();
  if (!value) throw new IntegrationCryptoError("missing_key");
  const key = /^[0-9a-fA-F]{64}$/.test(value) ? Buffer.from(value, "hex") : Buffer.from(value, "base64");
  if (key.length !== 32) throw new IntegrationCryptoError("invalid_key");
  return key;
}

function aad({ storeId, provider }: CredentialBinding): Buffer {
  return Buffer.from(`store_integrations:${storeId}:${provider}`, "utf8");
}

export function encryptCredentials(
  credentials: Record<string, unknown>,
  binding: CredentialBinding,
  key: Buffer = parseIntegrationKey(),
): string {
  const iv = randomBytes(IV_BYTES);
  const cipher = createCipheriv("aes-256-gcm", key, iv);
  cipher.setAAD(aad(binding));
  const ciphertext = Buffer.concat([cipher.update(JSON.stringify(credentials), "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return [VERSION, iv.toString("base64url"), tag.toString("base64url"), ciphertext.toString("base64url")].join(".");
}

export function decryptCredentials<T extends Record<string, unknown> = Record<string, unknown>>(
  payload: string,
  binding: CredentialBinding,
  key: Buffer = parseIntegrationKey(),
): T {
  const parts = payload.split(".");
  if (parts.length !== 4 || parts[0] !== VERSION) throw new IntegrationCryptoError("invalid_payload");
  const [, ivPart, tagPart, dataPart] = parts as [string, string, string, string];
  const iv = Buffer.from(ivPart, "base64url");
  const tag = Buffer.from(tagPart, "base64url");
  if (iv.length !== IV_BYTES || tag.length !== 16) throw new IntegrationCryptoError("invalid_payload");

  try {
    const decipher = createDecipheriv("aes-256-gcm", key, iv);
    decipher.setAAD(aad(binding));
    decipher.setAuthTag(tag);
    const plaintext = Buffer.concat([decipher.update(Buffer.from(dataPart, "base64url")), decipher.final()]);
    return JSON.parse(plaintext.toString("utf8")) as T;
  } catch {
    throw new IntegrationCryptoError("decrypt_failed");
  }
}
