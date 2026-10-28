/**
 * Video elements (server-renderable, no hooks): a single player and a
 * playlist. Publicly, a thumbnail is a light `srcdoc` page in the frame, so
 * the site's player loads only on click; a playlist row is a link whose
 * target is the playlist's frame, so clicking it plays that video beside the
 * list with no script. On the canvas everything is a still, so clicks select.
 */
import type { ReactNode } from "react";
import { Facebook, Film, Instagram, Music2, Play, Youtube, type LucideIcon } from "lucide-react";
import type { ComponentNode } from "../config/schema";
import { sectionText } from "../core/copy";
import { IMAGE_SIZES, imageSource, type RenderContext } from "../core/types";
import { resolvePhotoSlot } from "../designs/photo-slots";
import { cn } from "../sections/_primitives";
import { readVideoOptions, videoEmbedUrl, videoFacadeDoc, videoStillUrl, type VideoOptions, type VideoProvider } from "./video";

type Attrs = Record<string, string>;

const str = (value: unknown, max: number) => (typeof value === "string" ? value.slice(0, max) : "");

const PROVIDER_ICON: Record<VideoProvider, LucideIcon> = {
  youtube: Youtube,
  vimeo: Film,
  tiktok: Music2,
  instagram: Instagram,
  facebook: Facebook,
  file: Film,
};

const PROVIDER_NAME: Record<VideoProvider, string> = {
  youtube: "YouTube",
  vimeo: "Vimeo",
  tiktok: "TikTok",
  instagram: "Instagram",
  facebook: "Facebook",
  file: "MP4",
};

const FRAME_ALLOW = "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share; fullscreen";
const FRAME_SANDBOX = "allow-scripts allow-same-origin allow-presentation allow-popups allow-popups-to-escape-sandbox";

/** A single video's still: the seller's image when chosen, else the site's own (YouTube). */
function stillOf(options: VideoOptions | null, props: Record<string, unknown>, ctx: RenderContext, preferCustom: boolean): string | null {
  const custom = preferCustom ? ctx.imageUrl(resolvePhotoSlot(str(props.poster, 2048), ctx.industry)) : null;
  return custom ?? (options ? videoStillUrl(options.source) : null);
}

/** The player itself: a native `<video>` for files, else the site's frame (behind a thumbnail when there is one). */
function Player({ options, poster, title, name }: { options: VideoOptions; poster: string | null; title: string; name?: string }): ReactNode {
  const facade = !options.autoplay && options.thumbnail !== "none" && poster ? videoFacadeDoc(options, poster, title) : undefined;
  // A playlist's frame must stay a frame (its rows target it), so a file plays in the browser's own player there.
  if (options.source.provider === "file" && !name) {
    return (
      <video
        src={videoEmbedUrl(options)}
        poster={poster ?? undefined}
        title={title}
        controls={options.controls}
        autoPlay={options.autoplay}
        muted={options.muted}
        loop={options.loop}
        playsInline
        preload="metadata"
        className="absolute inset-0 size-full bg-black object-contain"
      />
    );
  }
  return (
    <iframe
      name={name}
      src={videoEmbedUrl(options, facade ? true : options.autoplay)}
      srcDoc={facade}
      title={title}
      loading={options.autoplay ? undefined : "lazy"}
      allow={FRAME_ALLOW}
      allowFullScreen
      referrerPolicy="strict-origin-when-cross-origin"
      sandbox={FRAME_SANDBOX}
      className="absolute inset-0 size-full border-0"
    />
  );
}

/** The canvas still: the thumbnail (or the site's badge), a play button and a hint when there is no link yet. */
function Still({ options, poster, ctx, compact = false }: { options: VideoOptions | null; poster: string | null; ctx: RenderContext; compact?: boolean }) {
  const Icon = options ? PROVIDER_ICON[options.source.provider] : Play;
  return (
    <>
      {poster && (
        // eslint-disable-next-line @next/next/no-img-element -- shared by both apps; the host optimizes through ctx.optimizeImage
        <img {...imageSource(ctx, poster, IMAGE_SIZES.content)} alt="" className={cn("absolute inset-0 size-full object-cover", !options && "opacity-40")} loading="lazy" />
      )}
      <span
        aria-hidden
        className={cn(
          "absolute left-1/2 top-1/2 grid -translate-x-1/2 -translate-y-1/2 place-items-center rounded-2xl text-white",
          compact ? "h-7 w-10 rounded-lg bg-black/70" : "h-12 w-[68px] bg-black/75",
        )}
      >
        <Play className={cn("fill-current", compact ? "size-3.5" : "size-6")} />
      </span>
      {options && !poster && !compact && (
        <span className="absolute start-3 top-3 inline-flex items-center gap-1.5 rounded-full bg-white/15 px-2.5 py-1 text-[11px] font-semibold text-white">
          <Icon className="size-3.5" aria-hidden />
          {PROVIDER_NAME[options.source.provider]}
        </span>
      )}
      {!options && !compact && (
        <span data-editor-only className="absolute inset-x-3 bottom-3 rounded-md bg-black/70 px-3 py-2 text-center text-xs text-white">
          {sectionText("videoEmpty", ctx.locale)}
        </span>
      )}
      {options?.autoplay && !compact && (
        <span className="absolute end-3 top-3 rounded-full bg-black/70 px-2.5 py-1 text-[11px] font-semibold text-white">{sectionText("videoAutoplay", ctx.locale)}</span>
      )}
    </>
  );
}

const BOX = "relative block aspect-video w-full overflow-hidden bg-black";

/** A playlist video's still: the site's own (YouTube) first, else its thumbnail image. */
const itemStill = (options: VideoOptions | null, props: Record<string, unknown>, ctx: RenderContext) =>
  (options && videoStillUrl(options.source)) ?? ctx.imageUrl(resolvePhotoSlot(str(props.poster, 2048), ctx.industry));

/**
 * A background video (`background` on, a video file): it fills its frame like
 * a cover photo, muted, looping and without controls. The poster image is
 * drawn first (it is the page's largest content), and the video plays over
 * it; with reduce motion, on the canvas or without a file only the poster shows.
 */
function BackgroundVideo({ attrs, props, ctx }: { attrs: Attrs; props: Record<string, unknown>; ctx: RenderContext }) {
  const options = readVideoOptions({ ...props, autoplay: true, muted: true, loop: true, controls: false });
  const file = options?.source.provider === "file" ? options : null;
  const poster = ctx.imageUrl(resolvePhotoSlot(str(props.poster, 2048), ctx.industry));
  return (
    <div {...attrs} className="relative block w-full overflow-hidden bg-black">
      {poster && (
        // eslint-disable-next-line @next/next/no-img-element -- shared by both apps; the host optimizes through ctx.optimizeImage
        <img {...imageSource(ctx, poster, IMAGE_SIZES.full)} alt="" className="absolute inset-0 size-full object-cover" fetchPriority="high" decoding="async" />
      )}
      {file && ctx.mode !== "edit" && (
        <video
          src={videoEmbedUrl(file)}
          poster={poster ?? undefined}
          autoPlay
          muted
          loop
          playsInline
          preload="metadata"
          aria-hidden
          tabIndex={-1}
          className="absolute inset-0 size-full object-cover motion-reduce:hidden"
        />
      )}
    </div>
  );
}

export function VideoElement({ attrs, props, ctx }: { attrs: Attrs; props: Record<string, unknown>; ctx: RenderContext }) {
  if (props.background === true) return <BackgroundVideo attrs={attrs} props={props} ctx={ctx} />;
  const options = readVideoOptions(props);
  const title = str(props.title, 120) || sectionText("videoTitle", ctx.locale);
  // The design's photo stands in on the canvas until a link is pasted.
  const poster = stillOf(options, props, ctx, !options || options.thumbnail === "custom");

  if (ctx.mode === "edit") {
    return (
      <div {...attrs} className={BOX}>
        <Still options={options} poster={poster} ctx={ctx} />
      </div>
    );
  }
  if (!options) return null;
  return (
    <div {...attrs} className={BOX}>
      <Player options={options} poster={poster} title={title} />
    </div>
  );
}

const LAYOUT = {
  end: { grid: "md:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]", list: "" },
  start: { grid: "md:grid-cols-[minmax(0,1fr)_minmax(0,2fr)]", list: "md:order-first" },
  below: { grid: "", list: "" },
} as const;

/** A playlist row: thumbnail, title and length. Publicly a link that plays the video in the playlist's frame. */
function PlaylistRow({ item, ctx, frame, controls }: { item: ComponentNode; ctx: RenderContext; frame: string; controls: boolean }) {
  const props = item.props ?? {};
  const options = readVideoOptions({ ...props, controls, thumbnail: "none" });
  if (!options && ctx.mode !== "edit") return null;
  const poster = itemStill(options, props, ctx);
  const Icon = options ? PROVIDER_ICON[options.source.provider] : Play;
  const attrs = { "data-node-id": item.id, "data-node-type": item.type };
  const body = (
    <>
      <span className="relative block aspect-video w-28 shrink-0 overflow-hidden rounded-[calc(var(--sf-radius,12px)*0.75)] bg-black">
        {poster ? (
          // eslint-disable-next-line @next/next/no-img-element -- shared by both apps; the host optimizes through ctx.optimizeImage
          <img {...imageSource(ctx, poster, "112px")} alt="" className="absolute inset-0 size-full object-cover" loading="lazy" />
        ) : (
          <Icon className="absolute left-1/2 top-1/2 size-5 -translate-x-1/2 -translate-y-1/2 text-white/80" aria-hidden />
        )}
        {poster && (
          <span aria-hidden className="absolute left-1/2 top-1/2 grid h-6 w-9 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-md bg-black/70 text-white">
            <Play className="size-3 fill-current" />
          </span>
        )}
      </span>
      <span className="flex min-w-0 flex-col gap-0.5">
        <span className="line-clamp-2 text-sm font-semibold">{str(props.title, 120)}</span>
        {str(props.duration, 12) && <span className="text-xs text-(--sf-muted)">{str(props.duration, 12)}</span>}
      </span>
    </>
  );
  const className = "flex items-center gap-3 rounded-(--sf-radius,12px) p-2 text-start transition-colors hover:bg-(--sf-shelf) focus-visible:bg-(--sf-shelf)";
  if (ctx.mode === "edit" || !options) {
    return (
      <div {...attrs} className={className}>
        {body}
      </div>
    );
  }
  return (
    <a {...attrs} href={videoEmbedUrl(options, true)} target={frame} className={className}>
      {body}
    </a>
  );
}

export function VideoPlaylist({ attrs, node, ctx }: { attrs: Attrs; node: ComponentNode; ctx: RenderContext }) {
  const props = node.props ?? {};
  const items = node.children.filter((child) => child.type === "videoItem");
  const controls = props.controls !== false;
  const layout = LAYOUT[(["end", "start", "below"] as const).find((v) => v === props.listPosition) ?? "end"];
  const first = items.map((item) => ({ item, options: readVideoOptions({ ...item.props, controls }) })).find((x) => x.options);
  if (ctx.mode !== "edit" && !first) return null;
  // Only letters, digits, - and _ in a frame name.
  const frame = `vp-${node.id.replace(/[^A-Za-z0-9_-]/g, "")}`;
  const poster = itemStill(first?.options ?? null, (first?.item ?? items[0])?.props ?? {}, ctx);
  const title = first ? str(first.item.props?.title, 120) || sectionText("videoTitle", ctx.locale) : "";

  return (
    <div {...attrs} className={cn("grid min-w-0 items-start gap-6", layout.grid)}>
      <div className={BOX + " rounded-(--sf-radius,12px)"}>
        {ctx.mode === "edit" ? (
          <Still options={first?.options ?? null} poster={poster} ctx={ctx} />
        ) : (
          <Player options={first!.options!} poster={poster} title={title} name={frame} />
        )}
      </div>
      <div className={cn("flex min-w-0 flex-col gap-1.5 md:max-h-[520px] md:overflow-y-auto", layout.list)}>
        {items.length === 0 && ctx.mode === "edit" ? (
          <span data-editor-only className="block rounded-(--sf-radius,12px) border border-dashed border-(--sf-line) p-4 text-center text-xs text-(--sf-muted)">
            {sectionText("emptyPlaylist", ctx.locale)}
          </span>
        ) : (
          items.map((item) => <PlaylistRow key={item.id} item={item} ctx={ctx} frame={frame} controls={controls} />)
        )}
      </div>
    </div>
  );
}
