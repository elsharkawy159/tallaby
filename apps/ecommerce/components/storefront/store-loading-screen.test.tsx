import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { loadingScreenView } from "@workspace/lib/stores/loading-screen";
import { StoreLoadingScreen } from "./store-loading-screen";
import { LOADING_SCREEN_SCRIPT, loadingScreenCss } from "./store-loading-screen.lib";

const SELLER = "11111111-1111-4111-8111-111111111111";
const STORE = "22222222-2222-4222-8222-222222222222";
const OBJECT = "44444444-4444-4444-8444-444444444444";
const SCOPE = { sellerId: SELLER, storeId: STORE, supabaseUrl: "https://x.supabase.co" };
const settings = (patch: Record<string, unknown> = {}) => ({
  loadingScreen: {
    enabled: true,
    mediaPath: `${SELLER}/${STORE}/${OBJECT}.gif`,
    size: { mode: "px", px: 120 },
    background: { color: "#102030", opacity: 50, blur: 8 },
    ...patch,
  },
});

describe("StoreLoadingScreen", () => {
  it("renders nothing when off, missing or broken", () => {
    for (const value of [null, {}, { loadingScreen: { enabled: false } }, settings({ enabled: false }), settings({ size: { mode: "px", px: 9000 } })]) {
      expect(renderToStaticMarkup(<StoreLoadingScreen view={loadingScreenView(value, SCOPE)} />)).toBe("");
    }
  });

  it("renders the overlay, its inline styles, the noscript fallback and the script", () => {
    const html = renderToStaticMarkup(<StoreLoadingScreen view={loadingScreenView(settings(), SCOPE)} />);
    expect(html).toContain('<div id="tly-ls" aria-hidden="true">');
    expect(html).toContain(`src="https://x.supabase.co/storage/v1/object/public/store-media/${SELLER}/${STORE}/${OBJECT}.gif"`);
    expect(html).toContain('alt=""');
    expect(html).toContain('fetchPriority="high"');
    expect(html).toContain('loading="eager"');
    expect(html).toContain("background:rgba(16, 32, 48, 0.5)");
    expect(html).toContain("backdrop-filter:blur(8px)");
    expect(html).toContain("width:120px");
    expect(html).toContain("<noscript><style>#tly-ls{display:none}</style></noscript>");
    expect(html).toContain("<script>(function(){");
    expect(html).not.toContain("tabindex");
  });

  it("covers the screen in full mode, and draws a background-only screen without an image", () => {
    const full = loadingScreenView(settings({ size: { mode: "full" } }), SCOPE)!;
    expect(loadingScreenCss(full)).toContain("object-fit:cover");
    const plain = renderToStaticMarkup(<StoreLoadingScreen view={loadingScreenView(settings({ mediaPath: null, background: { color: "#fff", opacity: 100, blur: 0 } }), SCOPE)} />);
    expect(plain).not.toContain("<img");
    expect(plain).not.toContain("backdrop-filter");
  });

  it("has a CSS-only fallback that hides it by 2.5 s", () => {
    expect(loadingScreenCss(loadingScreenView(settings(), SCOPE)!)).toContain("animation:tly-ls-out 300ms ease 2.2s forwards");
  });
});

/** Runs the fixed script against a fake page. */
function runScript({ path = "/", seen = false, reduce = false, top = true, complete = false } = {}) {
  const attrs = new Set<string>();
  const el = { setAttribute: (name: string) => attrs.add(name) };
  const store = new Map<string, string>(seen ? [["tly-ls-seen", "1"]] : []);
  const listeners: Record<string, () => void> = {};
  const win: Record<string, unknown> = {
    location: { pathname: path },
    sessionStorage: { getItem: (k: string) => store.get(k) ?? null, setItem: (k: string, v: string) => store.set(k, v) },
    matchMedia: () => ({ matches: reduce }),
    addEventListener: (name: string, fn: () => void) => (listeners[name] = fn),
  };
  win.self = win;
  win.top = top ? win : {};
  const doc = { readyState: complete ? "complete" : "loading", getElementById: () => el };
  new Function("window", "document", "setTimeout", LOADING_SCREEN_SCRIPT)(win, doc, setTimeout);
  return { attrs, store, fireLoad: () => listeners.load?.() };
}

describe("loading screen script", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it("waits for load, but at least 400 ms, then fades out", () => {
    const page = runScript();
    page.fireLoad();
    vi.advanceTimersByTime(399);
    expect(page.attrs.has("data-fade")).toBe(false);
    vi.advanceTimersByTime(1);
    expect(page.attrs.has("data-fade")).toBe(true);
    vi.advanceTimersByTime(300);
    expect(page.attrs.has("data-done")).toBe(true);
    expect(page.store.get("tly-ls-seen")).toBe("1");
  });

  it("is gone by 2.5 s even if load never fires", () => {
    const page = runScript();
    vi.advanceTimersByTime(2199);
    expect(page.attrs.has("data-fade")).toBe(false);
    vi.advanceTimersByTime(301);
    expect(page.attrs.has("data-done")).toBe(true);
  });

  it("shows once per session, never on cart or account paths, never in an iframe", () => {
    for (const options of [{ seen: true }, { path: "/cart" }, { path: "/en/checkout/x" }, { path: "/ar/profile" }, { top: false }]) {
      expect(runScript(options).attrs.has("data-done")).toBe(true);
    }
    // The cart doesn't use up the session's one showing.
    expect(runScript({ path: "/cart" }).store.size).toBe(0);
    expect(runScript({ path: "/en" }).attrs.size).toBe(0);
    expect(runScript({ path: "/products/cart-bag" }).attrs.size).toBe(0);
  });

  it("with reduced motion: no fade, hidden after the minimum time", () => {
    const page = runScript({ reduce: true });
    vi.advanceTimersByTime(400);
    expect(page.attrs.has("data-fade")).toBe(false);
    expect(page.attrs.has("data-done")).toBe(true);
  });
});
