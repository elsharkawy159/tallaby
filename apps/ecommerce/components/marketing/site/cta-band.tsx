import * as React from "react";
import { Container } from "./layout-primitives";
import { Reveal } from "./reveal.client";

/** Dark teal closing call to action with an amber glow. Dark buttons inside it turn amber. */
export function CtaBand({ title, body, action }: { title: React.ReactNode; body?: React.ReactNode; action: React.ReactNode }) {
  return (
    <section className="pt-4 pb-20">
      <Container>
        <Reveal className="cta-glow relative flex flex-wrap items-center justify-between gap-8 overflow-hidden rounded-[28px] bg-teal-900 px-[22px] py-10 text-white sm:px-8 sm:py-11 min-[861px]:rounded-band min-[861px]:px-14 min-[861px]:py-16 [&_[data-tone=dark]]:bg-amber-600 [&_[data-tone=dark]]:text-teal-900 [&_[data-tone=dark]]:shadow-cta [&_[data-tone=dark]:hover]:bg-amber-700 [&_[data-tone=dark]:hover]:text-teal-900 [&_[data-tone=teal]]:bg-amber-600 [&_[data-tone=teal]]:text-teal-900 [&_[data-tone=teal]:hover]:bg-amber-700">
          <div className="relative">
            <h2 className="max-w-[620px] text-[clamp(26px,3.4vw,40px)] leading-[1.3] font-bold text-balance text-white en:leading-[1.15] en:tracking-[-0.01em]">
              {title}
            </h2>
            {body ? <p className="mt-2.5 text-base text-ink-on-dark">{body}</p> : null}
          </div>
          <div className="relative">{action}</div>
        </Reveal>
      </Container>
    </section>
  );
}
