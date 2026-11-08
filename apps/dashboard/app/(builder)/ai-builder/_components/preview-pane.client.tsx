"use client";

import { ArrowLeft, Check, ExternalLink, Globe, LayoutTemplate, Loader2, Lock, RotateCw, Store } from "lucide-react";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { useLocale, useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import { SellerButton, Tag } from "@/components/seller-ui";
import { DEVICE_WIDTH, deviceScale, templatePreviewSrc, type PreviewDevice } from "./workspace.lib";

/**
 * The right pane (spec §10): a browser-like frame with the store's address,
 * refresh and open-in-a-new-tab, showing the store's draft preview while it
 * builds and the live store once published. Before a design is chosen it
 * shows the 3 suggested templates side by side as live thumbnails; one click
 * fills the pane with that template and "Choose this design".
 */

export type PaneTemplate = { key: string; name: string; recommended: boolean; palette: string[] };

export type PaneContent =
  | { kind: "empty"; building: boolean }
  | { kind: "templates"; templates: PaneTemplate[]; selected: string | null }
  | { kind: "template"; template: PaneTemplate; selected: boolean; canChoose: boolean; backToAll: boolean }
  | { kind: "store"; src: string; published: boolean };

/** The logical width a thumbnail draws the template at. */
const THUMB_WIDTH = 1280;

/** An iframe drawn at `width` px and scaled to its box (never above 1). Fills the box when `width` is null. */
function ScaledFrame({
  src,
  width,
  title,
  interactive,
  onLoad,
  className,
}: {
  src: string;
  width: number | null;
  title: string;
  interactive: boolean;
  onLoad: () => void;
  className?: string;
}) {
  const box = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState<{ w: number; h: number } | null>(null);
  useEffect(() => {
    const el = box.current;
    if (!el) return;
    const measure = () => setSize({ w: el.clientWidth, h: el.clientHeight });
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);
  const scale = width && size ? Math.min(1, size.w / width) : 1;
  return (
    <div ref={box} className={cn("relative h-full w-full overflow-hidden", className)} dir="ltr">
      {size && (
        <iframe
          src={src}
          title={title}
          tabIndex={interactive ? 0 : -1}
          aria-hidden={interactive ? undefined : true}
          loading="lazy"
          onLoad={onLoad}
          className={cn("absolute left-0 top-0 origin-top-left border-0 bg-white", !interactive && "pointer-events-none")}
          style={width ? { width, height: size.h / scale, transform: `scale(${scale})` } : { width: "100%", height: "100%" }}
        />
      )}
    </div>
  );
}

function Shimmer({ label }: { label?: string }) {
  return (
    <div className="pointer-events-none absolute inset-0 z-10 flex items-end justify-center bg-white/30 pb-6" aria-hidden={!label}>
      <div className="ai-shimmer absolute inset-0" />
      {label && (
        <span role="status" className="relative inline-flex items-center gap-2 rounded-full bg-(--s-surface) px-3.5 py-2 text-[12.5px] font-semibold text-(--s-ink) shadow-(--s-shadow-menu)">
          <Loader2 className="size-3.5 animate-spin text-(--s-primary)" aria-hidden />
          {label}
        </span>
      )}
    </div>
  );
}

export function PreviewPane({
  content,
  address,
  device,
  siteOrigin,
  reloadKey,
  refreshing,
  onRefresh,
  onFocusTemplate,
  onBackToTemplates,
  onChooseTemplate,
}: {
  content: PaneContent;
  address: string | null;
  device: PreviewDevice;
  /** https://tallaby.com, for the template previews. */
  siteOrigin: string;
  /** Changes when the store preview should load again. */
  reloadKey: number;
  /** A build step is being drawn: the soft shimmer shows over the frame. */
  refreshing: boolean;
  onRefresh: () => void;
  onFocusTemplate: (key: string) => void;
  onBackToTemplates: () => void;
  onChooseTemplate: (key: string) => void;
}) {
  const t = useTranslations("aiBuilder.ws.preview");
  const locale = useLocale();
  const [loaded, setLoaded] = useState<string | null>(null);
  const [localReload, setLocalReload] = useState(0);

  const src =
    content.kind === "store" ? content.src : content.kind === "template" ? templatePreviewSrc(siteOrigin, locale, content.template.key) : null;
  const frameKey = `${src}:${reloadKey}:${localReload}`;
  const shownAddress =
    content.kind === "store" ? address : content.kind === "template" ? `${siteOrigin.replace(/^https?:\/\//, "")}/template-preview/${content.template.key}` : (address ?? null);
  const newTab = content.kind === "template" ? src : content.kind === "store" ? src : null;

  return (
    <section aria-label={t("title")} className="flex h-full min-h-0 flex-col gap-3 p-3 max-[1023px]:p-2">
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-[18px] border border-(--s-line) bg-(--s-surface) shadow-[0_20px_50px_rgb(13_55_67/0.08)]">
        {/* The browser chrome. */}
        <div className="flex h-12 shrink-0 items-center gap-2 border-b border-(--s-line) bg-(--s-surface-2) px-3" dir="ltr">
          <span className="flex gap-1.5 max-[600px]:hidden" aria-hidden>
            <span className="size-2.5 rounded-full bg-[#ff5f57]/70" />
            <span className="size-2.5 rounded-full bg-[#febc2e]/70" />
            <span className="size-2.5 rounded-full bg-[#28c840]/70" />
          </span>
          <div className="flex h-8 min-w-0 flex-1 items-center gap-2 rounded-full bg-(--s-surface) px-3 text-[12.5px] text-(--s-muted) ring-1 ring-(--s-line)">
            {content.kind === "store" ? <Lock className="size-3.5 shrink-0" aria-hidden /> : <Globe className="size-3.5 shrink-0" aria-hidden />}
            <span className="truncate font-montserrat" aria-label={t("address")}>
              {shownAddress ?? t("noAddress")}
            </span>
          </div>
          <button
            type="button"
            disabled={!src}
            onClick={() => {
              if (content.kind === "store") onRefresh();
              else setLocalReload((value) => value + 1);
            }}
            aria-label={t("refresh")}
            className="grid size-9 cursor-pointer place-items-center rounded-full text-(--s-subtle) hover:bg-(--s-hover) hover:text-(--s-ink) disabled:opacity-40"
          >
            <RotateCw className="size-4" aria-hidden />
          </button>
          {newTab ? (
            <a href={newTab} target="_blank" rel="noreferrer" aria-label={t("newTab")} className="grid size-9 place-items-center rounded-full text-(--s-subtle) hover:bg-(--s-hover) hover:text-(--s-ink)">
              <ExternalLink className="size-4" aria-hidden />
            </a>
          ) : null}
        </div>

        <div className="relative min-h-0 flex-1 bg-(--s-fill)">
          {content.kind === "empty" && (
            <div className="flex h-full flex-col items-center justify-center gap-3 px-8 text-center">
              <span className="grid size-14 place-items-center rounded-2xl bg-(--s-surface) text-(--s-primary) ring-1 ring-(--s-line)">
                {content.building ? <Loader2 className="size-6 animate-spin" aria-hidden /> : <Store className="size-6" aria-hidden />}
              </span>
              <p className="text-[15px] font-bold text-(--s-ink)">{content.building ? t("buildingSoon") : t("emptyTitle")}</p>
              {!content.building && <p className="max-w-sm text-[13px] leading-[1.8] text-(--s-subtle)">{t("emptyBody")}</p>}
            </div>
          )}

          {content.kind === "templates" && (
            <div className="flex h-full flex-col gap-3 overflow-y-auto p-4">
              <div className="flex items-center gap-2">
                <LayoutTemplate className="size-4 text-(--s-primary)" aria-hidden />
                <p className="text-[13.5px] font-bold text-(--s-ink)">{t("pickTitle")}</p>
                <p className="text-[12.5px] text-(--s-subtle)">{t("pickBody")}</p>
              </div>
              <div className="grid min-h-0 flex-1 grid-cols-3 gap-3 max-[1279px]:grid-cols-2 max-[800px]:grid-cols-1">
                {content.templates.map((template) => {
                  const on = content.selected === template.key;
                  return (
                    <button
                      key={template.key}
                      type="button"
                      onClick={() => onFocusTemplate(template.key)}
                      aria-label={t("openTemplate", { name: template.name })}
                      className={cn(
                        "group flex min-h-[260px] cursor-pointer flex-col overflow-hidden rounded-2xl border bg-(--s-surface) text-start transition-[border-color,box-shadow,transform] hover:-translate-y-0.5 hover:shadow-(--s-shadow-hover)",
                        on ? "border-(--s-solid) ring-2 ring-(--s-solid)" : "border-(--s-line)",
                      )}
                    >
                      <div className="relative min-h-0 flex-1">
                        <ScaledFrame
                          src={templatePreviewSrc(siteOrigin, locale, template.key, true)}
                          width={THUMB_WIDTH}
                          title={t("templateLabel", { name: template.name })}
                          interactive={false}
                          onLoad={() => undefined}
                        />
                      </div>
                      <div className="flex items-center gap-2 border-t border-(--s-line) px-3 py-2.5">
                        <span className="flex -space-x-1" aria-hidden>
                          {template.palette.slice(0, 4).map((color) => (
                            <span key={color} className="size-3.5 rounded-full ring-2 ring-(--s-surface)" style={{ backgroundColor: color }} />
                          ))}
                        </span>
                        <span className="min-w-0 flex-1 truncate text-[13px] font-bold text-(--s-ink)">{template.name}</span>
                        {template.recommended && <Tag tone="warning">{t("recommended")}</Tag>}
                        {on && <Check className="size-4 text-(--s-primary)" aria-hidden />}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {(content.kind === "template" || content.kind === "store") && src && (
            <>
              <div className={cn("flex h-full justify-center overflow-hidden", DEVICE_WIDTH[device] && "py-4")}>
                <DeviceBox device={device}>
                  <ScaledFrame
                    key={frameKey}
                    src={src}
                    width={DEVICE_WIDTH[device]}
                    title={content.kind === "store" ? t("storeFrame") : t("templateLabel", { name: content.template.name })}
                    interactive
                    onLoad={() => setLoaded(frameKey)}
                  />
                </DeviceBox>
              </div>
              {loaded !== frameKey && <Shimmer label={refreshing ? t("updating") : t("loading")} />}
            </>
          )}
        </div>

        {content.kind === "template" && (
          <div className="flex shrink-0 flex-wrap items-center gap-2 border-t border-(--s-line) bg-(--s-surface) px-3 py-2.5">
            {content.backToAll && (
              <SellerButton variant="mini" size="sm" className="min-h-11" onClick={onBackToTemplates}>
                <ArrowLeft className="rtl:rotate-180" aria-hidden />
                {t("backToPicks")}
              </SellerButton>
            )}
            <span className="min-w-0 flex-1 truncate text-[13.5px] font-bold text-(--s-ink)">
              {content.template.name}
              {content.template.recommended && <Tag tone="warning" className="ms-2">{t("recommended")}</Tag>}
            </span>
            {content.canChoose && (
              <SellerButton size="sm" className="min-h-11" variant={content.selected ? "solid" : "amber"} onClick={() => onChooseTemplate(content.template.key)}>
                <Check aria-hidden />
                {content.selected ? t("chosen") : t("chooseThis")}
              </SellerButton>
            )}
          </div>
        )}
      </div>
    </section>
  );
}

/** Phone and tablet get a device outline at their width (scaled down to fit); desktop fills the frame. */
function DeviceBox({ device, children }: { device: PreviewDevice; children: ReactNode }) {
  const outer = useRef<HTMLDivElement>(null);
  const [paneWidth, setPaneWidth] = useState(0);
  useEffect(() => {
    const el = outer.current?.parentElement;
    if (!el) return;
    const measure = () => setPaneWidth(el.clientWidth - 32);
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);
  const width = DEVICE_WIDTH[device];
  if (!width) return <div ref={outer} className="h-full w-full">{children}</div>;
  const shown = Math.round(width * deviceScale(device, paneWidth || width));
  return (
    <div
      ref={outer}
      className="h-full overflow-hidden rounded-[28px] border-[6px] border-(--s-ink)/85 bg-white shadow-(--s-shadow-pop) transition-[width] duration-300"
      style={{ width: shown + 12 }}
    >
      {children}
    </div>
  );
}
