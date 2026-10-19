"use client";

import * as React from "react";
import { Check, Lock, ShoppingBag } from "lucide-react";
import { useTranslations } from "next-intl";
import { cn } from "@workspace/ui/lib/utils";
import { CtaButton } from "@/components/marketing/site/cta-button";
import { useSignup } from "@/components/marketing/signup/signup-dialog.client";
import { prettyName, ROOT_DOMAIN, slugify } from "@/lib/marketing/site.lib";
import { IMG } from "@/lib/marketing/templates.data";

/** The demo store shared in the chat until the visitor types their own link. */
const DEMO = { slug: "tick-store", name: "tick.", image: IMG.hayato, product: "Watch 6", price: "1,080" };

/**
 * Story beats: 1 chat shows the shared link, 2 the customer picks a product,
 * 3 the reply pops in, 4 the order card arrives, 5 everything fades out.
 * [beat, delay in ms after the loop starts].
 */
const BEATS: [number, number][] = [
  [1, 700],
  [2, 2400],
  [3, 3600],
  [4, 4600],
  [5, 9200],
];
const LOOP_MS = 10000;
const FINAL_BEAT = 4;

/** Plays the story beats on a loop; holds the final beat for reduced motion. */
function useStoryBeat() {
  const [beat, setBeat] = React.useState(0);

  React.useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setBeat(FINAL_BEAT);
      return;
    }

    let timers: number[] = [];
    const clear = () => {
      timers.forEach(window.clearTimeout);
      timers = [];
    };
    function play() {
      clear();
      setBeat(0);
      timers = BEATS.map(([b, ms]) => window.setTimeout(() => setBeat(b), ms));
      timers.push(window.setTimeout(play, LOOP_MS));
    }
    const onVisibility = () => (document.hidden ? clear() : play());

    play();
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      clear();
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, []);

  return beat;
}

/** Compact "yourbrand.tallaby.com [Claim]" bar with the share-to-order story under it. */
export function HeroStory({ children }: { children?: React.ReactNode }) {
  const t = useTranslations("common");
  const { openSignup } = useSignup();
  const [slug, setSlug] = React.useState("");
  const beat = useStoryBeat();

  return (
    <>
      <form
        dir="ltr"
        onSubmit={(e) => {
          e.preventDefault();
          openSignup(slug);
        }}
        className="group flex w-full max-w-[600px] flex-wrap items-center gap-2 rounded-[22px] bg-white p-2 shadow-[0_10px_30px_rgba(0,0,0,0.25)] sm:flex-nowrap sm:rounded-full sm:p-1.5"
      >
        <label className="flex min-w-0 flex-[1_1_100%] cursor-text items-center overflow-hidden px-3 py-2.5 font-latin text-[clamp(17px,2vw,22px)] leading-[1.2] font-bold whitespace-nowrap text-teal-900 sm:flex-1 sm:py-0 sm:ps-4 sm:pe-1">
          <Lock className="me-[.35em] size-[.62em] flex-none stroke-[2.4] text-success" aria-hidden />
          {/* The hidden ::after copy sizes the input to its text, so the suffix follows it. */}
          <span
            data-v={slug || "yourbrand"}
            className="inline-grid min-w-0 after:invisible after:[grid-area:1/1] after:pe-0.5 after:whitespace-pre after:content-[attr(data-v)]"
          >
            <input
              name="slug"
              size={1}
              value={slug}
              onChange={(e) => setSlug(slugify(e.target.value).slice(0, 30))}
              placeholder="yourbrand"
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
          className="hidden items-center gap-[5px] rounded-full bg-success-soft px-2.5 py-1 font-latin text-[11px] font-bold whitespace-nowrap text-[#166534] sm:flex"
        >
          <Check className="size-[13px]" />
          {t("available")}
        </span>
        <CtaButton type="submit" className="h-[46px] w-full px-[22px] text-[15px] sm:w-auto">
          {t("claimLink")}
        </CtaButton>
      </form>
      {children}
      <StoryStage beat={beat} slug={slug} />
    </>
  );
}

const CARD = "rounded-[20px] bg-white text-start text-body shadow-[0_24px_60px_rgba(0,0,0,0.35)] transition-[opacity,translate,scale] duration-700 ease-[cubic-bezier(.2,.7,.2,1)]";

/** Chat card, order card and step chips. The cards are decorative. */
function StoryStage({ beat, slug }: { beat: number; slug: string }) {
  const t = useTranslations("home.hero.story");
  const chatOn = beat >= 1 && beat < 5;
  const replyOn = beat >= 3 && beat < 5;
  const noteOn = beat >= 4 && beat < 5;
  const step = beat >= 4 ? 3 : beat >= 2 ? 2 : beat >= 1 ? 1 : 0;
  const steps = [t("step1"), t("step2"), t("step3")];

  return (
    <div className="mt-14 flex w-full flex-col items-center">
      <div aria-hidden className="flex w-full max-w-[940px] flex-col items-center gap-4 pb-5 sm:flex-row sm:items-start sm:justify-center sm:gap-10">
        <div
          className={cn(
            CARD,
            "w-full max-w-[320px] p-3.5",
            chatOn ? "opacity-100" : "translate-y-5 scale-[.96] opacity-0 ltr:translate-x-[30px] rtl:-translate-x-[30px]",
          )}
        >
          <div className="mb-3 flex items-center gap-2.5 border-b border-neutral-100 pb-3">
            <span className="grid size-9 place-items-center rounded-full bg-amber-100 font-extrabold text-[#8a5300]">{t("customerInitial")}</span>
            <div>
              <b className="block text-sm leading-[1.2]">{t("customer")}</b>
              <small className="text-[11.5px] text-success">{t("online")}</small>
            </div>
          </div>
          <div className="ms-auto mt-2 max-w-[88%] rounded-[14px] rounded-ee-[4px] bg-[#e3f4e8] px-2.5 py-2 text-[13px] leading-normal">
            <div className="mb-1.5 flex items-center gap-2 rounded-[10px] bg-white p-1.5">
              <span
                className="size-10 flex-none rounded-lg bg-[#f1f3f2] bg-contain bg-center bg-no-repeat"
                style={{ backgroundImage: `url('${DEMO.image}')` }}
              />
              <div dir="ltr" className="min-w-0 text-left">
                <b className="block truncate font-latin text-xs font-extrabold">{slug ? prettyName(slug) : DEMO.name}</b>
                <small className="block truncate font-latin text-[11px] font-semibold text-teal-700">
                  {slug || DEMO.slug}.{ROOT_DOMAIN}
                </small>
              </div>
            </div>
            {t("shared")}
          </div>
          <div
            className={cn(
              "mt-2 max-w-[88%] rounded-[14px] rounded-es-[4px] px-2.5 py-2 text-[13px] leading-normal ltr:origin-bottom-left rtl:origin-bottom-right",
              replyOn ? "animate-bubble bg-amber-100" : "scale-50 bg-neutral-100 opacity-0",
            )}
          >
            {t("reply")}
          </div>
        </div>
        <div
          className={cn(
            CARD,
            "w-full max-w-[320px] p-4 sm:mt-[90px] sm:w-[300px]",
            noteOn ? "opacity-100" : "translate-y-5 scale-[.96] opacity-0 ltr:-translate-x-[30px] rtl:translate-x-[30px]",
          )}
        >
          <div className="flex items-center gap-2.5">
            <span className="grid size-10 flex-none place-items-center rounded-xl bg-amber-100 text-[#8a5300]">
              <ShoppingBag className="size-[18px]" />
            </span>
            <div>
              <b className="block text-[15px] leading-[1.3]">{t("orderTitle")}</b>
              <small className="text-xs text-neutral-600">{t("orderMeta")}</small>
            </div>
          </div>
          <div className="mt-3.5 flex justify-between border-t border-dashed border-neutral-200 pt-3 text-[13px]">
            <span>{DEMO.product}</span>
            <b dir="ltr" className="font-latin text-teal-900">
              {DEMO.price} EGP
            </b>
          </div>
          <div className="mt-3.5 flex justify-between border-t border-dashed border-neutral-200 pt-3 text-[13px]">
            <span>{t("fee")}</span>
            <b dir="ltr" className="font-latin text-[#166534]">
              5 EGP
            </b>
          </div>
        </div>
      </div>
      <ol aria-label={t("steps")} className="m-0 mt-7 flex list-none flex-wrap justify-center gap-2.5 p-0">
        {steps.map((label, i) => {
          const on = step === i + 1;
          return (
            <li
              key={label}
              aria-current={on ? "step" : undefined}
              className={cn(
                "flex items-center gap-2 rounded-full border px-3.5 py-2 text-[13.5px] transition-all duration-400",
                on ? "border-transparent bg-amber-600 font-bold text-teal-900" : "border-white/12 font-semibold text-haze",
              )}
            >
              <span
                className={cn(
                  "grid size-5 place-items-center rounded-full font-latin text-xs font-bold",
                  on ? "bg-teal-900 text-white" : "bg-white/10",
                )}
              >
                {i + 1}
              </span>
              {label}
            </li>
          );
        })}
      </ol>
    </div>
  );
}
