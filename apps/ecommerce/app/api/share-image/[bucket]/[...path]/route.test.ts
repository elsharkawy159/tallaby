import sharp from "sharp";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { GET } from "./route";

const call = (bucket: string, path: string[], query = "") =>
  GET(new Request(`https://sandy.tallaby.com/api/share-image/${bucket}/${path.join("/")}${query}`), { params: Promise.resolve({ bucket, path }) });

describe("GET /api/share-image/[bucket]/[...path]", () => {
  beforeEach(() => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_PROJECT_ID", "abc123");
    vi.spyOn(console, "error").mockImplementation(() => {});
  });
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("serves a cached 1200×630 JPEG of our own object", async () => {
    const photo = await sharp({ create: { width: 800, height: 800, channels: 3, background: "#cc3366" } }).png().toBuffer();
    const fetchMock = vi.fn(async () => new Response(new Uint8Array(photo), { headers: { "content-type": "image/png" } }));
    vi.stubGlobal("fetch", fetchMock);

    const res = await call("products", ["2026-09-10", "foo.png"]);
    expect(fetchMock).toHaveBeenCalledWith("https://abc123.supabase.co/storage/v1/object/public/products/2026-09-10/foo.png", expect.anything());
    expect(res.status).toBe(200);
    expect(res.headers.get("content-type")).toBe("image/jpeg");
    expect(res.headers.get("cache-control")).toBe("public, max-age=31536000, immutable");
    expect(res.headers.get("vercel-cdn-cache-control")).toContain("max-age=31536000");
    const meta = await sharp(Buffer.from(await res.arrayBuffer())).metadata();
    expect(meta).toMatchObject({ format: "jpeg", width: 1200, height: 630 });
  });

  it("redirects to the original object when it can't make the card", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response("gone", { status: 404 })));
    const res = await call("products", ["a.png"]);
    expect(res.status).toBe(302);
    expect(res.headers.get("location")).toBe("https://abc123.supabase.co/storage/v1/object/public/products/a.png");
    expect(res.headers.get("cache-control")).toBe("public, max-age=300");
  });

  it("never fetches another bucket or a bad path", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    for (const [bucket, path] of [
      ["sellers", ["logos", "a.png"]],
      ["products", ["..", "sellers", "a.png"]],
      ["products", ["https:", "", "evil.com", "a.png"]],
    ] as const) {
      expect((await call(bucket, [...path])).status).toBe(404);
    }
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("refuses any query string before fetching, so it can't bypass the CDN cache", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    for (const query of ["?a=1", "?a=2", "?width=10"]) {
      const res = await call("products", ["2026-09-10", "foo.png"], query);
      expect(res.status).toBe(404);
      expect(res.headers.get("cache-control")).toBe("public, max-age=300");
    }
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
