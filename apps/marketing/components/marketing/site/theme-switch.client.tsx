"use client";

import * as React from "react";
import { Monitor, Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { cn } from "@workspace/ui/lib/utils";

const OPTIONS = [
  { value: "system", Icon: Monitor },
  { value: "light", Icon: Sun },
  { value: "dark", Icon: Moon },
] as const;

type ThemeValue = (typeof OPTIONS)[number]["value"];

const noopSubscribe = () => () => {};

/**
 * The footer's System / Light / Dark switch: a radio group of three icon
 * buttons (arrow keys move and pick, like native radios). The stored choice is
 * only known in the browser, so the server and the first client render show a
 * same-size placeholder and the real control appears after hydration.
 */
export function ThemeSwitch({ labels }: { labels: { group: string } & Record<ThemeValue, string> }) {
  const { theme, setTheme } = useTheme();
  const mounted = React.useSyncExternalStore(noopSubscribe, () => true, () => false);
  const refs = React.useRef<(HTMLButtonElement | null)[]>([]);
  const current: ThemeValue = mounted && (theme === "light" || theme === "dark") ? theme : "system";

  const box = "inline-flex h-10 items-center gap-0.5 rounded-full border border-white/15 p-1";
  if (!mounted) return <div aria-hidden className={cn(box, "w-[110px]")} />;

  const pick = (index: number) => {
    const next = OPTIONS[(index + OPTIONS.length) % OPTIONS.length]!;
    setTheme(next.value);
    refs.current[(index + OPTIONS.length) % OPTIONS.length]?.focus();
  };

  return (
    <div role="radiogroup" aria-label={labels.group} className={box}>
      {OPTIONS.map(({ value, Icon }, index) => {
        const checked = current === value;
        return (
          <button
            key={value}
            ref={(el) => {
              refs.current[index] = el;
            }}
            type="button"
            role="radio"
            aria-checked={checked}
            aria-label={labels[value]}
            title={labels[value]}
            tabIndex={checked ? 0 : -1}
            onClick={() => setTheme(value)}
            onKeyDown={(event) => {
              // Logical order: in RTL the visual "next" is to the left.
              const rtl = getComputedStyle(event.currentTarget).direction === "rtl";
              const forward = event.key === "ArrowDown" || event.key === (rtl ? "ArrowLeft" : "ArrowRight");
              const back = event.key === "ArrowUp" || event.key === (rtl ? "ArrowRight" : "ArrowLeft");
              if (!forward && !back) return;
              event.preventDefault();
              pick(index + (forward ? 1 : -1));
            }}
            className={cn(
              "grid size-8 place-items-center rounded-full transition-colors duration-150",
              checked ? "bg-white/15 text-white" : "text-ink-on-dark hover:bg-white/10 hover:text-white",
            )}
          >
            <Icon aria-hidden className="size-4" />
          </button>
        );
      })}
    </div>
  );
}
