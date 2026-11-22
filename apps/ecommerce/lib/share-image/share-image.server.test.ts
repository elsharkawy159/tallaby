import sharp from "sharp";
import { describe, expect, it } from "vitest";
import { fetchOriginalImage, renderShareImage, SHARE_IMAGE_MAX_BYTES } from "./share-image.server";

const png = (width: number, height: number, alpha = false) =>
  sharp({ create: { width, height, channels: alpha ? 4 : 3, background: alpha ? { r: 0, g: 0, b: 0, alpha: 0 } : "#3366cc" } }).png().toBuffer();

const respond = (body: BodyInit | null, headers: Record<string, string>, status = 200): typeof fetch =>
  (async () => new Response(body, { status, headers })) as typeof fetch;

describe("renderShareImage", () => {
  it("crops any photo to a 1200×630 JPEG with no metadata", async () => {
    for (const input of [await png(400, 400), await png(3000, 1000), await png(50, 80)]) {
      const out = await renderShareImage(input);
      const meta = await sharp(out).metadata();
      expect(meta).toMatchObject({ format: "jpeg", width: 1200, height: 630 });
      expect(meta.exif).toBeUndefined();
    }
  });

  it("puts transparency on white", async () => {
    const out = await renderShareImage(await png(100, 100, true));
    const { data } = await sharp(out).raw().toBuffer({ resolveWithObject: true });
    expect(data[0]).toBeGreaterThan(240);
  });

  it("throws on bytes that are not an image", async () => {
    await expect(renderShareImage(Buffer.from("not an image"))).rejects.toThrow();
  });
});

describe("fetchOriginalImage", () => {
  it("returns the bytes of an image", async () => {
    const bytes = await png(10, 10);
    const result = await fetchOriginalImage("https://x", respond(new Uint8Array(bytes), { "content-type": "image/png" }));
    expect(result.ok && result.bytes.equals(bytes)).toBe(true);
  });

  it("refuses a missing object, SVG, non-images and oversized bodies", async () => {
    expect(await fetchOriginalImage("https://x", respond("{}", { "content-type": "application/json" }, 404))).toEqual({ ok: false, reason: "status", status: 404 });
    expect(await fetchOriginalImage("https://x", respond("<svg/>", { "content-type": "image/svg+xml" }))).toEqual({ ok: false, reason: "type" });
    expect(await fetchOriginalImage("https://x", respond("<html>", { "content-type": "text/html" }))).toEqual({ ok: false, reason: "type" });
    expect(
      await fetchOriginalImage("https://x", respond("x", { "content-type": "image/png", "content-length": String(SHARE_IMAGE_MAX_BYTES + 1) })),
    ).toEqual({ ok: false, reason: "too_large" });
    // No Content-Length: the cap is applied while reading.
    const big = new ReadableStream<Uint8Array>({
      start(controller) {
        const chunk = new Uint8Array(1024 * 1024);
        for (let i = 0; i < 16; i++) controller.enqueue(chunk);
        controller.close();
      },
    });
    expect(await fetchOriginalImage("https://x", respond(big, { "content-type": "image/jpeg" }))).toEqual({ ok: false, reason: "too_large" });
  });

  it("reports a network error or timeout", async () => {
    const failing = (async () => {
      throw new TypeError("fetch failed");
    }) as typeof fetch;
    expect(await fetchOriginalImage("https://x", failing)).toEqual({ ok: false, reason: "network" });
  });
});
