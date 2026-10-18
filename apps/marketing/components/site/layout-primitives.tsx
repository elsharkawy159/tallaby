import * as React from "react";
import { cn } from "@workspace/ui/lib/utils";

/** Page-width wrapper (1240px, 24px gutters, 18px on phones). */
export function Container({ className, ...props }: React.ComponentProps<"div">) {
  return <div className={cn("mx-auto w-full max-w-[1240px] px-[18px] sm:px-6", className)} {...props} />;
}

/** Standard vertical rhythm for page sections. */
export function Section({ className, ...props }: React.ComponentProps<"section">) {
  return <section className={cn("py-[72px] md:py-24", className)} {...props} />;
}

/** Small amber label with a leading rule, used above hero titles. */
export function Eyebrow({ className, ...props }: React.ComponentProps<"span">) {
  return (
    <span
      className={cn(
        "mb-[18px] inline-flex items-center gap-2 text-[13px] font-semibold text-amber-300 before:h-0.5 before:w-[22px] before:rounded-sm before:bg-amber-600 before:content-['']",
        className,
      )}
      {...props}
    />
  );
}

/** Section heading block: kicker, title, optional description. */
export function SectionHeading({
  kicker,
  title,
  description,
  centered,
  id,
  className,
  children,
}: {
  kicker?: React.ReactNode;
  title: React.ReactNode;
  description?: React.ReactNode;
  centered?: boolean;
  id?: string;
  className?: string;
  children?: React.ReactNode;
}) {
  return (
    <div className={cn("mb-11 max-w-[680px]", centered && "mx-auto text-center", className)}>
      {kicker ? (
        <span className="mb-2.5 block text-[13px] font-bold text-amber-700 en:text-xs en:tracking-[0.1em] en:uppercase">
          {kicker}
        </span>
      ) : null}
      <h2
        id={id}
        className="display-tight text-[clamp(28px,3.6vw,42px)] leading-[1.25] font-extrabold text-teal-900 en:leading-[1.12] en:tracking-[-0.02em]"
      >
        {title}
      </h2>
      {description ? <p className="mt-3.5 text-[17px] text-pretty text-slate-ink">{description}</p> : null}
      {children}
    </div>
  );
}

/** Numbers, prices and URLs are always set in Montserrat with tabular figures. */
export function Num({ className, ...props }: React.ComponentProps<"span">) {
  return <span className={cn("font-latin tabular-nums", className)} {...props} />;
}

/** Keeps Latin runs (URLs, phone numbers) left-to-right inside Arabic text. */
export function Ltr({ className, ...props }: React.ComponentProps<"span">) {
  return <span dir="ltr" className={cn("[unicode-bidi:isolate]", className)} {...props} />;
}

/** Striped stand-in for photography that hasn't been shot yet. */
export function PhotoPlaceholder({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      className={cn(
        "placeholder-stripes grid place-items-center border border-teal-100 p-3 text-center font-mono text-xs font-medium text-teal-500",
        className,
      )}
      {...props}
    />
  );
}
