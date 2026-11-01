/**
 * Fetch a URL chosen by a third party without letting it reach Tallaby's own
 * network (SSRF guard). Used for CIMD client documents (F-29b) and, later,
 * product image imports (F-29f). https only, every resolved address must be
 * public, no redirects followed, size and time capped.
 *
 * Known gap: the address is checked before the connection, so a DNS rebind
 * between check and connect is possible. The fetched body is only parsed as
 * JSON/metadata and never echoed, which limits the damage.
 */
import { lookup } from "node:dns/promises";
import { isIP } from "node:net";
import { isPublicIp } from "./ip.lib";

export class SafeFetchError extends Error {
  constructor(readonly code: "bad_url" | "private_address" | "http_error" | "too_large" | "timeout" | "bad_body") {
    super(code);
    this.name = "SafeFetchError";
  }
}

async function assertPublicHost(hostname: string): Promise<void> {
  const host = hostname.replace(/^\[|\]$/g, "");
  if (isIP(host)) {
    if (!isPublicIp(host)) throw new SafeFetchError("private_address");
    return;
  }
  const lower = host.toLowerCase();
  if (lower === "localhost" || lower.endsWith(".localhost") || lower.endsWith(".internal") || lower.endsWith(".local")) {
    throw new SafeFetchError("private_address");
  }
  let addresses: { address: string }[];
  try {
    addresses = await lookup(host, { all: true, verbatim: true });
  } catch {
    throw new SafeFetchError("bad_url");
  }
  if (addresses.length === 0 || addresses.some((a) => !isPublicIp(a.address))) {
    throw new SafeFetchError("private_address");
  }
}

export type PublicImage = { bytes: Uint8Array; mime: "image/jpeg" | "image/png" | "image/webp"; ext: "jpg" | "png" | "webp" };

/** JPEG, PNG or WebP from the first bytes (the server's Content-Type is not trusted). */
export function sniffImage(bytes: Uint8Array): Pick<PublicImage, "mime" | "ext"> | null {
  if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return { mime: "image/jpeg", ext: "jpg" };
  if (bytes.length >= 8 && bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47) return { mime: "image/png", ext: "png" };
  const ascii = (from: number, to: number) => String.fromCharCode(...bytes.subarray(from, to));
  if (bytes.length >= 12 && ascii(0, 4) === "RIFF" && ascii(8, 12) === "WEBP") return { mime: "image/webp", ext: "webp" };
  return null;
}

/**
 * Downloads a product photo an MCP assistant pointed to (F-29f). Same guard as
 * fetchPublicJson, plus up to `maxRedirects` redirects (each target checked
 * again), and the body must really be a JPEG, PNG or WebP.
 */
export async function fetchPublicImage(
  rawUrl: string,
  { maxBytes = 5 * 1024 * 1024, timeoutMs = 10_000, maxRedirects = 2 }: { maxBytes?: number; timeoutMs?: number; maxRedirects?: number } = {},
): Promise<PublicImage> {
  let url: URL;
  try {
    url = new URL(rawUrl);
  } catch {
    throw new SafeFetchError("bad_url");
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    let response: Response | null = null;
    for (let hop = 0; hop <= maxRedirects; hop++) {
      if (url.protocol !== "https:" || url.username || url.password) throw new SafeFetchError("bad_url");
      await assertPublicHost(url.hostname);
      response = await fetch(url, {
        redirect: "manual",
        signal: controller.signal,
        headers: { accept: "image/jpeg,image/png,image/webp,image/*;q=0.8", "user-agent": "TallabyMCP/1.0 (+https://tallaby.com)" },
      });
      const location = response.headers.get("location");
      if (response.status >= 300 && response.status < 400 && location) {
        url = new URL(location, url);
        response = null;
        continue;
      }
      break;
    }
    if (!response || response.status !== 200 || !response.body) throw new SafeFetchError("http_error");

    const declared = Number(response.headers.get("content-length") ?? "0");
    if (declared > maxBytes) throw new SafeFetchError("too_large");
    const reader = response.body.getReader();
    const chunks: Uint8Array[] = [];
    let total = 0;
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      total += value.byteLength;
      if (total > maxBytes) {
        await reader.cancel();
        throw new SafeFetchError("too_large");
      }
      chunks.push(value);
    }
    const bytes = new Uint8Array(Buffer.concat(chunks));
    const kind = sniffImage(bytes);
    if (!kind) throw new SafeFetchError("bad_body");
    return { bytes, ...kind };
  } catch (error) {
    if (error instanceof SafeFetchError) throw error;
    if (controller.signal.aborted) throw new SafeFetchError("timeout");
    throw new SafeFetchError("http_error");
  } finally {
    clearTimeout(timer);
  }
}

export async function fetchPublicJson(
  rawUrl: string,
  { maxBytes = 16 * 1024, timeoutMs = 5000 }: { maxBytes?: number; timeoutMs?: number } = {},
): Promise<unknown> {
  let url: URL;
  try {
    url = new URL(rawUrl);
  } catch {
    throw new SafeFetchError("bad_url");
  }
  if (url.protocol !== "https:" || url.username || url.password) throw new SafeFetchError("bad_url");
  await assertPublicHost(url.hostname);

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, {
      redirect: "manual",
      signal: controller.signal,
      headers: { accept: "application/json" },
    });
    if (response.status !== 200 || !response.body) throw new SafeFetchError("http_error");

    const declared = Number(response.headers.get("content-length") ?? "0");
    if (declared > maxBytes) throw new SafeFetchError("too_large");

    const reader = response.body.getReader();
    const chunks: Uint8Array[] = [];
    let total = 0;
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      total += value.byteLength;
      if (total > maxBytes) {
        await reader.cancel();
        throw new SafeFetchError("too_large");
      }
      chunks.push(value);
    }
    const text = Buffer.concat(chunks).toString("utf8");
    try {
      return JSON.parse(text);
    } catch {
      throw new SafeFetchError("bad_body");
    }
  } catch (error) {
    if (error instanceof SafeFetchError) throw error;
    if (controller.signal.aborted) throw new SafeFetchError("timeout");
    throw new SafeFetchError("http_error");
  } finally {
    clearTimeout(timer);
  }
}
