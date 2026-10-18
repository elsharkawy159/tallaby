"use client";

import * as React from "react";
import { BadgePercent, Check, Lock, Smartphone, Timer } from "lucide-react";
import { useTranslations } from "next-intl";
import { cn } from "@workspace/ui/lib/utils";
import { SlugClaimForm } from "@/components/signup/signup-trigger.client";
import { ROOT_DOMAIN } from "@/lib/site.lib";

const DEMO_NAMES = ["nour", "cairo-tech", "glow-skin", "bags-by-sara", "fresh-dates", "alex-wear"];
const THEME_COLORS = ["#145163", "#111111", "#c8586b", "#5b7a4f", "#e4572e"];

type HeroSlugContext = { slug: string; setSlug: (slug: string) => void };
const HeroSlug = React.createContext<HeroSlugContext>({ slug: "", setSlug: () => {} });

/** Shares the typed store link between the hero form and the browser preview. */
export function HeroSlugProvider({ children }: { children: React.ReactNode }) {
  const [slug, setSlug] = React.useState("");
  const value = React.useMemo(() => ({ slug, setSlug }), [slug]);
  return <HeroSlug.Provider value={value}>{children}</HeroSlug.Provider>;
}

export function HeroSlugForm() {
  const { slug, setSlug } = React.useContext(HeroSlug);
  return <SlugClaimForm inputId="hero-slug" value={slug} onValueChange={setSlug} />;
}

/** Types demo store names until the visitor types their own. */
function useTypedDemo(userSlug: string) {
  const [text, setText] = React.useState(DEMO_NAMES[0]!);
  const [done, setDone] = React.useState(true);
  const [color, setColor] = React.useState(0);

  React.useEffect(() => {
    if (userSlug) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let index = 0;
    let char = 0;
    let timer: number;

    const tick = () => {
      if (document.hidden) {
        timer = window.setTimeout(tick, 500);
        return;
      }
      const word = DEMO_NAMES[index % DEMO_NAMES.length]!;
      char += 1;
      setText(word.slice(0, char));
      setDone(false);
      if (char >= word.length) {
        setDone(true);
        setColor((c) => (c + 1) % THEME_COLORS.length);
        index += 1;
        char = 0;
        timer = window.setTimeout(tick, 2600);
      } else {
        timer = window.setTimeout(tick, 90);
      }
    };
    timer = window.setTimeout(tick, 400);
    return () => window.clearTimeout(timer);
  }, [userSlug]);

  return { text: userSlug || text, available: Boolean(userSlug) || done, color, setColor };
}

/** The browser window on the right of the hero. Decorative. */
export function HeroClaimVisual() {
  const t = useTranslations("home.hero");
  const tc = useTranslations("common");
  const { slug } = React.useContext(HeroSlug);
  const { text, available, color, setColor } = useTypedDemo(slug);
  const accent = THEME_COLORS[color]!;

  return (
    <div dir="ltr" className="relative isolate mx-auto mt-[30px] w-full max-w-[600px] lg:mt-0 lg:max-w-none">
      <div aria-hidden className="animate-rise overflow-hidden rounded-[18px] bg-white text-body shadow-[0_40px_90px_rgba(0,0,0,0.4)] [animation-delay:100ms]">
        <div className="flex items-center gap-3 border-b border-neutral-200 bg-[#f1f3f2] px-4 py-3.5">
          <div className="flex gap-1.5">
            {[0, 1, 2].map((i) => (
              <i key={i} className="block size-2.5 rounded-full bg-[#d3d8d7]" />
            ))}
          </div>
          <div className="flex h-11 min-w-0 flex-1 items-center gap-2.5 rounded-xl border border-neutral-200 bg-white px-3.5 font-latin text-base font-semibold text-teal-900 shadow-xs">
            <Lock className="size-[15px] flex-none text-success" />
            <span className="flex items-center overflow-hidden text-ellipsis whitespace-nowrap">
              <b className="font-bold">{text}</b>
              <span className="font-medium text-neutral-500">.{ROOT_DOMAIN}</span>
              <i className="ms-0.5 block h-5 w-0.5 animate-blink bg-teal-900" />
            </span>
          </div>
          <span
            className={cn(
              "flex items-center gap-1 rounded-full bg-success-soft px-2.5 py-[5px] font-latin text-[11px] font-bold whitespace-nowrap text-[#166534] transition-opacity duration-300",
              available ? "opacity-100" : "opacity-0",
            )}
          >
            <Check className="size-3" />
            {tc("available")}
          </span>
        </div>
        <div className="relative grid min-h-[330px] gap-3.5 bg-white p-[18px]" style={{ "--a": accent } as React.CSSProperties}>
          <div className="flex animate-pop items-center gap-2.5 [animation-delay:500ms]">
            <span className="size-[30px] rounded-[9px] bg-(--a) transition-colors duration-300" />
            <span className="h-3 w-[70px] rounded-md bg-neutral-100" />
            <span className="ms-auto flex gap-2.5">
              {[0, 1, 2].map((i) => (
                <i key={i} className="block h-2 w-9 rounded bg-neutral-100" />
              ))}
            </span>
          </div>
          <div className="flex h-[130px] animate-pop flex-col justify-center gap-2.5 rounded-xl bg-[linear-gradient(135deg,var(--a),color-mix(in_oklch,var(--a),#fff_35%))] px-[22px] transition-[background] duration-300 [animation-delay:700ms]">
            <i className="block h-3 w-[48%] rounded-md bg-white/75" />
            <i className="block h-2 w-[32%] rounded-md bg-white/45" />
            <em className="mt-1.5 block h-[26px] w-[72px] rounded-full bg-amber-600" />
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="grid animate-pop gap-1.5" style={{ animationDelay: `${900 + i * 100}ms` }}>
                <span className="aspect-square rounded-[10px] bg-neutral-100" />
                <span className="h-2 w-4/5 rounded bg-neutral-100" />
                <span className="h-2 w-[45%] rounded bg-neutral-200" />
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="absolute top-[84px] -right-[22px] z-[2] hidden animate-rise flex-col gap-2 rounded-full bg-teal-800 p-2 shadow-[0_18px_40px_rgba(0,0,0,0.3)] [animation-delay:1200ms] sm:flex">
        {THEME_COLORS.map((c, i) => (
          <button
            key={c}
            type="button"
            tabIndex={-1}
            aria-label={t("themeColor", { n: i + 1 })}
            aria-pressed={i === color}
            onClick={() => setColor(i)}
            className="size-[26px] rounded-full shadow-[inset_0_0_0_2px_rgba(255,255,255,0.18)] aria-pressed:shadow-[0_0_0_2px_var(--color-teal-800),0_0_0_4px_#fff]"
            style={{ background: c }}
          />
        ))}
      </div>

      <FloatingPill
        className="-top-3.5 left-2 [animation-delay:1400ms] sm:-top-[22px] sm:-left-[26px]"
        iconClassName="bg-amber-100 text-[#8a5300]"
        icon={<Timer className="size-[18px]" />}
        title={t("pillReady")}
        sub={t("pillReadySub")}
      />
      <FloatingPill
        className="right-2 -bottom-3.5 [animation-delay:1700ms] sm:-right-[30px] sm:bottom-9"
        iconClassName="bg-success-soft text-success"
        icon={<BadgePercent className="size-[18px]" />}
        title={t("pillFee")}
        sub={t("pillFeeSub")}
      />
      <FloatingPill
        className="-bottom-5 left-10 hidden px-3 py-2 [animation-delay:2000ms] sm:flex"
        iconClassName="size-7 bg-teal-50 text-teal-700"
        icon={<Smartphone className="size-4" />}
        sub={t("pillPhone")}
      />
    </div>
  );
}

function FloatingPill({
  className,
  iconClassName,
  icon,
  title,
  sub,
}: {
  className?: string;
  iconClassName?: string;
  icon: React.ReactNode;
  title?: string;
  sub: string;
}) {
  return (
    <div
      aria-hidden
      dir="auto"
      className={cn(
        "absolute z-[2] flex animate-rise items-center gap-2.5 rounded-[14px] bg-white px-3.5 py-2.5 text-[13px] leading-[1.35] text-body shadow-[0_18px_40px_rgba(0,0,0,0.3)]",
        className,
      )}
    >
      <span className={cn("grid size-[34px] flex-none place-items-center rounded-[10px]", iconClassName)}>{icon}</span>
      <div>
        {title ? <b className="block text-sm">{title}</b> : null}
        <small className="text-xs text-neutral-600">{sub}</small>
      </div>
    </div>
  );
}
