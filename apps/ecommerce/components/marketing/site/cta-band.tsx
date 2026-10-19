import * as React from "react";
import { Container } from "./layout-primitives";
import { Reveal } from "./reveal.client";

/** Amber closing call-to-action at the bottom of inner pages. */
export function CtaBand({ title, body, action }: { title: React.ReactNode; body?: React.ReactNode; action: React.ReactNode }) {
  return (
    <section className="pb-24">
      <Container>
        <Reveal className="relative flex flex-wrap items-center justify-between gap-8 overflow-hidden rounded-[22px] bg-amber-600 px-[22px] py-8 text-teal-900 sm:px-8 sm:py-10 md:rounded-[28px] md:px-16 md:py-14">
          <div aria-hidden className="absolute -bottom-[280px] h-[480px] w-[480px] rounded-full bg-amber-500 ltr:-right-[180px] rtl:-left-[180px]" />
          <div className="relative">
            <h2 className="display-tight max-w-[620px] text-[clamp(26px,3.4vw,40px)] leading-[1.25] font-extrabold en:leading-[1.1] en:tracking-[-0.02em]">
              {title}
            </h2>
            {body ? <p className="mt-2.5 text-base text-amber-ink">{body}</p> : null}
          </div>
          <div className="relative">{action}</div>
        </Reveal>
      </Container>
    </section>
  );
}
