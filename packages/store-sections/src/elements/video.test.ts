import { describe, expect, it } from "vitest";
import { parseVideoUrl, readVideoOptions, videoEmbedUrl, videoFacadeDoc, videoLinkProblem } from "./video";

const YT = "dQw4w9WgXcQ";
const TT = "7231338487075638570";

describe("parseVideoUrl", () => {
  it("reads YouTube links and a bare id", () => {
    for (const link of [
      YT,
      `https://www.youtube.com/watch?v=${YT}&t=42s`,
      `youtube.com/watch?v=${YT}`,
      `https://m.youtube.com/watch?v=${YT}`,
      `https://youtu.be/${YT}?si=abc`,
      `https://www.youtube.com/embed/${YT}`,
      `https://www.youtube.com/live/${YT}`,
    ]) {
      expect(parseVideoUrl(link), link).toMatchObject({ provider: "youtube", id: YT });
    }
    expect(parseVideoUrl(`https://www.youtube.com/shorts/${YT}`)).toEqual({ provider: "youtube", id: YT, short: true });
  });

  it("reads Vimeo, TikTok, Instagram, Facebook and video files", () => {
    expect(parseVideoUrl("https://vimeo.com/76979871")).toEqual({ provider: "vimeo", id: "76979871" });
    expect(parseVideoUrl("https://vimeo.com/76979871/abc123def")).toEqual({ provider: "vimeo", id: "76979871", hash: "abc123def" });
    expect(parseVideoUrl("https://player.vimeo.com/video/76979871")).toMatchObject({ provider: "vimeo", id: "76979871" });
    expect(parseVideoUrl(`https://www.tiktok.com/@shop.eg/video/${TT}?lang=ar`)).toEqual({ provider: "tiktok", id: TT });
    expect(parseVideoUrl(`https://www.tiktok.com/embed/v2/${TT}`)).toEqual({ provider: "tiktok", id: TT });
    expect(parseVideoUrl("https://www.instagram.com/reel/C9xYz_AbCd/")).toEqual({ provider: "instagram", id: "C9xYz_AbCd", kind: "reel" });
    expect(parseVideoUrl("https://www.instagram.com/shop.eg/p/C9xYz_AbCd/")).toEqual({ provider: "instagram", id: "C9xYz_AbCd", kind: "p" });
    expect(parseVideoUrl("https://www.facebook.com/watch/?v=1234567890")).toEqual({ provider: "facebook", id: "1234567890", kind: "video" });
    expect(parseVideoUrl("https://www.facebook.com/shop.eg/videos/1234567890/")).toEqual({ provider: "facebook", id: "1234567890", kind: "video" });
    expect(parseVideoUrl("https://www.facebook.com/reel/1234567890")).toEqual({ provider: "facebook", id: "1234567890", kind: "reel" });
    expect(parseVideoUrl("https://cdn.test/media/demo.mp4?v=2")).toEqual({ provider: "file", url: "https://cdn.test/media/demo.mp4?v=2" });
  });

  it("rejects other sites, look-alike hosts, bad ids and unsafe links", () => {
    for (const link of [
      "",
      "https://example.com/video",
      `https://evil.com/watch?v=${YT}`,
      `https://youtube.com.evil.com/watch?v=${YT}`,
      "https://www.youtube.com/watch?v=short",
      `https://www.tiktok.com/@shop/video/123`,
      "http://cdn.test/demo.mp4",
      `javascript:alert('${YT}')`,
      `https://youtu.be/${YT}"><script>`,
      42,
      null,
    ]) {
      expect(parseVideoUrl(link), String(link)).toBeNull();
    }
  });

  it("explains share short links", () => {
    expect(videoLinkProblem("https://vm.tiktok.com/ZMabc123/")).toBe("short-link");
    expect(videoLinkProblem("https://fb.watch/abc/")).toBe("short-link");
    expect(videoLinkProblem("https://example.com")).toBe("unsupported");
    expect(videoLinkProblem(`https://youtu.be/${YT}`)).toBeNull();
    expect(videoLinkProblem("")).toBeNull();
  });
});

describe("player options", () => {
  it("defaults to a thumbnail with controls", () => {
    expect(readVideoOptions({ url: YT })).toMatchObject({ autoplay: false, muted: false, loop: false, controls: true, thumbnail: "auto" });
    expect(readVideoOptions({ url: "nope" })).toBeNull();
  });

  it("mutes autoplay and drops its thumbnail", () => {
    const options = readVideoOptions({ url: YT, autoplay: true, thumbnail: "custom" })!;
    expect(options).toMatchObject({ muted: true, thumbnail: "none" });
    expect(videoEmbedUrl(options)).toContain("autoplay=1");
    expect(videoEmbedUrl(options)).toContain("mute=1");
  });

  it("drops options the site can't do", () => {
    expect(readVideoOptions({ url: "https://www.instagram.com/reel/C9xYz_AbCd/", autoplay: true, loop: true, start: 5 })).toMatchObject({
      autoplay: false,
      loop: false,
      start: undefined,
    });
    expect(readVideoOptions({ url: `https://www.tiktok.com/@s/video/${TT}`, muted: true, start: 9 })).toMatchObject({ muted: false, start: undefined });
  });

  it("builds a privacy-enhanced YouTube embed with loop, controls and times", () => {
    const url = new URL(videoEmbedUrl(readVideoOptions({ url: YT, loop: true, controls: false, start: 10.7, end: 5 })!));
    expect(url.origin).toBe("https://www.youtube-nocookie.com");
    expect(url.pathname).toBe(`/embed/${YT}`);
    expect(url.searchParams.get("playlist")).toBe(YT);
    expect(url.searchParams.get("controls")).toBe("0");
    expect(url.searchParams.get("start")).toBe("10");
    // An end before the start is ignored.
    expect(url.searchParams.has("end")).toBe(false);
  });

  it("builds each site's fixed player address", () => {
    const embed = (link: string, extra: Record<string, unknown> = {}) => videoEmbedUrl(readVideoOptions({ url: link, ...extra })!, true);
    expect(embed("https://vimeo.com/76979871", { start: 30 })).toBe("https://player.vimeo.com/video/76979871?dnt=1&autoplay=1#t=30s");
    expect(embed(`https://www.tiktok.com/@s/video/${TT}`, { loop: true })).toBe(
      `https://www.tiktok.com/player/v1/${TT}?music_info=0&description=0&rel=0&autoplay=1&loop=1`,
    );
    expect(embed("https://www.instagram.com/reel/C9xYz_AbCd/")).toBe("https://www.instagram.com/reel/C9xYz_AbCd/embed/");
    expect(embed("https://www.facebook.com/reel/1234567890")).toBe(
      "https://www.facebook.com/plugins/video.php?href=https%3A%2F%2Fwww.facebook.com%2Freel%2F1234567890&show_text=false&autoplay=true",
    );
    expect(embed("https://cdn.test/demo.mp4", { start: 3, end: 9 })).toBe("https://cdn.test/demo.mp4#t=3,9");
  });

  it("escapes the thumbnail page values", () => {
    const doc = videoFacadeDoc(readVideoOptions({ url: YT })!, 'https://cdn.test/a.jpg?x="><script>', `"><script>alert(1)</script>`);
    expect(doc).not.toContain("<script>");
    expect(doc).toContain("&quot;&gt;&lt;script&gt;");
    expect(doc).toContain(`https://www.youtube-nocookie.com/embed/${YT}?`);
  });
});
