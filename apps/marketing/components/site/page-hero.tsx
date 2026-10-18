import * as React from "react";
import { cn } from "@workspace/ui/lib/utils";
import { Container, Eyebrow } from "./layout-primitives";

/** Dark teal page header used by every inner page. */
export function PageHero({
  eyebrow,
  title,
  lead,
  className,
  containerClassName,
  titleClassName,
  children,
  aside,
}: {
  eyebrow?: React.ReactNode;
  title?: React.ReactNode;
  lead?: React.ReactNode;
  className?: string;
  containerClassName?: string;
  titleClassName?: string;
  /** Rendered under the lead, in the text column. */
  children?: React.ReactNode;
  /** Optional second column (illustration, stats card). */
  aside?: React.ReactNode;
}) {
  const text = (
    <div>
      {eyebrow ? <Eyebrow>{eyebrow}</Eyebrow> : null}
      {title ? (
        <h1
          className={cn(
            "display-tight text-[clamp(34px,5vw,60px)] leading-[1.22] font-extrabold text-white en:leading-[1.05]",
            titleClassName,
          )}
        >
          {title}
        </h1>
      ) : null}
      {lead ? <p className="mt-5 max-w-[560px] text-base text-pretty text-mist sm:text-lg">{lead}</p> : null}
      {children}
    </div>
  );

  return (
    <section className={cn("relative overflow-hidden bg-teal-900 py-[52px] pb-[60px] text-white sm:py-20 sm:pb-[88px]", className)}>
      <div aria-hidden className="hero-glow pointer-events-none absolute inset-0" />
      <Container
        className={cn(
          "relative",
          aside && "grid items-center gap-12 lg:grid-cols-2 lg:gap-14",
          containerClassName,
        )}
      >
        {text}
        {aside}
      </Container>
    </section>
  );
}
