/** Extracts the YouTube video ID from any YouTube URL format. Returns null for non-YouTube URLs. */
export function extractYouTubeId(url: string): string | null {
  if (!url) return null
  try {
    const u = new URL(url)
    if (u.hostname === "youtu.be") return u.pathname.slice(1).split("?")[0] ?? null
    if (u.pathname.startsWith("/shorts/")) return u.pathname.split("/shorts/")[1]?.split("/")[0] ?? null
    if (u.pathname.startsWith("/embed/")) return u.pathname.split("/embed/")[1]?.split("/")[0] ?? null
    if (u.hostname.includes("youtube.com")) return u.searchParams.get("v")
    return null
  } catch {
    return null
  }
}

export type VideoPlaybackOptions = {
  autoplay: boolean
  loop: boolean
  muted: boolean
  controls: boolean
}

/** Builds a YouTube embed URL with the given playback options. */
export function buildYouTubeEmbedUrl(videoId: string, opts: VideoPlaybackOptions): string {
  const p = new URLSearchParams()
  if (opts.autoplay) p.set("autoplay", "1")
  if (opts.muted)    p.set("mute", "1")
  if (opts.loop)     { p.set("loop", "1"); p.set("playlist", videoId) }
  if (!opts.controls) p.set("controls", "0")
  p.set("rel", "0")
  p.set("modestbranding", "1")
  return `https://www.youtube.com/embed/${videoId}?${p.toString()}`
}

/** Returns the best available YouTube thumbnail URL for a video ID. */
export function youTubeThumbnail(videoId: string): string {
  return `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`
}
