import * as React from "react";
import { cn } from "@workspace/ui/lib/utils";
import { Container, Eyebrow } from "./layout-primitives";

/**
 * Inner page header, sitting on the page fog. An <em> in the title turns amber.
 * tone="dark" keeps the old dark teal header, for pages not moved to the new design yet.
 */
export function PageHero({
  eyebrow,
  title,
  lead,
  centered,
  tone = "light",
  className,
  containerClassName,
  titleClassName,
  children,
  aside,
}: {
  eyebrow?: React.ReactNode;
  title?: React.ReactNode;
  lead?: React.ReactNode;
  centered?: boolean;
  tone?: "light" | "dark";
  className?: string;
  containerClassName?: string;
  titleClassName?: string;
  /** Rendered under the lead, in the text column. */
  children?: React.ReactNode;
  /** Optional second column (illustration, stats card). */
  aside?: React.ReactNode;
}) {
  const dark = tone === "dark";
  const text = (
    <div className={cn(centered && "mx-auto flex max-w-[820px] flex-col items-center text-center")}>
      {eyebrow ? <Eyebrow>{eyebrow}</Eyebrow> : null}
      {title ? (
        <h1
          className={cn(
            "text-[clamp(34px,5.6vw,60px)] leading-[1.25] font-bold text-balance en:leading-[1.1] en:tracking-[-0.02em] [&_em]:text-amber-700 [&_em]:not-italic",
            dark ? "text-white" : "text-teal-900",
            titleClassName,
          )}
        >
          {title}
        </h1>
      ) : null}
      {lead ? (
        <p className={cn("mt-5 max-w-[600px] text-[clamp(16px,2vw,19px)] text-pretty", dark ? "text-mist" : "text-[#56696e]")}>{lead}</p>
      ) : null}
      {children}
    </div>
  );

  return (
    <section className={cn("relative pt-11 pb-14 sm:pt-[72px] sm:pb-20", dark && "overflow-hidden bg-teal-900 text-white", className)}>
      {dark ? <div aria-hidden className="hero-glow pointer-events-none absolute inset-0" /> : null}
      <Container className={cn("relative", aside && "grid items-center gap-12 lg:grid-cols-2 lg:gap-14", containerClassName)}>
        {text}
        {aside}
      </Container>
    </section>
  );
}
