import { describe, expect, it } from "vitest";
import ar from "@/messages/ar.json";
import en from "@/messages/en.json";
import { TUTORIAL_VIDEOS, tutorialEmbedUrl, type TutorialVideoId } from "./tutorial-videos";

const ids = Object.keys(TUTORIAL_VIDEOS) as TutorialVideoId[];

describe("tutorial videos", () => {
  it("builds a privacy-enhanced embed URL that neither autoplays nor mutes", () => {
    for (const id of ids) {
      const url = tutorialEmbedUrl(TUTORIAL_VIDEOS[id].youtubeId);
      expect(url).not.toBeNull();
      const parsed = new URL(url!);
      expect(parsed.origin).toBe("https://www.youtube-nocookie.com");
      expect(parsed.pathname).toBe(`/embed/${TUTORIAL_VIDEOS[id].youtubeId}`);
      expect(parsed.searchParams.has("autoplay")).toBe(false);
      expect(parsed.searchParams.has("mute")).toBe(false);
    }
  });

  it("rejects anything that isn't an 11-character YouTube id", () => {
    for (const bad of ["", "short", "2k1ydKer_2g1", "2k1ydKer_2?", "../../x/abc", "a b c d e f", "2k1ydKer&2g"]) {
      expect(tutorialEmbedUrl(bad)).toBeNull();
    }
  });

  it("has a title in both languages for every video", () => {
    for (const id of ids) {
      expect(ar.tutorialVideos.titles[id]).toBeTruthy();
      expect(en.tutorialVideos.titles[id]).toBeTruthy();
    }
  });
});
