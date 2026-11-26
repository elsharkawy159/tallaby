import { describe, expect, it, vi } from "vitest";

const rows = vi.hoisted(() => ({ value: [] as { storagePath: string; filename: string; altText: unknown }[] }));
vi.mock("@workspace/db", () => ({
  db: { select: () => ({ from: () => ({ where: async () => rows.value }) }) },
  and: () => null,
  eq: () => null,
  inArray: () => null,
  isNull: () => null,
  or: () => null,
  mediaAssets: {},
}));

process.env.NEXT_PUBLIC_SUPABASE_URL = "https://x.supabase.co";
const { mediaImageCheck, mediaPathOf, mediaPathsIn, ownMediaImages } = await import("./agent-images.server");

const SELLER = "11111111-1111-4111-8111-111111111111";
const STORE = "22222222-2222-4222-8222-222222222222";
const OTHER = "33333333-3333-4333-8333-333333333333";
const ID = "44444444-4444-4444-8444-444444444444";
const PATH = `${SELLER}/${STORE}/${ID}.jpg`;
const URL = `https://x.supabase.co/storage/v1/object/public/store-media/${PATH}`;

describe("agent images", () => {
  it("reads a media path from this project's media URL or a bare path, and nothing else", () => {
    expect(mediaPathOf(URL)).toBe(PATH);
    expect(mediaPathOf(`${URL}?v=2`)).toBe(PATH);
    expect(mediaPathOf(PATH)).toBe(PATH);
    expect(mediaPathOf(`https://evil.example/storage/v1/object/public/store-media/${PATH}`)).toBeNull();
    expect(mediaPathOf("https://x.supabase.co/storage/v1/object/public/products/a.jpg")).toBeNull();
  });

  it("finds the media links a seller pasted", () => {
    expect(mediaPathsIn(`use this ${URL} please, and https://evil.example/a.jpg`)).toEqual([PATH]);
  });

  it("lists only the seller's recorded media of this store, and checks srcs against them", async () => {
    rows.value = [{ storagePath: PATH, filename: "hero.jpg", altText: {} }];
    expect(await ownMediaImages(SELLER, STORE, [`${OTHER}/${STORE}/${ID}.jpg`, `${SELLER}/${OTHER}/${ID}.jpg`])).toEqual([]);
    const images = await ownMediaImages(SELLER, STORE, [PATH]);
    expect(images).toEqual([{ path: PATH, src: URL, label: "hero.jpg" }]);
    const check = mediaImageCheck(images);
    expect(check(PATH)).toBe(URL);
    expect(check(URL)).toBe(URL);
    expect(check("https://evil.example/a.jpg")).toBeNull();
  });
});
