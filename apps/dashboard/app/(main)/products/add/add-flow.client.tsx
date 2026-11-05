"use client";

import type { ReactNode } from "react";
import { ArrowRight, Check, Minus, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

/*
 * The shared pieces of the AI and File screens (Seller Add Product v4): a centred
 * stage under a back bar, the intro, and the step-by-step progress card.
 */

const RISE = "motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-2 motion-safe:duration-500";

export const PILL_BUTTON_CLASS =
  "inline-flex h-[34px] shrink-0 cursor-pointer items-center gap-1.5 whitespace-nowrap rounded-full border border-(--s-line) bg-(--s-surface-2) px-3 text-xs text-(--s-muted) transition-colors hover:border-(--s-field-strong) hover:text-(--s-ink) disabled:pointer-events-none disabled:opacity-50 max-[600px]:h-10 [&_svg]:size-[15px] [&_svg]:shrink-0";

const BACK_CLASS =
  "inline-flex h-[34px] cursor-pointer items-center gap-1.5 rounded-full border border-(--s-line) bg-(--s-surface) ps-3 pe-3.5 text-[13px] text-(--s-muted) transition-colors hover:border-(--s-field-strong) hover:text-(--s-ink) max-[600px]:h-10 [&_svg]:size-[15px] [&_svg]:ltr:rotate-180";

/** The screen: full height under the top bar, centred until a run moves its content up. */
export function FlowStage({
  back,
  icon: Icon,
  label,
  running = false,
  children,
}: {
  /** A button or Link with the back label; see `backProps`. */
  back: ReactNode;
  icon: LucideIcon;
  label: string;
  running?: boolean;
  children: ReactNode;
}) {
  return (
    <div className="flex min-h-[calc(100dvh-68px)] flex-col max-[600px]:min-h-[calc(100dvh-60px)]">
      <div className="mx-auto flex w-full max-w-[760px] flex-1 flex-col gap-[22px] px-6 pt-7 pb-10 max-[640px]:px-3 max-[640px]:pt-4 max-[640px]:pb-6">
        <div className="flex items-center gap-2.5">
          {back}
          <span className="inline-flex min-w-0 items-center gap-1.5 text-xs text-(--s-muted)">
            <Icon className="size-3.5 shrink-0 text-primary-ink" aria-hidden />
            <span className="truncate">{label}</span>
          </span>
        </div>
        <div className={cn("flex min-w-0 flex-1 flex-col gap-[22px]", running ? "justify-start" : "justify-center")}>{children}</div>
      </div>
    </div>
  );
}

export const backClassName = BACK_CLASS;

export function BackIcon() {
  return <ArrowRight aria-hidden />;
}

export function FlowOrb({ icon: Icon, amber = false, small = false, className }: { icon: LucideIcon; amber?: boolean; small?: boolean; className?: string }) {
  return (
    <span
      className={cn(
        "grid shrink-0 place-items-center",
        small ? "size-[38px] rounded-xl [&_svg]:size-[18px]" : "size-[52px] rounded-2xl [&_svg]:size-6",
        amber ? "bg-accent-soft text-accent-ink" : "bg-primary-soft text-primary-ink",
        className,
      )}
    >
      <Icon aria-hidden />
    </span>
  );
}

export function FlowIntro({ orb, title, titleId, body, children }: { orb?: ReactNode; title: string; titleId?: string; body?: string; children?: ReactNode }) {
  return (
    <div className={cn("flex flex-col items-center gap-2.5 text-center", RISE)}>
      {orb}
      <h1 id={titleId} tabIndex={titleId ? -1 : undefined} className="text-balance text-[26px] leading-normal font-bold text-(--s-ink) outline-none max-[640px]:text-[21px]">
        {title}
      </h1>
      {body && <p className="max-w-[520px] text-sm text-pretty text-(--s-muted)">{body}</p>}
      {children}
    </div>
  );
}

export type GenStepState = "wait" | "run" | "done" | "skip";

export type GenStep = {
  key: string;
  label: string;
  state: GenStepState;
  /** What the step found, shown once it is done or skipped. */
  output?: ReactNode;
};

function GenSteps({ steps }: { steps: GenStep[] }) {
  return (
    <ul className="flex flex-col px-[18px] pt-2.5 pb-3">
      {steps.map((step, index) => (
        <li
          key={step.key}
          className={cn(
            "relative grid grid-cols-[24px_minmax(0,1fr)] gap-x-3 py-2 transition-opacity duration-300",
            step.state === "wait" && "opacity-[.42]",
          )}
        >
          {index < steps.length - 1 && (
            <span
              className={cn(
                "absolute start-[11px] top-9 -bottom-1 w-0.5 rounded-sm transition-colors duration-300",
                step.state === "done" ? "bg-success/45" : "bg-(--s-line)",
              )}
              aria-hidden
            />
          )}
          <span
            className={cn(
              "relative z-10 grid size-6 place-items-center rounded-full border-2 bg-(--s-surface) [&_svg]:size-[13px] [&_svg]:stroke-[3]",
              step.state === "wait" && "border-(--s-field-strong)",
              step.state === "run" && "animate-spin border-primary-soft border-t-(--s-primary)",
              step.state === "done" && "border-success bg-success text-white",
              step.state === "skip" && "border-dashed border-(--s-field-strong) text-(--s-faint)",
            )}
          >
            {step.state === "done" && <Check aria-hidden />}
            {step.state === "skip" && <Minus aria-hidden />}
          </span>
          <span className={cn("text-sm leading-6 text-(--s-ink)", step.state === "run" ? "font-semibold" : "font-medium")}>{step.label}</span>
          {(step.state === "done" || step.state === "skip") && step.output != null && (
            <div className="col-start-2 mt-0.5 min-w-0 text-xs leading-[1.7] text-(--s-muted) wrap-break-word motion-safe:animate-in motion-safe:fade-in motion-safe:duration-300">
              {step.output}
            </div>
          )}
        </li>
      ))}
    </ul>
  );
}

/** The progress card. `percent` null: no number to claim, either waiting on one long call or (`finished`) nothing left to measure. */
export function GenCard({
  icon,
  amber = false,
  title,
  subtitle,
  percent,
  finished = false,
  steps,
  children,
}: {
  icon: LucideIcon;
  amber?: boolean;
  title: string;
  subtitle?: ReactNode;
  percent: number | null;
  finished?: boolean;
  steps: GenStep[];
  children?: ReactNode;
}) {
  return (
    <div className={cn("overflow-hidden rounded-[20px] border border-(--s-line) bg-(--s-surface) shadow-(--s-shadow-card)", RISE)}>
      <div className="flex items-center gap-3 px-[18px] py-4" role="status" aria-live="polite">
        <FlowOrb icon={icon} amber={amber} small />
        <div className="min-w-0">
          <b className="block text-[15px] font-bold text-(--s-ink)">{title}</b>
          {subtitle && <small className="block text-xs text-(--s-muted)">{subtitle}</small>}
        </div>
        {percent !== null && <span className="ms-auto font-montserrat text-[13px] font-bold tabular-nums text-primary-ink">{percent}%</span>}
      </div>
      <div className="h-[3px] overflow-hidden bg-(--s-line)" aria-hidden>
        <i
          className={cn(
            "block h-full transition-[width] duration-500",
            finished ? "bg-success" : "bg-(--s-primary)",
            percent === null && (finished ? "w-full" : "w-1/4 motion-safe:animate-pulse"),
          )}
          style={percent === null ? undefined : { width: `${percent}%` }}
        />
      </div>
      <GenSteps steps={steps} />
      {children}
    </div>
  );
}

/** The card's footer: the result on a green tint, with what to do next. */
export function GenFoot({ title, body, children }: { title: ReactNode; body?: ReactNode; children?: ReactNode }) {
  return (
    <div className="flex flex-wrap items-center gap-3 border-t border-(--s-line) bg-success-soft/55 px-[18px] py-3.5 motion-safe:animate-in motion-safe:fade-in motion-safe:duration-300">
      <span className="grid size-8 shrink-0 place-items-center rounded-full bg-success text-white [&_svg]:size-4 [&_svg]:stroke-[2.5]">
        <Check aria-hidden />
      </span>
      <div className="min-w-[180px] flex-1">
        <b className="block text-sm text-(--s-ink)">{title}</b>
        {body && <small className="block text-xs text-(--s-muted)">{body}</small>}
      </div>
      {children}
    </div>
  );
}
