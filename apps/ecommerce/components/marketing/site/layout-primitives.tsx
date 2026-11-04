import * as React from "react";
import { cn } from "@workspace/ui/lib/utils";

/** Page-width wrapper (1200px, 20px gutters, 16px on phones). */
export function Container({ className, ...props }: React.ComponentProps<"div">) {
  return <div className={cn("mx-auto w-full max-w-[1200px] px-4 sm:px-5", className)} {...props} />;
}

/** Standard vertical rhythm for page sections: 72px, 56px on small screens. */
export function Section({ className, ...props }: React.ComponentProps<"section">) {
  return <section className={cn("py-14 min-[861px]:py-[72px]", className)} {...props} />;
}

/** The small pill above a heading. */
export function Kicker({ className, ...props }: React.ComponentProps<"span">) {
  return (
    <span
      className={cn(
        "inline-flex w-max max-w-full items-center gap-1.5 rounded-full border border-line-kick bg-teal-50 px-3 py-1 text-[13px] font-bold whitespace-nowrap text-teal-700",
        className,
      )}
      {...props}
    />
  );
}

/** A kicker above a page title. */
export function Eyebrow({ className, ...props }: React.ComponentProps<"span">) {
  return <Kicker className={cn("mb-[18px]", className)} {...props} />;
}

/** Section header: kicker pill, title, description. Start-aligned unless centered. */
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
    <div className={cn("mb-11 flex max-w-[720px] flex-col items-start gap-3.5", centered && "mx-auto items-center text-center", className)}>
      {kicker ? <Kicker>{kicker}</Kicker> : null}
      <h2
        id={id}
        className="text-[clamp(28px,4vw,44px)] leading-[1.3] font-bold text-balance text-teal-900 en:leading-[1.15] en:tracking-[-0.01em] [&_em]:text-amber-700 [&_em]:not-italic"
      >
        {title}
      </h2>
      {description ? <p className="text-[17px] text-pretty text-ink-500">{description}</p> : null}
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
