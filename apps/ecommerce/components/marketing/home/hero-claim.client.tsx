"use client";

import * as React from "react";
import { Check, Lock } from "lucide-react";
import { useTranslations } from "next-intl";
import { cn } from "@workspace/ui/lib/utils";
import { CtaButton } from "@/components/marketing/site/cta-button";
import { useSignup } from "@/components/marketing/signup/signup-dialog.client";
import { MiniStore } from "@/components/marketing/templates/store-preview";
import { prettyName, ROOT_DOMAIN, slugify } from "@/lib/marketing/site.lib";
import { TEMPLATES } from "@/lib/marketing/templates.data";

/** Demo store link typed for each template, in TEMPLATES order. */
const DEMO_SLUGS = ["volt-egypt", "atelier-cairo", "glow-skin", "nook-home", "charm-alex", "tick-store"];

type FanPosition = "center" | "left" | "right" | "hidden";

const FAN_STYLES: Record<FanPosition, React.CSSProperties> = {
  center: { transform: "translateX(-50%)", zIndex: 3 },
  left: {
    transform: "translateX(-50%) translateX(-44%) translateY(46px) rotate(-7deg) scale(.86)",
    zIndex: 2,
    filter: "brightness(.62)",
  },
  right: {
    transform: "translateX(-50%) translateX(44%) translateY(46px) rotate(7deg) scale(.86)",
    zIndex: 2,
    filter: "brightness(.62)",
  },
  hidden: { transform: "translateX(-50%) translateY(160px) scale(.7)", zIndex: 1, opacity: 0 },
};

function fanPosition(i: number, front: number): FanPosition {
  const n = TEMPLATES.length;
  const d = (i - front + n) % n;
  return d === 0 ? "center" : d === 1 ? "right" : d === n - 1 ? "left" : "hidden";
}

/**
 * Types each template's demo link into the placeholder, then erases it and
 * rotates the fan to the next template. Stops while the visitor types.
 */
function useLinkDemo(userSlug: string) {
  const [front, setFront] = React.useState(0);
  const [placeholder, setPlaceholder] = React.useState(DEMO_SLUGS[0]!);
  const [available, setAvailable] = React.useState(true);
  const frontRef = React.useRef(0);

  React.useEffect(() => {
    if (userSlug) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let timer: number;
    let char = 0;
    let phase: "type" | "hold" | "erase" = "type";
    const later = (ms: number) => {
      timer = window.setTimeout(step, ms);
    };

    function step() {
      if (document.hidden) return later(500);
      const word = DEMO_SLUGS[frontRef.current]!;
      if (phase === "type") {
        char += 1;
        setPlaceholder(word.slice(0, char));
        if (char < word.length) return later(85);
        setAvailable(true);
        phase = "hold";
        return later(2600);
      }
      if (phase === "hold") {
        setAvailable(false);
        phase = "erase";
        return later(30);
      }
      char -= 1;
      setPlaceholder(word.slice(0, char));
      if (char > 0) return later(30);
      frontRef.current = (frontRef.current + 1) % TEMPLATES.length;
      setFront(frontRef.current);
      phase = "type";
      later(450);
    }

    // Resume from the word already shown (first run, or after clearing the input).
    char = DEMO_SLUGS[frontRef.current]!.length;
    phase = "hold";
    setPlaceholder(DEMO_SLUGS[frontRef.current]!);
    setAvailable(true);
    later(2600);
    return () => window.clearTimeout(timer);
  }, [userSlug]);

  return { front, placeholder, available: Boolean(userSlug) || available };
}

/** Big "yourbrand.tallaby.com [Claim]" bar with the template fan under it. */
export function HeroLinkClaim({ children }: { children?: React.ReactNode }) {
  const t = useTranslations("common");
  const { openSignup } = useSignup();
  const [slug, setSlug] = React.useState("");
  const { front, placeholder, available } = useLinkDemo(slug);

  return (
    <>
      <form
        dir="ltr"
        onSubmit={(e) => {
          e.preventDefault();
          openSignup(slug);
        }}
        className="group flex w-full max-w-[860px] flex-wrap items-center gap-2.5 rounded-[22px] bg-white p-2 shadow-[0_24px_60px_rgba(0,0,0,0.35),0_0_0_6px_rgba(255,255,255,0.06)] sm:flex-nowrap sm:rounded-full sm:p-2.5"
      >
        <label className="flex min-w-0 flex-[1_1_100%] cursor-text items-center overflow-hidden px-3 py-2.5 font-latin text-xl leading-[1.2] font-bold whitespace-nowrap text-teal-900 sm:flex-1 sm:py-0 sm:ps-[22px] sm:pe-1.5 sm:text-[clamp(22px,3.3vw,40px)]">
          <Lock className="me-[.35em] size-[.62em] flex-none stroke-[2.4] text-success" aria-hidden />
          {/* The hidden ::after copy sizes the input to its text, so the suffix follows it. */}
          <span
            data-v={slug || placeholder || " "}
            className="inline-grid min-w-0 after:invisible after:[grid-area:1/1] after:pe-0.5 after:whitespace-pre after:content-[attr(data-v)]"
          >
            <input
              name="slug"
              size={1}
              value={slug}
              onChange={(e) => setSlug(slugify(e.target.value).slice(0, 30))}
              placeholder={placeholder}
              autoComplete="off"
              spellCheck={false}
              aria-label={t("storeLink")}
              className="w-0 min-w-full bg-transparent p-0 text-left outline-none [grid-area:1/1] placeholder:text-teal-900 focus:placeholder:text-neutral-400"
            />
          </span>
          {slug ? null : (
            <span aria-hidden className="mx-0.5 h-[1em] w-[3px] flex-none animate-blink bg-amber-600 group-focus-within:hidden" />
          )}
          <span className="font-medium text-neutral-500">.{ROOT_DOMAIN}</span>
        </label>
        <span
          aria-hidden
          className={cn(
            "hidden items-center gap-[5px] rounded-full bg-success-soft px-3 py-1.5 font-latin text-xs font-bold whitespace-nowrap text-[#166534] transition-[opacity,transform] duration-300 sm:flex",
            !available && "scale-90 opacity-0",
          )}
        >
          <Check className="size-[13px]" />
          {t("available")}
        </span>
        <CtaButton type="submit" className="h-[52px] w-full px-[30px] text-base sm:h-[60px] sm:w-auto">
          {t("claimLink")}
        </CtaButton>
      </form>
      {children}
      <HeroFan front={front} slug={slug} />
    </>
  );
}

/** Six template cards; the front one shows the link being claimed. Decorative. */
function HeroFan({ front, slug }: { front: number; slug: string }) {
  return (
    <div aria-hidden dir="ltr" className="relative mt-10 h-[280px] w-full sm:mt-16 sm:h-[clamp(320px,36vw,450px)]">
      {TEMPLATES.map((tpl, i) => {
        const position = fanPosition(i, front);
        const own = i === front && slug;
        const look = own ? { ...tpl.look, name: prettyName(slug) } : tpl.look;
        return (
          <div
            key={tpl.id}
            style={FAN_STYLES[position]}
            className={cn(
              "absolute top-0 left-1/2 w-[86%] origin-bottom overflow-hidden rounded-t-2xl bg-white shadow-[0_30px_80px_rgba(0,0,0,0.45)] transition-[transform,opacity,filter] duration-[1s,.7s,.7s] ease-[cubic-bezier(.2,.7,.2,1)] sm:w-[min(620px,82%)]",
              (position === "left" || position === "right") && "max-sm:opacity-0",
            )}
          >
            <div className="flex h-[42px] items-center gap-2.5 border-b border-neutral-200 bg-[#f1f3f2] px-3">
              <div className="flex gap-[5px]">
                {[0, 1, 2].map((d) => (
                  <i key={d} className="block size-[9px] rounded-full bg-[#d6dad9]" />
                ))}
              </div>
              <div className="mx-auto flex h-7 max-w-[340px] flex-1 items-center justify-center gap-1.5 rounded-md bg-white font-latin text-[13px] font-medium text-neutral-600">
                <Lock className="size-[11px] text-success" />
                <span className="truncate">
                  <b className="text-teal-900">{own ? slug : DEMO_SLUGS[i]}</b>.{ROOT_DOMAIN}
                </span>
              </div>
            </div>
            <MiniStore look={look} className="[zoom:1] sm:[zoom:1.4] min-[861px]:[zoom:1.9]" />
          </div>
        );
      })}
    </div>
  );
}
