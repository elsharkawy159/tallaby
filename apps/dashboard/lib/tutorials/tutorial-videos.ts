/**
 * Tutorial videos (YouTube Shorts) shown from the dashboard spot each one
 * teaches (ROADMAP.md F-97d). Each entry's details live in
 * `Tutorial Videos/T-xx-*\/video.md`; the title is `tutorialVideos.titles.<id>`.
 */
export const TUTORIAL_VIDEOS = {
  "T-01": { youtubeId: "2k1ydKer_2g" },
  "T-02": { youtubeId: "zme9oBh3Gfk" },
  "T-03": { youtubeId: "rnXoqT5toTQ" },
  "T-04": { youtubeId: "9jGoOXYKP_Y" },
  "T-05": { youtubeId: "FNzM8Tl5Cvs" },
  "T-06": { youtubeId: "s4ucnN8sMgI" },
  "T-07": { youtubeId: "9BuJqAL7gAE" },
  "T-08": { youtubeId: "eGLMKw2w4Xg" },
  "T-09": { youtubeId: "dKeoQgLHbY0" },
  "T-11": { youtubeId: "kQuN9xziD-k" },
  "T-12": { youtubeId: "2vJ8tpX8o8w" },
  "T-13": { youtubeId: "Bj9LjP3Er4E" },
  "T-14": { youtubeId: "ZNzPC-igPaQ" },
  "T-15": { youtubeId: "Shd258e4Oq8" },
  "T-16": { youtubeId: "ratO_S8_lJE" },
  "T-17": { youtubeId: "OXboAA4CxxA" },
  "T-18": { youtubeId: "ugn69u3Q-Xo" },
  "T-51": { youtubeId: "2MBKYlhaUvY" },
  "T-52": { youtubeId: "_uCi4-Cty9w" },
} as const satisfies Record<string, { youtubeId: string }>;

export type TutorialVideoId = keyof typeof TUTORIAL_VIDEOS;

const YOUTUBE_ID = /^[A-Za-z0-9_-]{11}$/;

/**
 * Privacy-enhanced embed URL. Never autoplays and is never muted: the seller
 * presses play. Returns null for an id that isn't a YouTube video id.
 */
export function tutorialEmbedUrl(youtubeId: string): string | null {
  if (!YOUTUBE_ID.test(youtubeId)) return null;
  return `https://www.youtube-nocookie.com/embed/${youtubeId}?rel=0&modestbranding=1&playsinline=1`;
}
