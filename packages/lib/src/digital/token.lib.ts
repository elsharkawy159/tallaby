import { randomBytes } from "crypto";

/** A download link's secret: 32 random bytes as 64 hex characters. */
export function generateDownloadToken(): string {
  return randomBytes(32).toString("hex");
}
