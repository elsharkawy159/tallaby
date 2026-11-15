import { describe, expect, it } from "vitest";
import {
  LOADING_SCREEN_DEFAULTS,
  isLoadingScreenMediaType,
  loadingScreenSchema,
  loadingScreenTypeMatchesPath,
  loadingScreenView,
  parseStoreLoadingScreen,
} from "./loading-screen.dto";

const SELLER = "11111111-1111-4111-8111-111111111111";
const STORE = "22222222-2222-4222-8222-222222222222";
const OTHER = "33333333-3333-4333-8333-333333333333";
const OBJECT = "44444444-4444-4444-8444-444444444444";
const GIF = `${SELLER}/${STORE}/${OBJECT}.gif`;
const SCOPE = { sellerId: SELLER, storeId: STORE, supabaseUrl: "https://x.supabase.co" };

const valid = {
  enabled: true,
  mediaPath: GIF,
  size: { mode: "px", px: 160 },
  background: { color: "#FFF", opacity: 80, blur: 6 },
};

describe("loadingScreenSchema", () => {
  it("accepts a GIF, px and full sizes, and lowercases the colour", () => {
    const parsed = loadingScreenSchema.parse(valid);
    expect(parsed.background.color).toBe("#fff");
    expect(loadingScreenSchema.safeParse({ ...valid, size: { mode: "full" } }).success).toBe(true);
    for (const ext of ["jpg", "jpeg", "png", "webp"]) {
      expect(loadingScreenSchema.safeParse({ ...valid, mediaPath: `${SELLER}/${STORE}/${OBJECT}.${ext}` }).success).toBe(true);
    }
  });

  it("enforces the px bounds", () => {
    expect(loadingScreenSchema.safeParse({ ...valid, size: { mode: "px", px: 40 } }).success).toBe(true);
    expect(loadingScreenSchema.safeParse({ ...valid, size: { mode: "px", px: 400 } }).success).toBe(true);
    expect(loadingScreenSchema.safeParse({ ...valid, size: { mode: "px", px: 39 } }).success).toBe(false);
    expect(loadingScreenSchema.safeParse({ ...valid, size: { mode: "px", px: 401 } }).success).toBe(false);
    expect(loadingScreenSchema.safeParse({ ...valid, size: { mode: "px", px: 100.5 } }).success).toBe(false);
    expect(loadingScreenSchema.safeParse({ ...valid, size: { mode: "vh" } }).success).toBe(false);
  });

  it("rejects bad colours, opacity and blur", () => {
    for (const color of ["fff", "#ggg", "#ffff", "red", "#fff;}body{", ""]) {
      expect(loadingScreenSchema.safeParse({ ...valid, background: { ...valid.background, color } }).success).toBe(false);
    }
    expect(loadingScreenSchema.safeParse({ ...valid, background: { ...valid.background, opacity: -1 } }).success).toBe(false);
    expect(loadingScreenSchema.safeParse({ ...valid, background: { ...valid.background, opacity: 101 } }).success).toBe(false);
    expect(loadingScreenSchema.safeParse({ ...valid, background: { ...valid.background, blur: 25 } }).success).toBe(false);
    expect(loadingScreenSchema.safeParse({ ...valid, background: { ...valid.background, blur: -1 } }).success).toBe(false);
  });

  it("rejects SVG, AVIF, URLs and unknown keys", () => {
    expect(loadingScreenSchema.safeParse({ ...valid, mediaPath: `${SELLER}/${STORE}/${OBJECT}.svg` }).success).toBe(false);
    expect(loadingScreenSchema.safeParse({ ...valid, mediaPath: `${SELLER}/${STORE}/${OBJECT}.avif` }).success).toBe(false);
    expect(loadingScreenSchema.safeParse({ ...valid, mediaPath: "https://evil.example/x.gif" }).success).toBe(false);
    expect(loadingScreenSchema.safeParse({ ...valid, extra: 1 }).success).toBe(false);
    expect(isLoadingScreenMediaType("image/gif")).toBe(true);
    expect(isLoadingScreenMediaType("image/svg+xml")).toBe(false);
    expect(loadingScreenTypeMatchesPath("image/gif", GIF)).toBe(true);
    expect(loadingScreenTypeMatchesPath("image/png", GIF)).toBe(false);
  });

  it("refuses an empty screen (on, no media, opacity 0) but allows it when off", () => {
    const empty = { ...valid, mediaPath: null, background: { ...valid.background, opacity: 0 } };
    const result = loadingScreenSchema.safeParse(empty);
    expect(result.success).toBe(false);
    expect(result.error?.issues[0]?.message).toBe("empty");
    expect(loadingScreenSchema.safeParse({ ...empty, enabled: false }).success).toBe(true);
    expect(loadingScreenSchema.safeParse({ ...empty, background: { ...empty.background, opacity: 1 } }).success).toBe(true);
  });
});

describe("parseStoreLoadingScreen / loadingScreenView", () => {
  it("falls back to the off default for missing or garbage data", () => {
    for (const settings of [null, undefined, {}, { loadingScreen: "x" }, { loadingScreen: { enabled: true } }, { loadingScreen: [] }]) {
      expect(parseStoreLoadingScreen(settings)).toEqual(LOADING_SCREEN_DEFAULTS);
      expect(loadingScreenView(settings, SCOPE)).toBeNull();
    }
  });

  it("draws nothing when off", () => {
    expect(loadingScreenView({ loadingScreen: { ...valid, enabled: false } }, SCOPE)).toBeNull();
  });

  it("builds the public URL and rgba background", () => {
    expect(loadingScreenView({ loadingScreen: valid }, SCOPE)).toEqual({
      mediaUrl: `https://x.supabase.co/storage/v1/object/public/store-media/${GIF}`,
      size: { mode: "px", px: 160 },
      background: "rgba(255, 255, 255, 0.8)",
      blur: 6,
    });
  });

  it("drops media from another seller or another store", () => {
    const foreign = { ...valid, mediaPath: `${OTHER}/${STORE}/${OBJECT}.gif` };
    expect(loadingScreenView({ loadingScreen: foreign }, SCOPE)?.mediaUrl).toBeNull();
    const sibling = { ...valid, mediaPath: `${SELLER}/${OTHER}/${OBJECT}.gif` };
    expect(loadingScreenView({ loadingScreen: sibling }, SCOPE)?.mediaUrl).toBeNull();
    // ...and with a see-through background there is nothing left to show.
    expect(loadingScreenView({ loadingScreen: { ...foreign, background: { ...valid.background, opacity: 0 } } }, SCOPE)).toBeNull();
    const shared = { ...valid, mediaPath: `${SELLER}/shared/${OBJECT}.gif` };
    expect(loadingScreenView({ loadingScreen: shared }, SCOPE)?.mediaUrl).toContain("/shared/");
  });
});
