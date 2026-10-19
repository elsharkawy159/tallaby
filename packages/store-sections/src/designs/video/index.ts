import type { Design } from "../builder";
import { videoCinema } from "./video-cinema";
import { videoPlaylist } from "./video-playlist";
import { videoReels } from "./video-reels";
import { videoSplit } from "./video-split";
import { videoWide } from "./video-wide";

/** First is the default for new stores (the library's recommended player). */
export const VIDEO_DESIGNS: readonly Design[] = [videoWide, videoSplit, videoCinema, videoPlaylist, videoReels];
