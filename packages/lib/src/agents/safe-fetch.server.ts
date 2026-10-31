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
