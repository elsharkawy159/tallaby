"use client";

import * as React from "react";
import { Num } from "@/components/marketing/site/layout-primitives";
import { DemoCountdown, StoreMock, type MockStore } from "@/components/marketing/pages/store-mock.client";
import { cn } from "@workspace/ui/lib/utils";

/** Pins on the mock store and the list that explains them; hovering either lights up both. */
export function IndustryShowcase({
  store,
  url,
  callouts,
}: {
  store: MockStore;
  url: string;
  callouts: { title: string; body: string }[];
}) {
  const [active, setActive] = React.useState<number | null>(null);

  const pin = (index: number) => (
    <span
      aria-hidden
      onMouseEnter={() => setActive(index)}
      onMouseLeave={() => setActive(null)}
      className={cn(
        "absolute start-[6%] top-1/2 z-[5] grid size-6 -translate-y-1/2 place-items-center rounded-full bg-amber-600 font-latin text-[11px] font-extrabold text-teal-900 shadow-[0_0_0_5px_rgba(253,173,40,0.3),0_6px_14px_rgba(13,55,67,0.25)] transition-transform duration-150 motion-reduce:transition-none sm:size-[30px] sm:text-[13px]",
        active === index && "scale-110 bg-teal-900 text-white shadow-[0_0_0_6px_rgba(20,81,99,0.25)]",
      )}
    >
      {index + 1}
    </span>
  );

  return (
    <div className="grid items-center gap-8 min-[1081px]:grid-cols-[minmax(0,1fr)_300px]">
      <div aria-hidden className="overflow-hidden rounded-[20px] border border-[#e3ebed] bg-white shadow-[0_22px_56px_rgba(13,55,67,0.12)]">
        <div dir="ltr" className="flex h-10 items-center gap-3 border-b border-[#edf1f2] bg-[#fafcfc] px-3.5">
          {[0, 1, 2].map((i) => (
            <i key={i} className="block size-2.5 rounded-full bg-[#dfe5e6]" />
          ))}
          <span className="mx-auto grid h-[26px] max-w-[320px] flex-1 place-items-center rounded-lg bg-[#f1f4f5] font-latin text-xs font-medium text-ink-400">{url}</span>
        </div>
        <StoreMock store={store} pin={pin} />
      </div>
      <ol className="grid gap-2 min-[641px]:grid-cols-2 min-[1081px]:grid-cols-1">
        {callouts.map((item, i) => (
          <li
            key={item.title}
            onMouseEnter={() => setActive(i)}
            onMouseLeave={() => setActive(null)}
            className={cn(
              "grid grid-cols-[30px_1fr] gap-3 rounded-2xl border border-transparent px-3.5 py-3 transition-[background-color,border-color,box-shadow] duration-150",
              active === i && "border-[#e3ebed] bg-white shadow-[0_10px_26px_rgba(13,55,67,0.07)]",
            )}
          >
            <Num className={cn("grid size-[30px] place-items-center rounded-full bg-amber-100 text-[13px] font-extrabold text-[#7a4a00]", active === i && "bg-teal-900 text-white")}>{i + 1}</Num>
            <div>
              <b className="block text-[15px] text-teal-900">{item.title}</b>
              <span className="text-[13.5px] text-ink-500">{item.body}</span>
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}

/** The clock in the "offers" need card. */
export function CountdownBoxes({ labels }: { labels: [string, string, string] }) {
  return (
    <div dir="ltr" className="flex justify-center gap-2">
      <DemoCountdown seconds={2 * 3600 + 14 * 60 + 36}>
        {(parts) =>
          parts.map((part, i) => (
            <div key={i} className="w-[58px] rounded-xl bg-teal-900 py-2 text-center text-white">
              <b className="block font-latin text-[22px] font-extrabold tabular-nums">{part}</b>
              <small className="text-[11px] text-[#a9c0c6]">{labels[i]}</small>
            </div>
          ))
        }
      </DemoCountdown>
    </div>
  );
}
