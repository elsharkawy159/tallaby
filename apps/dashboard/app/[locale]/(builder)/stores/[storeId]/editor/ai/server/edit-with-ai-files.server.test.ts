import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ download: vi.fn(), upload: vi.fn(), sign: vi.fn(), record: vi.fn(), from: vi.fn() }));

vi.mock("@workspace/db/supabase/service", () => ({
  getServiceClient: () => ({ storage: { from: (bucket: string) => (mocks.from(bucket), { download: mocks.download, upload: mocks.upload, createSignedUploadUrl: mocks.sign }) } }),
}));
vi.mock("@workspace/lib/media/server", () => ({ recordMediaAsset: mocks.record }));
vi.mock("../../server/agent-images.server", () => ({
  mediaPathOf: (src: string) => src.split("/store-media/")[1] ?? null,
}));

const { mediaProductImageUploader, signEditWithAiUploads, verifyEditWithAiAttachments } = await import("./edit-with-ai-files.server");

const SELLER = "11111111-1111-4111-8111-111111111111";
const STORE = "22222222-2222-4222-8222-222222222222";
const OTHER = "33333333-3333-4333-8333-333333333333";
const ID = "44444444-4444-4444-8444-444444444444";
const OWN_PHOTO = `${SELLER}/${STORE}/${ID}.jpg`;
const JPEG = new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 1, 2, 3]);
const blob = (bytes: Uint8Array) => ({ size: bytes.length, arrayBuffer: async () => bytes.buffer.slice(0) });

beforeEach(() => {
  vi.clearAllMocks();
  process.env.NEXT_PUBLIC_SUPABASE_URL = "https://x.supabase.co";
  mocks.download.mockResolvedValue({ data: blob(JPEG), error: null });
  mocks.record.mockResolvedValue({ success: true, data: {} });
  mocks.sign.mockResolvedValue({ data: { token: "tok" }, error: null });
  mocks.upload.mockResolvedValue({ data: { path: "p" }, error: null });
});

describe("verifyEditWithAiAttachments", () => {
  it("records the seller's own uploaded photo in the media library", async () => {
    const result = await verifyEditWithAiAttachments(SELLER, STORE, [{ kind: "image", path: OWN_PHOTO }]);
    expect(result).toMatchObject({ ok: true, recorded: true, images: [{ path: OWN_PHOTO, src: `https://x.supabase.co/storage/v1/object/public/store-media/${OWN_PHOTO}` }] });
    expect(mocks.record).toHaveBeenCalledWith(SELLER, STORE, expect.objectContaining({ storagePath: OWN_PHOTO }));
  });

  it("refuses another seller's or another store's path before reading anything", async () => {
    for (const path of [`${OTHER}/${STORE}/${ID}.jpg`, `${SELLER}/${OTHER}/${ID}.jpg`, `${SELLER}/${STORE}/../x.jpg`]) {
      expect(await verifyEditWithAiAttachments(SELLER, STORE, [{ kind: "image", path }])).toEqual({ ok: false });
    }
    expect(await verifyEditWithAiAttachments(SELLER, STORE, [{ kind: "file", path: `${OTHER}/${STORE}/${ID}.csv` }])).toEqual({ ok: false });
    expect(mocks.download).not.toHaveBeenCalled();
    expect(mocks.record).not.toHaveBeenCalled();
  });

  it("refuses a file that isn't what its name says", async () => {
    mocks.download.mockResolvedValue({ data: blob(new TextEncoder().encode("<svg onload=x>")), error: null });
    expect(await verifyEditWithAiAttachments(SELLER, STORE, [{ kind: "image", path: OWN_PHOTO }])).toEqual({ ok: false });
    mocks.download.mockResolvedValue({ data: blob(new Uint8Array([0x4d, 0x5a, 0, 0])), error: null });
    expect(await verifyEditWithAiAttachments(SELLER, STORE, [{ kind: "file", path: `${SELLER}/${STORE}/${ID}.pdf` }])).toEqual({ ok: false });
    expect(mocks.record).not.toHaveBeenCalled();
  });

  it("refuses a missing upload", async () => {
    mocks.download.mockResolvedValue({ data: null, error: { message: "not found" } });
    expect(await verifyEditWithAiAttachments(SELLER, STORE, [{ kind: "image", path: OWN_PHOTO }])).toEqual({ ok: false });
  });

  it("keeps a products file with a clean name", async () => {
    mocks.download.mockResolvedValue({ data: blob(new TextEncoder().encode("name,price\nshirt,450")), error: null });
    const result = await verifyEditWithAiAttachments(SELLER, STORE, [{ kind: "file", path: `${SELLER}/${STORE}/${ID}.csv`, name: "<b>stock</b>.csv" }]);
    expect(result).toMatchObject({ ok: true, files: [{ ext: "csv", name: "bstockb.csv" }] });
  });
});

describe("signEditWithAiUploads", () => {
  it("makes the paths itself, in the seller's and store's folder", async () => {
    const result = await signEditWithAiUploads(SELLER, STORE, [
      { kind: "image", type: "image/png", size: 1000, name: "a.png" },
      { kind: "file", type: "text/csv", size: 1000, name: "stock.csv" },
    ]);
    if (!result.ok) throw new Error(result.error);
    expect(result.uploads[0]).toMatchObject({ kind: "image", bucket: "store-media", path: expect.stringMatching(new RegExp(`^${SELLER}/${STORE}/[0-9a-f-]{36}\\.png$`)) });
    expect(result.uploads[1]).toMatchObject({ kind: "file", bucket: "edit-with-ai-files", path: expect.stringMatching(new RegExp(`^${SELLER}/${STORE}/[0-9a-f-]{36}\\.csv$`)) });
  });

  it("refuses wrong types and sizes, and reports a missing files bucket", async () => {
    expect(await signEditWithAiUploads(SELLER, STORE, [{ kind: "image", type: "image/svg+xml", size: 10, name: "a.svg" }])).toEqual({ ok: false, error: "invalid" });
    expect(await signEditWithAiUploads(SELLER, STORE, [{ kind: "image", type: "image/jpeg", size: 6 * 1024 * 1024, name: "a.jpg" }])).toEqual({ ok: false, error: "invalid" });
    expect(await signEditWithAiUploads(SELLER, STORE, [{ kind: "file", type: "text/html", size: 10, name: "a.html" }])).toEqual({ ok: false, error: "invalid" });
    mocks.sign.mockResolvedValue({ data: null, error: { message: "Bucket not found" } });
    expect(await signEditWithAiUploads(SELLER, STORE, [{ kind: "file", type: "text/csv", size: 10, name: "a.csv" }])).toEqual({ ok: false, error: "unavailable" });
  });
});

describe("mediaProductImageUploader", () => {
  it("copies only this store's media photo into the products bucket", async () => {
    const upload = mediaProductImageUploader(SELLER, STORE);
    expect(await upload(`https://x.supabase.co/storage/v1/object/public/store-media/${OWN_PHOTO}`)).toEqual({ ok: true, path: "p" });
    expect(mocks.upload.mock.calls[0]![0]).toMatch(new RegExp(`^${SELLER}/\\d{4}-\\d{2}-\\d{2}/[0-9a-f-]{36}\\.jpg$`));
    expect(mocks.from).toHaveBeenCalledWith("products");
    mocks.download.mockClear();
    expect(await upload("https://evil.example/x.jpg")).toMatchObject({ ok: false });
    expect(await upload(`https://x.supabase.co/storage/v1/object/public/store-media/${OTHER}/${STORE}/${ID}.jpg`)).toMatchObject({ ok: false });
    expect(mocks.download).not.toHaveBeenCalled();
  });
});
