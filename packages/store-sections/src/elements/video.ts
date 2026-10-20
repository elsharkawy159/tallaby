/**
 * Video links for the `video`, `videoPlaylist` and `videoItem` elements.
 * Sellers paste a link from YouTube, Vimeo, TikTok, Instagram or Facebook,
 * or a direct video file. Only checked ids survive, and every player is a
 * fixed embed address built from them (no seller HTML, CLAUDE.md rule 9).
 * Pure, so the editor previews the same parsing.
 */

export const VIDEO_PROVIDERS = ["youtube", "vimeo", "tiktok", "instagram", "facebook", "file"] as const;
export type VideoProvider = (typeof VIDEO_PROVIDERS)[number];

export type VideoSource =
  | { provider: "youtube"; id: string; short: boolean }
  | { provider: "vimeo"; id: string; hash?: string }
  | { provider: "tiktok"; id: string }
  | { provider: "instagram"; id: string; kind: "p" | "reel" | "tv" }
  | { provider: "facebook"; id: string; kind: "video" | "reel" }
  | { provider: "file"; url: string };

const YT_ID = /^[A-Za-z0-9_-]{11}$/;
const NUMERIC = (min: number, max: number) => new RegExp(`^\\d{${min},${max}}$`);
const IG_CODE = /^[A-Za-z0-9_-]{5,40}$/;
const FILE_EXT = /\.(mp4|webm|mov|m4v)$/i;

const host = (url: URL) => url.hostname.toLowerCase().replace(/^(www|m|web|music)\./, "");
const segments = (url: URL) => url.pathname.split("/").filter(Boolean);

function toUrl(input: string): URL | null {
  try {
    const url = new URL(/^https?:\/\//i.test(input) ? input : `https://${input}`);
    return url.protocol === "https:" || url.protocol === "http:" ? url : null;
  } catch {
    return null;
  }
}

function youtube(url: URL): VideoSource | null {
  const h = host(url);
  let id: string | null = null;
  if (h === "youtu.be") id = segments(url)[0] ?? null;
  else if (h === "youtube.com" || h === "youtube-nocookie.com") {
    const [first, second] = segments(url);
    if (first === "watch") id = url.searchParams.get("v");
    else if (first === "shorts" || first === "embed" || first === "live" || first === "v") id = second ?? null;
  }
  return id && YT_ID.test(id) ? { provider: "youtube", id, short: /\/shorts\//i.test(url.pathname) } : null;
}

function vimeo(url: URL): VideoSource | null {
  const h = host(url);
  if (h !== "vimeo.com" && h !== "player.vimeo.com") return null;
  const parts = segments(url);
  const index = parts.findIndex((p) => NUMERIC(6, 12).test(p));
  if (index < 0) return null;
  const hash = url.searchParams.get("h") ?? parts[index + 1];
  return { provider: "vimeo", id: parts[index]!, ...(hash && /^[0-9a-f]{6,20}$/i.test(hash) && { hash }) };
}

function tiktok(url: URL): VideoSource | null {
  if (host(url) !== "tiktok.com") return null;
  const parts = segments(url);
  // /@user/video/ID, /embed/v2/ID, /player/v1/ID
  const at = parts.indexOf("video");
  const id = at >= 0 ? parts[at + 1] : parts[0] === "embed" || parts[0] === "player" ? parts.at(-1) : undefined;
  return id && NUMERIC(15, 22).test(id) ? { provider: "tiktok", id } : null;
}

function instagram(url: URL): VideoSource | null {
  if (host(url) !== "instagram.com") return null;
  const parts = segments(url);
  // /p/CODE, /reel/CODE, /reels/CODE, /tv/CODE (also after a /username/ prefix)
  const index = parts.findIndex((p) => p === "p" || p === "reel" || p === "reels" || p === "tv");
  const code = index >= 0 ? parts[index + 1] : undefined;
  if (!code || !IG_CODE.test(code)) return null;
  const kind = parts[index] === "p" ? "p" : parts[index] === "tv" ? "tv" : "reel";
  return { provider: "instagram", id: code, kind };
}

function facebook(url: URL): VideoSource | null {
  if (host(url) !== "facebook.com") return null;
  const parts = segments(url);
  const id = NUMERIC(5, 25);
  const v = url.searchParams.get("v");
  if ((parts[0] === "watch" || parts[0] === "video.php") && v && id.test(v)) return { provider: "facebook", id: v, kind: "video" };
  if (parts[0] === "reel" && parts[1] && id.test(parts[1])) return { provider: "facebook", id: parts[1], kind: "reel" };
  const index = parts.indexOf("videos");
  const found = index >= 0 ? parts.slice(index + 1).find((p) => id.test(p)) : undefined;
  return found ? { provider: "facebook", id: found, kind: "video" } : null;
}

/** The video a link points to, or `null` when it is not one we can play. */
export function parseVideoUrl(input: unknown): VideoSource | null {
  if (typeof input !== "string") return null;
  const value = input.trim();
  if (!value || value.length > 2048) return null;
  if (YT_ID.test(value)) return { provider: "youtube", id: value, short: false };
  const url = toUrl(value);
  if (!url) return null;
  const parsed = youtube(url) ?? vimeo(url) ?? tiktok(url) ?? instagram(url) ?? facebook(url);
  if (parsed) return parsed;
  if (url.protocol === "https:" && FILE_EXT.test(url.pathname)) return { provider: "file", url: url.toString() };
  return null;
}

/** Why a link can't be used: a share short link (vm.tiktok.com, fb.watch…) needs the full address. */
export function videoLinkProblem(input: unknown): "short-link" | "unsupported" | null {
  if (typeof input !== "string" || !input.trim() || parseVideoUrl(input)) return null;
  const url = toUrl(input.trim());
  const h = url ? host(url) : "";
  return ["vm.tiktok.com", "vt.tiktok.com", "fb.watch", "instagr.am"].includes(h) ? "short-link" : "unsupported";
}

/** What each site's player can do (the inspector hides the rest). */
export const VIDEO_CAPABILITIES: Record<VideoProvider, { autoplay: boolean; muted: boolean; loop: boolean; controls: boolean; start: boolean; end: boolean; still: boolean }> = {
  youtube: { autoplay: true, muted: true, loop: true, controls: true, start: true, end: true, still: true },
  vimeo: { autoplay: true, muted: true, loop: true, controls: true, start: true, end: false, still: false },
  tiktok: { autoplay: true, muted: false, loop: true, controls: true, start: false, end: false, still: false },
  instagram: { autoplay: false, muted: false, loop: false, controls: false, start: false, end: false, still: false },
  facebook: { autoplay: true, muted: true, loop: false, controls: false, start: true, end: false, still: false },
  file: { autoplay: true, muted: true, loop: true, controls: true, start: true, end: true, still: false },
};

export const VIDEO_THUMBNAILS = ["auto", "custom", "none"] as const;
export type VideoThumbnail = (typeof VIDEO_THUMBNAILS)[number];

export type VideoOptions = {
  source: VideoSource;
  autoplay: boolean;
  muted: boolean;
  loop: boolean;
  controls: boolean;
  /** Seconds. */
  start?: number;
  end?: number;
  thumbnail: VideoThumbnail;
};

const seconds = (value: unknown) => (typeof value === "number" && Number.isFinite(value) && value > 0 ? Math.min(Math.floor(value), 86_400) : undefined);

/** The player options a node's props describe (only what its site supports), or `null` without a playable link. */
export function readVideoOptions(props: Record<string, unknown>): VideoOptions | null {
  const source = parseVideoUrl(props.url);
  if (!source) return null;
  const can = VIDEO_CAPABILITIES[source.provider];
  const start = can.start ? seconds(props.start) : undefined;
  let end = can.end ? seconds(props.end) : undefined;
  if (end !== undefined && start !== undefined && end <= start) end = undefined;
  const autoplay = can.autoplay && props.autoplay === true;
  return {
    source,
    autoplay,
    // Browsers only autoplay muted videos.
    muted: can.muted && (autoplay || props.muted === true),
    loop: can.loop && props.loop === true,
    controls: !can.controls || props.controls !== false,
    start,
    end,
    // Autoplay starts the player at once, so there is no thumbnail to click.
    thumbnail: autoplay ? "none" : (VIDEO_THUMBNAILS.find((v) => v === props.thumbnail) ?? "auto"),
  };
}

/** The player address; `play` starts it at once (after a thumbnail or playlist click). */
export function videoEmbedUrl(options: VideoOptions, play = options.autoplay): string {
  const { source } = options;
  switch (source.provider) {
    case "youtube": {
      const params = new URLSearchParams({ rel: "0", playsinline: "1" });
      if (play) params.set("autoplay", "1");
      if (options.muted) params.set("mute", "1");
      if (options.loop) {
        params.set("loop", "1");
        params.set("playlist", source.id);
      }
      if (!options.controls) params.set("controls", "0");
      if (options.start) params.set("start", String(options.start));
      if (options.end) params.set("end", String(options.end));
      return `https://www.youtube-nocookie.com/embed/${source.id}?${params.toString()}`;
    }
    case "vimeo": {
      const params = new URLSearchParams({ dnt: "1" });
      if (source.hash) params.set("h", source.hash);
      if (play) params.set("autoplay", "1");
      if (options.muted) params.set("muted", "1");
      if (options.loop) params.set("loop", "1");
      if (!options.controls) params.set("controls", "0");
      return `https://player.vimeo.com/video/${source.id}?${params.toString()}${options.start ? `#t=${options.start}s` : ""}`;
    }
    case "tiktok": {
      const params = new URLSearchParams({ music_info: "0", description: "0", rel: "0" });
      if (play) params.set("autoplay", "1");
      if (options.loop) params.set("loop", "1");
      if (!options.controls) params.set("controls", "0");
      return `https://www.tiktok.com/player/v1/${source.id}?${params.toString()}`;
    }
    case "instagram":
      return `https://www.instagram.com/${source.kind}/${source.id}/embed/`;
    case "facebook": {
      const page = source.kind === "reel" ? `https://www.facebook.com/reel/${source.id}` : `https://www.facebook.com/watch/?v=${source.id}`;
      const params = new URLSearchParams({ href: page, show_text: "false" });
      if (play) params.set("autoplay", "true");
      if (options.muted) params.set("mute", "1");
      if (options.start) params.set("t", String(options.start));
      return `https://www.facebook.com/plugins/video.php?${params.toString()}`;
    }
    case "file": {
      if (!options.start && !options.end) return source.url;
      return `${source.url.split("#")[0]}#t=${options.start ?? 0}${options.end ? `,${options.end}` : ""}`;
    }
  }
}

/** The site's own still of the video, when it publishes one at a fixed address (YouTube). */
export function videoStillUrl(source: VideoSource): string | null {
  return source.provider === "youtube" ? `https://i.ytimg.com/vi/${source.id}/hqdefault.jpg` : null;
}

/** The video's page on its site (the editor's "open" link). */
export function videoPageUrl(source: VideoSource): string {
  switch (source.provider) {
    case "youtube":
      return `https://www.youtube.com/watch?v=${source.id}`;
    case "vimeo":
      return `https://vimeo.com/${source.id}${source.hash ? `/${source.hash}` : ""}`;
    case "tiktok":
      return `https://www.tiktok.com/player/v1/${source.id}`;
    case "instagram":
      return `https://www.instagram.com/${source.kind}/${source.id}/`;
    case "facebook":
      return source.kind === "reel" ? `https://www.facebook.com/reel/${source.id}` : `https://www.facebook.com/watch/?v=${source.id}`;
    case "file":
      return source.url;
  }
}

const escapeAttr = (value: string) => value.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/'/g, "&#39;");

/**
 * A light thumbnail page for the player frame (`srcdoc`): the still and a play
 * button linking to the player with autoplay, so the site loads only on click.
 * A fixed template; every value is an escaped, already-checked URL or title.
 */
export function videoFacadeDoc(options: VideoOptions, poster: string, title: string): string {
  return [
    "<!doctype html><html><head><meta charset='utf-8'><style>",
    "*{margin:0;padding:0;box-sizing:border-box}html,body{height:100%;overflow:hidden;background:#000}",
    "a{position:relative;display:block;height:100%}img{width:100%;height:100%;object-fit:cover}",
    "span{position:absolute;top:50%;left:50%;width:68px;height:48px;margin:-24px 0 0 -34px;border-radius:14px;background:rgba(18,18,18,.82);transition:background .2s}",
    "a:hover span,a:focus-visible span{background:#e11}span:after{content:'';position:absolute;top:14px;left:27px;border-style:solid;border-width:10px 0 10px 17px;border-color:transparent transparent transparent #fff}",
    "</style></head><body>",
    `<a href="${escapeAttr(videoEmbedUrl(options, true))}" aria-label="${escapeAttr(title)}">`,
    `<img src="${escapeAttr(poster)}" alt="" loading="lazy"><span></span></a>`,
    "</body></html>",
  ].join("");
}
