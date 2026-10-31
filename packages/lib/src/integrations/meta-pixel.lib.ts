/**
 * Tallaby's own Meta Pixel in the browser (dataset "Tallaby_dataset",
 * 3628548033960332), shared by tallaby.com (apps/ecommerce) and
 * dashboard.tallaby.com (apps/dashboard). Never on seller storefronts: they
 * carry the seller's own pixel. Client-safe, no React; each app mounts a small
 * component that calls `trackTallabyPageView` on route changes.
 *
 * - ID: `NEXT_PUBLIC_META_PIXEL_ID` (empty = no pixel).
 * - Loads only on the production hosts below, never in a frame, so localhost,
 *   *.local, Vercel previews and staging send nothing.
 * - Meta's base code loads once; `init` runs once. Meta's own SPA tracking
 *   (PageView on pushState) is turned off: we send PageView per pathname.
 * - CompleteRegistration: `trackTallabySignup`, see docs/meta-pixel.md.
 * - No advanced matching (no email/phone to the pixel).
 */
import { signupEventParams, type SignupMethod } from "./meta-signup.lib";

/** The only hosts Tallaby's pixel (and its signup CAPI event) may report from. */
export const TALLABY_PIXEL_HOSTS: readonly string[] = ["tallaby.com", "www.tallaby.com", "dashboard.tallaby.com"];

export function isTallabyPixelHost(host: string | null | undefined): boolean {
  const hostname = String(host ?? "").trim().toLowerCase().replace(/:\d+$/, "").replace(/\.$/, "");
  return TALLABY_PIXEL_HOSTS.includes(hostname);
}

/** Same check for a full URL (a server event's `event_source_url`). */
export function isTallabyPixelUrl(url: string | null | undefined): boolean {
  try {
    const parsed = new URL(String(url ?? ""));
    return parsed.protocol === "https:" && isTallabyPixelHost(parsed.hostname);
  } catch {
    return false;
  }
}

type Fbq = ((...args: unknown[]) => void) & {
  callMethod?: (...args: unknown[]) => void;
  queue: unknown[];
  push: Fbq;
  loaded: boolean;
  version: string;
  disablePushState?: boolean;
};

export type PixelWindow = {
  fbq?: Fbq;
  _fbq?: Fbq;
  __tallabyPixelId?: string;
  __tallabyLastPageView?: string;
  self: unknown;
  top: unknown;
  location: { hostname: string };
  localStorage?: Pick<Storage, "getItem" | "setItem">;
  document: {
    createElement(tag: "script"): { async: boolean; src: string };
    head: { appendChild(node: unknown): unknown };
  };
};

const FBEVENTS_SRC = "https://connect.facebook.net/en_US/fbevents.js";

function browserWindow(): PixelWindow | null {
  return typeof window === "undefined" ? null : (window as unknown as PixelWindow);
}

/**
 * Meta's fbq on an allowed host, loading the base code and running `init`
 * the first time; null when the pixel must not run here. Calls made before
 * fbevents.js arrives are queued by the stub, as in Meta's own snippet.
 */
export function tallabyPixel(pixelId: string | undefined, win: PixelWindow | null = browserWindow()): Fbq | null {
  if (!win || !pixelId || !/^\d{15,16}$/.test(pixelId)) return null;
  if (!isTallabyPixelHost(win.location.hostname) || win.self !== win.top) return null;

  if (!win.fbq) {
    const n = function (...args: unknown[]) {
      if (n.callMethod) n.callMethod(...args);
      else n.queue.push(args);
    } as Fbq;
    n.push = n;
    n.loaded = true;
    n.version = "2.0";
    n.queue = [];
    win.fbq = n;
    if (!win._fbq) win._fbq = n;
    const script = win.document.createElement("script");
    script.async = true;
    script.src = FBEVENTS_SRC;
    win.document.head.appendChild(script);
  }
  if (win.__tallabyPixelId !== pixelId) {
    win.__tallabyPixelId = pixelId;
    // We send PageView per route ourselves; Meta's history tracking would double it.
    win.fbq.disablePushState = true;
    win.fbq("init", pixelId);
  }
  return win.fbq;
}

/** PageView once per pathname (initial load included); a repeat of the same path is ignored. */
export function trackTallabyPageView(
  pixelId: string | undefined,
  pathname: string,
  win: PixelWindow | null = browserWindow(),
): void {
  try {
    const fbq = tallabyPixel(pixelId, win);
    if (!fbq || !win || win.__tallabyLastPageView === pathname) return;
    win.__tallabyLastPageView = pathname;
    fbq("track", "PageView");
  } catch {
    // Ad blockers / CSP must never break the page.
  }
}

/**
 * CompleteRegistration for a new seller account, once per account and
 * browser (`tb_reg_sent_<event id>` in localStorage). The event id is the one
 * the server's CAPI event uses, so Meta keeps one of the two.
 */
export function trackTallabySignup(
  pixelId: string | undefined,
  eventId: string,
  method: SignupMethod,
  win: PixelWindow | null = browserWindow(),
): boolean {
  try {
    const fbq = tallabyPixel(pixelId, win);
    if (!fbq || !win) return false;
    const key = `tb_reg_sent_${eventId}`;
    try {
      if (win.localStorage?.getItem(key)) return false;
      win.localStorage?.setItem(key, "1");
    } catch {
      // Storage blocked: the shared event id still deduplicates at Meta.
    }
    fbq("track", "CompleteRegistration", signupEventParams(method), { eventID: eventId });
    return true;
  } catch {
    return false;
  }
}
