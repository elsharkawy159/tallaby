"use client";

import * as React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { cn } from "@workspace/ui/lib/utils";
import { Link } from "@/i18n/navigation";
import { Chip, ChipRow } from "@/components/marketing/site/chips";
import { CtaButton } from "@/components/marketing/site/cta-button";
import { SignupTrigger } from "@/components/marketing/signup/signup-trigger.client";
import { carouselCardStyle, carouselOffset, wrapIndex } from "@/components/marketing/home/home-demo.lib";
import { templateFrameSrc, type GalleryEntry } from "@/lib/marketing/templates.lib";
import { TemplateLiveThumb } from "./template-live-thumb.client";

/** A 44px tap area centred on a smaller control, drawn by an invisible pseudo-element; the control looks the same. */
const TAP_44 = "relative before:absolute before:top-1/2 before:left-1/2 before:size-11 before:-translate-x-1/2 before:-translate-y-1/2 before:content-['']";
/** A 40px chip in a row with 2px padding: 2px more above and below makes 44px, still inside the scrolling row. */
const TAP_44_CHIP = "relative before:absolute before:inset-x-0 before:-inset-y-0.5 before:content-['']";

/** Fraction of a card's width one step moves. */
const STEP_WIDE = 0.72;
const STEP_PHONE = 0.8;

/**
 * Swipeable templates, one per category, from the code catalog. A card's live
 * preview mounts when the card first comes near the centre and stays mounted,
 * so an open page never holds a frame per template.
 */
export function TemplateCarousel({ entries }: { entries: GalleryEntry[] }) {
  const t = useTranslations("templates");
  const locale = useLocale();
  const isRtl = locale === "ar";
  const n = entries.length;
  const start = Math.min(2, Math.max(n - 1, 0));
  const [active, setActive] = React.useState(start);
  const [position, setPosition] = React.useState(start);
  const [dragging, setDragging] = React.useState(false);
  const [seen, setSeen] = React.useState<ReadonlySet<number>>(() => new Set([start, wrapIndex(start - 1, n), wrapIndex(start + 1, n)]));
  const [stepPx, setStepPx] = React.useState(240);
  const box = React.useRef<HTMLDivElement>(null);
  const card = React.useRef<HTMLElement>(null);
  const drag = React.useRef<{ x: number; from: number; moved: boolean; lastX: number; lastT: number; velocity: number } | null>(null);
  const suppressClick = React.useRef(false);
  const direction = isRtl ? -1 : 1;

  React.useEffect(() => {
    const measure = () => {
      const width = card.current?.offsetWidth ?? 330;
      setStepPx(width * (window.innerWidth < 640 ? STEP_PHONE : STEP_WIDE));
    };
    measure();
    window.addEventListener("resize", measure, { passive: true });
    return () => window.removeEventListener("resize", measure);
  }, []);

  const go = React.useCallback(
    (index: number) => {
      const next = wrapIndex(index, n);
      setActive(next);
      setPosition(next);
      setSeen((prev) => {
        const add = [next, wrapIndex(next - 1, n), wrapIndex(next + 1, n)].filter((i) => !prev.has(i));
        return add.length ? new Set([...prev, ...add]) : prev;
      });
    },
    [n],
  );

  const onPointerDown = (e: React.PointerEvent) => {
    if (e.button) return;
    drag.current = { x: e.clientX, from: position, moved: false, lastX: e.clientX, lastT: performance.now(), velocity: 0 };
  };
  const onPointerMove = (e: React.PointerEvent) => {
    const d = drag.current;
    if (!d) return;
    const dx = e.clientX - d.x;
    if (!d.moved && Math.abs(dx) > 6) {
      d.moved = true;
      setDragging(true);
      box.current?.setPointerCapture(e.pointerId);
    }
    if (!d.moved) return;
    const now = performance.now();
    d.velocity = 0.8 * ((e.clientX - d.lastX) / Math.max(1, now - d.lastT)) + 0.2 * d.velocity;
    d.lastX = e.clientX;
    d.lastT = now;
    setPosition(d.from - (direction * dx) / stepPx);
  };
  const endDrag = (e: React.PointerEvent) => {
    const d = drag.current;
    if (!d) return;
    drag.current = null;
    if (!d.moved) {
      const target = (e.target as HTMLElement).closest<HTMLElement>("[data-card-index]");
      if (target && Number(target.dataset.cardIndex) !== active) go(Number(target.dataset.cardIndex));
      return;
    }
    suppressClick.current = true;
    setDragging(false);
    go(Math.round(position - (direction * d.velocity * 220) / stepPx));
  };

  if (!n) return null;

  return (
    <>
      <ChipRow role="tablist" aria-label={t("categoriesLabel")} className="mx-auto mb-9 max-w-[1200px] px-4 min-[641px]:flex-wrap min-[641px]:justify-center">
        {entries.map((entry, i) => (
          <Chip key={entry.id} role="tab" aria-pressed={undefined} aria-selected={i === active} onClick={() => go(i)} className={TAP_44_CHIP}>
            {t(`categories.${entry.category}`)}
          </Chip>
        ))}
      </ChipRow>
      <div
        ref={box}
        role="group"
        aria-roledescription="carousel"
        aria-label={t("carouselLabel")}
        tabIndex={0}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
        onClickCapture={(e) => {
          if (suppressClick.current) {
            e.preventDefault();
            e.stopPropagation();
            suppressClick.current = false;
          }
        }}
        onKeyDown={(e) => {
          if (e.key === "ArrowLeft") go(active + (isRtl ? 1 : -1));
          if (e.key === "ArrowRight") go(active + (isRtl ? -1 : 1));
        }}
        className="relative h-[550px] cursor-grab touch-pan-y overflow-hidden select-none active:cursor-grabbing min-[641px]:h-[590px]"
      >
        <button type="button" aria-label={t("previous")} onClick={() => go(active - 1)} className="absolute start-[max(20px,calc(50%-400px))] top-1/2 z-20 hidden size-12 -translate-y-1/2 place-items-center rounded-full border border-line bg-white text-teal-900 shadow-[0_6px_18px_rgba(13,55,67,0.1)] min-[641px]:grid">
          <ChevronRight className="size-5 ltr:rotate-180" aria-hidden />
        </button>
        {entries.map((entry, i) => {
          const offset = carouselOffset(i, position, n);
          const style = carouselCardStyle(offset);
          const on = i === active;
          return (
            <article
              key={entry.id}
              ref={on ? card : undefined}
              data-card-index={i}
              aria-hidden={!on}
              aria-label={entry.name}
              className={cn(
                "absolute top-2.5 left-1/2 flex w-[min(300px,78vw)] flex-col overflow-hidden rounded-[30px] border border-line bg-white shadow-[0_14px_36px_rgba(13,55,67,0.09)] min-[641px]:w-[330px]",
                on ? "cursor-default" : "cursor-pointer",
                dragging ? "transition-none" : "transition-[transform,opacity] duration-500 ease-[cubic-bezier(.2,.7,.2,1)]",
              )}
              style={{
                transform: `translateX(calc(-50% + ${direction * offset * stepPx}px)) scale(${style.scale})`,
                opacity: style.opacity,
                zIndex: style.zIndex,
              }}
            >
              <div className="flex items-center justify-between gap-2.5 px-[18px] pt-4 pb-3">
                <div className="min-w-0">
                  <b className="block truncate font-latin text-base text-teal-900">{entry.name}</b>
                  <small className="line-clamp-1 text-[12.5px] text-ink-400">{entry.description ?? ""}</small>
                </div>
                <span className="flex-none rounded-full bg-teal-50 px-2.5 py-0.5 text-[11.5px] font-bold whitespace-nowrap text-teal-700">{t(`categories.${entry.category}`)}</span>
              </div>
              <div className="mx-3 overflow-hidden rounded-[18px] border border-[#edf1f2]">
                {seen.has(i) ? (
                  <TemplateLiveThumb src={templateFrameSrc(locale, entry.id, undefined, true)} className="aspect-[4/5]" frameHeight={1600} />
                ) : (
                  <div className="aspect-[4/5] bg-neutral-100" />
                )}
              </div>
              <div className="flex items-center gap-1.5 px-[18px] pt-3 text-xs text-ink-400">
                {entry.palette.length ? t("colors") : null}
                {entry.palette.slice(0, 4).map((color, c) => (
                  <i key={`${c}-${color}`} className="size-4 rounded-full border-2 border-white shadow-[0_0_0_1px_#dfe8ea]" style={{ background: color }} />
                ))}
              </div>
              {/* A side card is scaled down, so its buttons are no real targets: a tap on it brings it to the centre instead. */}
              <div className={cn("mt-auto flex gap-2 px-[18px] pt-3.5 pb-[18px] transition-opacity duration-300", !on && "pointer-events-none opacity-50")} inert={!on}>
                <SignupTrigger size="sm" tabIndex={on ? 0 : -1} className="h-11 flex-1 shadow-none!">
                  {t("use")}
                </SignupTrigger>
                <CtaButton asChild tone="outline" size="sm" className="h-11">
                  <Link href={`/templates/${entry.id}`} tabIndex={on ? 0 : -1}>
                    {t("preview")}
                  </Link>
                </CtaButton>
              </div>
            </article>
          );
        })}
        <button type="button" aria-label={t("next")} onClick={() => go(active + 1)} className="absolute end-[max(20px,calc(50%-400px))] top-1/2 z-20 hidden size-12 -translate-y-1/2 place-items-center rounded-full border border-line bg-white text-teal-900 shadow-[0_6px_18px_rgba(13,55,67,0.1)] min-[641px]:grid">
          <ChevronLeft className="size-5 ltr:rotate-180" aria-hidden />
        </button>
      </div>
      {/* Below the cards, never over them (owner, F-73). Each dot looks the same (an 8px pill in a 24px box) but takes taps in 44px around it. */}
      <div className="relative z-[21] mt-3 flex flex-wrap justify-center px-4">
        {entries.map((entry, i) => (
          <button
            key={entry.id}
            type="button"
            aria-label={entry.name}
            aria-current={i === active}
            onClick={() => go(i)}
            className={cn("group grid h-6 min-w-6 place-items-center px-[3px]", TAP_44)}
          >
            <span className={cn("block h-2 rounded-full transition-[width,background-color] duration-300", i === active ? "w-7 bg-teal-700" : "w-2 bg-[#cfdde1] group-hover:bg-[#9fb6bc]")} />
          </button>
        ))}
      </div>
    </>
  );
}
