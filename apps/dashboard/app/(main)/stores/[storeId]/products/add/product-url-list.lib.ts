import { MAX_BULK_IMPORT_URLS } from "./parse-product-import.types";

export interface ProductUrlList {
  /** Valid, de-duplicated http(s) links, at most `max`, in the order pasted. */
  urls: string[]
  /** What looked like a link but isn't one (kept as typed, for the message). */
  invalid: string[]
  /** Repeats dropped. */
  duplicates: number
  /** Valid links after the first `max`, left out. */
  overLimit: number
}

/** Brackets, quotes and sentence punctuation around a pasted link. */
const EDGE = /^[\s"'`<([{«]+|[\s"'`>)\]}»,;.!?،؛]+$/g;

/** A token worth treating as a link: a scheme, `www.`, or a host with a path. */
const looksLikeLink = (token: string) =>
  /^https?:\/\//i.test(token) || /^www\./i.test(token) || /^[\w-]+(\.[\w-]+)+\/\S*/.test(token);

/** The link to fetch, or null: http(s) only, with a dotted host, without the #fragment. */
export function normalizeProductUrl (token: string): string | null {
  const raw = /^https?:\/\//i.test(token) ? token : `https://${token}`;
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    return null;
  }
  if (url.protocol !== "http:" && url.protocol !== "https:") return null;
  if (!url.hostname.includes(".") || url.username || url.password) return null;
  url.hash = "";
  return url.href;
}

/**
 * The product links in what the seller pasted: one per line, or a list
 * separated by spaces or commas, or links inside a message. Other words are
 * ignored; repeats are dropped; only the first `max` are kept.
 */
export function parseProductUrlList (input: string, max: number = MAX_BULK_IMPORT_URLS): ProductUrlList {
  const seen = new Set<string>();
  const valid: string[] = [];
  const invalid: string[] = [];
  let duplicates = 0;

  // A comma inside a link's query stays; one between links splits them.
  for (const piece of input.split(/\s+|[,،](?=\s|https?:\/\/|www\.)/i)) {
    const token = piece.replace(EDGE, "");
    if (!token || !looksLikeLink(token)) continue;
    const url = normalizeProductUrl(token);
    if (!url) {
      invalid.push(token);
      continue;
    }
    if (seen.has(url)) {
      duplicates++;
      continue;
    }
    seen.add(url);
    valid.push(url);
  }

  return {
    urls: valid.slice(0, max),
    invalid,
    duplicates,
    overLimit: Math.max(0, valid.length - max),
  };
}

/** A long link as host plus a short path, for one line on a phone: "noon.com/…/p-123". */
export function shortProductUrl (href: string): string {
  try {
    const url = new URL(href);
    const host = url.hostname.replace(/^www\./, "");
    const parts = url.pathname.split("/").filter(Boolean);
    if (parts.length === 0) return host;
    const last = decodeSafe(parts[parts.length - 1]!);
    const tail = last.length > 28 ? `${last.slice(0, 27)}…` : last;
    return parts.length > 1 ? `${host}/…/${tail}` : `${host}/${tail}`;
  } catch {
    return href.length > 40 ? `${href.slice(0, 39)}…` : href;
  }
}

function decodeSafe (value: string) {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}
