import { describe, expect, it, vi } from "vitest";
import {
  isTallabyPixelHost,
  isTallabyPixelUrl,
  tallabyPixel,
  trackTallabyPageView,
  trackTallabySignup,
  type PixelWindow,
} from "./meta-pixel.lib";

const PIXEL = "3628548033960332";

/** A minimal browser: records the fbevents script tags and keeps localStorage in a Map. */
function fakeWindow(hostname: string, options: { framed?: boolean } = {}) {
  const scripts: Array<{ async: boolean; src: string }> = [];
  const store = new Map<string, string>();
  const win: PixelWindow = {
    self: {},
    top: {},
    location: { hostname },
    localStorage: {
      getItem: (key) => store.get(key) ?? null,
      setItem: (key, value) => void store.set(key, value),
    },
    document: {
      createElement: () => ({ async: false, src: "" }),
      head: { appendChild: (node) => scripts.push(node as { async: boolean; src: string }) },
    },
  };
  if (!options.framed) win.top = win.self;
  return { win, scripts, store };
}

/** The commands queued on the stub (fbevents.js never loads in tests). */
const queued = (win: PixelWindow) => win.fbq!.queue;

describe("Tallaby pixel hosts", () => {
  it.each(["tallaby.com", "www.tallaby.com", "dashboard.tallaby.com", "WWW.Tallaby.com", "tallaby.com:443"])(
    "%s is allowed",
    (host) => expect(isTallabyPixelHost(host)).toBe(true),
  );

  it.each([
    "localhost",
    "localhost:3000",
    "127.0.0.1",
    "tallaby.local",
    "faster.tallaby.com",
    "staging.tallaby.com",
    // Seller storefronts Meta reported events from (2026-11-01).
    "qavero.tallaby.com",
    "store-b61a4987.tallaby.com",
    "a-d-cosmetics.tallaby.com",
    "sherin-handmade.tallaby.com",
    "apex-multi-store.tallaby.com",
    "tester.tallaby.com",
    "qavero.localhost",
    "qavero.localhost:3000",
    "eviltallaby.com",
    "tallaby.com.evil.com",
    "shop.seller-domain.com",
    "tallaby-git-main.vercel.app",
    "faster-eg.com",
    "",
    null,
  ])("%s is not", (host) => expect(isTallabyPixelHost(host)).toBe(false));

  it("checks event source URLs", () => {
    expect(isTallabyPixelUrl("https://dashboard.tallaby.com/")).toBe(true);
    expect(isTallabyPixelUrl("http://localhost:3001/")).toBe(false);
    expect(isTallabyPixelUrl("http://tallaby.com/")).toBe(false);
    expect(isTallabyPixelUrl(null)).toBe(false);
  });
});

describe("tallabyPixel", () => {
  it("loads Meta's base code once and inits once", () => {
    const { win, scripts } = fakeWindow("dashboard.tallaby.com");
    const first = tallabyPixel(PIXEL, win);
    const second = tallabyPixel(PIXEL, win);
    expect(first).toBe(second);
    expect(scripts).toEqual([{ async: true, src: "https://connect.facebook.net/en_US/fbevents.js" }]);
    expect(queued(win)).toEqual([["init", PIXEL]]);
    expect(win.fbq!.disablePushState).toBe(true);
  });

  it.each(["localhost", "127.0.0.1", "tallaby.local", "tallaby-git-main.vercel.app"])("does nothing on %s", (host) => {
    const { win, scripts } = fakeWindow(host);
    expect(tallabyPixel(PIXEL, win)).toBeNull();
    expect(win.fbq).toBeUndefined();
    expect(scripts).toHaveLength(0);
  });

  it("does nothing without an id, with a bad id, in a frame or on the server", () => {
    expect(tallabyPixel(undefined, fakeWindow("tallaby.com").win)).toBeNull();
    expect(tallabyPixel("", fakeWindow("tallaby.com").win)).toBeNull();
    expect(tallabyPixel("123'); alert(1", fakeWindow("tallaby.com").win)).toBeNull();
    expect(tallabyPixel(PIXEL, fakeWindow("tallaby.com", { framed: true }).win)).toBeNull();
    expect(tallabyPixel(PIXEL, null)).toBeNull();
  });
});

describe("trackTallabyPageView", () => {
  it("sends one PageView per pathname", () => {
    const { win } = fakeWindow("www.tallaby.com");
    trackTallabyPageView(PIXEL, "/ar", win);
    trackTallabyPageView(PIXEL, "/ar", win); // React strict mode re-runs the effect
    trackTallabyPageView(PIXEL, "/ar/pricing", win);
    expect(queued(win)).toEqual([["init", PIXEL], ["track", "PageView"], ["track", "PageView"]]);
  });

  it("sends nothing on localhost", () => {
    const { win } = fakeWindow("localhost");
    trackTallabyPageView(PIXEL, "/", win);
    expect(win.fbq).toBeUndefined();
  });
});

describe("trackTallabySignup", () => {
  it("fires CompleteRegistration once per account, without personal data", () => {
    const { win, store } = fakeWindow("dashboard.tallaby.com");
    expect(trackTallabySignup(PIXEL, "signup_u1", "google", win)).toBe(true);
    expect(trackTallabySignup(PIXEL, "signup_u1", "google", win)).toBe(false);
    expect(queued(win)).toEqual([
      ["init", PIXEL],
      [
        "track",
        "CompleteRegistration",
        { content_name: "seller_signup", registration_method: "google" },
        { eventID: "signup_u1" },
      ],
    ]);
    expect(store.get("tb_reg_sent_signup_u1")).toBe("1");
  });

  it("still fires when storage is blocked", () => {
    const { win } = fakeWindow("tallaby.com");
    win.localStorage = {
      getItem: vi.fn(() => {
        throw new Error("blocked");
      }),
      setItem: vi.fn(),
    };
    expect(trackTallabySignup(PIXEL, "signup_u2", "email", win)).toBe(true);
  });

  it("neither fires nor sets the flag on localhost", () => {
    const { win, store } = fakeWindow("localhost");
    expect(trackTallabySignup(PIXEL, "signup_u3", "email", win)).toBe(false);
    expect(store.size).toBe(0);
  });
});
