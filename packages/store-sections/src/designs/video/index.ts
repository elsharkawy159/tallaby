import type { Design } from "../builder";
import { videoChapters } from "./video-chapters";
import { videoCinema } from "./video-cinema";
import { videoFilm } from "./video-film";
import { videoGrid } from "./video-grid";
import { videoPlaylist } from "./video-playlist";
import { videoReels } from "./video-reels";
import { videoShop } from "./video-shop";
import { videoSplit } from "./video-split";
import { videoVertical } from "./video-vertical";
import { videoWide } from "./video-wide";

/** First is the default for new stores (the library's recommended player). */
export const VIDEO_DESIGNS: readonly Design[] = [videoWide, videoSplit, videoCinema, videoPlaylist, videoReels, videoVertical, videoGrid, videoChapters, videoFilm, videoShop];
