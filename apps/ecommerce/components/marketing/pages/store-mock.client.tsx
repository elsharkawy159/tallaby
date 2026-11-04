"use client";

import * as React from "react";
import Image from "next/image";
import { Heart, Menu, Search, ShoppingBag } from "lucide-react";
import { cn } from "@workspace/ui/lib/utils";

export type MockStoreProduct = { name: string; price: string; was?: string; focus: string; colors: readonly string[] };

export type MockStore = {
  brand: string;
  photo: string;
  announcement: string;
  nav: string[];
  heroSmall: string;
  hero: string;
  cta: string;
  categories: string[];
  products: MockStoreProduct[];
  currency: string;
  sale: string;
  addToCart: string;
  sizeLabel: string;
  colorLabel: string;
  sizes: string[];
  selectedSize: number;
};

/**
 * A running clock in a mock store: it only ticks while on screen, and stays
 * still under reduced motion.
 */
export function DemoCountdown({ seconds, children }: { seconds: number; children: (parts: [string, string, string]) => React.ReactNode }) {
  const [left, setLeft] = React.useState(seconds);
  const ref = React.useRef<HTMLSpanElement>(null);

  React.useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let timer: number | undefined;
    const stop = () => {
      window.clearInterval(timer);
      timer = undefined;
    };
    const start = () => {
      if (timer !== undefined) return;
      timer = window.setInterval(() => setLeft((value) => (value > 0 ? value - 1 : seconds)), 1000);
    };
    const observer = new IntersectionObserver((entries) => (entries.some((entry) => entry.isIntersecting) ? start() : stop()));
    if (ref.current) observer.observe(ref.current);
    return () => {
      observer.disconnect();
      stop();
    };
  }, [seconds]);

  const pad = (value: number) => String(value).padStart(2, "0");
  return (
    <span ref={ref} className="contents">
      {children([pad(Math.floor(left / 3600)), pad(Math.floor((left % 3600) / 60)), pad(left % 60)])}
    </span>
  );
}

const COUNTDOWN = 2 * 3600 + 14 * 60 + 36;

/**
 * An illustrated storefront, drawn in em units off its own width so it scales
 * with its box. `pin` places the numbered callouts on the showcase.
 */
export function StoreMock({ store, pin }: { store: MockStore; pin?: (index: number) => React.ReactNode }) {
  return (
    <div className="bg-[#f6f3ee] [container-type:inline-size]">
      <div className="text-[1.45cqw] leading-normal text-[#1f2326]">
        <div className="relative flex justify-center gap-[0.8em] bg-[#1f2326] p-[0.55em] text-center text-[0.9em] font-semibold text-[#efe9df]">
          {store.announcement}
          <DemoCountdown seconds={COUNTDOWN}>
            {([h, m, s]) => (
              <b dir="ltr" className="font-latin tracking-[0.04em] text-[#c9b79c] tabular-nums">
                {h}:{m}:{s}
              </b>
            )}
          </DemoCountdown>
          {pin?.(0)}
        </div>
        <div className="grid grid-cols-[1fr_auto_1fr] items-center border-b border-[#1f23261a] px-[1.6em] py-[1em]">
          <nav className="flex gap-[1.4em] text-[0.95em] font-semibold">
            {store.nav.map((item) => (
              <span key={item}>{item}</span>
            ))}
          </nav>
          <span dir="ltr" className="font-latin text-[1.6em] font-extrabold tracking-[0.28em]">
            {store.brand}
          </span>
          <span className="flex justify-end gap-[1em] [&_svg]:size-[1.3em]">
            <Search />
            <Heart />
            <ShoppingBag />
          </span>
        </div>
        <div className="relative h-[24em] overflow-hidden bg-[#3d4a48]">
          <Image src={store.photo} alt="" fill sizes="(min-width: 1080px) 640px, 100vw" className="object-contain object-[right_30%] rtl:object-[left_30%] rtl:-scale-x-100" />
          <div className="absolute inset-0 bg-gradient-to-l from-[rgba(20,18,16,0.6)] to-[rgba(20,18,16,0.05)] to-65% ltr:bg-gradient-to-r" />
          <div className="absolute inset-y-0 start-0 flex max-w-[52%] flex-col items-start justify-center gap-[0.7em] p-[2.4em] text-white">
            <small className="text-[0.85em] font-semibold opacity-85">{store.heroSmall}</small>
            <b className="text-[2.6em] leading-[1.25]">{store.hero}</b>
            <span className="relative bg-[#c9b79c] px-[1.4em] py-[0.6em] text-[0.95em] font-bold text-[#1f2326]">
              {store.cta}
              {pin?.(1)}
            </span>
          </div>
        </div>
        <div className="relative flex flex-wrap gap-[0.7em] px-[1.6em] pt-[1.3em] pb-[0.4em]">
          {store.categories.map((category, i) => (
            <span key={category} className={cn("rounded-full border border-[#1f232633] px-[1.1em] py-[0.35em] text-[0.9em] font-semibold", i === 0 && "border-[#1f2326] bg-[#1f2326] text-white")}>
              {category}
            </span>
          ))}
          {pin?.(2)}
        </div>
        <div className="grid grid-cols-4 gap-[1.1em] px-[1.6em] pt-[1em] pb-[1.8em]">
          {store.products.map((product, i) => (
            <div key={product.name} className="text-[0.95em]">
              <div className="relative mb-[0.6em] aspect-[3/4] overflow-hidden bg-[#e8e1d6]">
                {product.was ? <span className="absolute start-[0.6em] top-[0.6em] z-[1] bg-[#b4412f] px-[0.6em] py-[0.15em] font-latin text-[0.8em] font-bold text-white">{store.sale}</span> : null}
                <Image src={store.photo} alt="" fill sizes="160px" className="object-cover" style={{ objectPosition: product.focus }} />
              </div>
              <b className="block font-semibold">{product.name}</b>
              <span dir="ltr" className="inline-block font-latin font-bold">
                {product.price} {store.currency}
              </span>
              {product.was ? (
                <span className="relative">
                  <s className="ms-[0.4em] font-latin text-[0.85em] font-medium text-[#8a8580]">{product.was}</s>
                  {i === 0 ? pin?.(3) : null}
                </span>
              ) : null}
              <div className="relative mt-[0.35em] flex gap-[0.35em]">
                {product.colors.map((color) => (
                  <i key={color} className="block size-[0.9em] rounded-full shadow-[0_0_0_1px_#1f232633]" style={{ backgroundColor: color }} />
                ))}
                {i === 1 ? pin?.(4) : null}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/** The same store's product page, for a phone frame. */
export function ProductMock({ store }: { store: MockStore }) {
  const product = store.products[0]!;
  return (
    <div className="h-full bg-[#f6f3ee] [container-type:inline-size]">
      <div className="flex h-full flex-col text-[5.2cqw] leading-normal text-[#1f2326]">
        <div className="flex items-center justify-between px-[0.9em] pt-[2.6em] pb-[0.5em] font-latin font-extrabold tracking-[0.2em] [&_svg]:size-[1.1em]">
          <Menu />
          <span dir="ltr">{store.brand}</span>
          <ShoppingBag />
        </div>
        <div className="relative aspect-[1/1.05] flex-none overflow-hidden bg-[#e8e1d6]">
          <Image src={store.photo} alt="" fill sizes="200px" className="object-cover" style={{ objectPosition: product.focus }} />
        </div>
        <div className="flex flex-1 flex-col gap-[0.5em] px-[0.9em] py-[0.7em]">
          <b className="text-[1.05em]">{product.name}</b>
          <span dir="ltr" className="font-latin text-[1.05em] font-bold rtl:text-right">
            {product.price} {store.currency}
          </span>
          <span className="text-[0.75em] font-semibold text-[#6d6862]">{store.sizeLabel}</span>
          <div className="flex gap-[0.35em]">
            {store.sizes.map((size, i) => (
              <span key={size} className={cn("flex-1 border border-[#1f232633] py-[0.25em] text-center font-latin text-[0.78em] font-semibold", i === store.selectedSize && "border-[#1f2326] bg-[#1f2326] text-white")}>
                {size}
              </span>
            ))}
          </div>
          <span className="text-[0.75em] font-semibold text-[#6d6862]">{store.colorLabel}</span>
          <div className="flex gap-[0.45em]">
            {product.colors.map((color, i) => (
              <i
                key={color}
                className={cn("block size-[1.2em] rounded-full", i === 0 ? "shadow-[0_0_0_2px_#f6f3ee,0_0_0_3.5px_#1f2326]" : "shadow-[0_0_0_2px_#f6f3ee,0_0_0_3px_#1f232633]")}
                style={{ backgroundColor: color }}
              />
            ))}
          </div>
          <span className="mt-auto bg-[#1f2326] p-[0.65em] text-center text-[0.9em] font-bold text-white">{store.addToCart}</span>
        </div>
      </div>
    </div>
  );
}

/** A storefront on a laptop with its product page on a phone. Purely a picture. */
export function DeviceStage({ store, floats, children }: { store: MockStore; floats?: React.ReactNode; children?: React.ReactNode }) {
  return (
    <div aria-hidden className="relative pt-7 pb-10">
      <div className="absolute inset-y-0 start-[4%] end-0 overflow-hidden rounded-t-[160px] rounded-b-[32px] bg-gradient-to-b from-teal-700 to-teal-900 sm:start-[8%] sm:rounded-t-[240px]" />
      <div className="relative z-[1] mt-10 sm:me-[110px] sm:mt-[70px]">
        <div className="rounded-t-xl bg-[#0f1d21] px-1.5 pt-1.5 shadow-[0_22px_50px_rgba(13,55,67,0.25)] sm:rounded-t-[18px] sm:px-[9px] sm:pt-[9px]">
          <div className="overflow-hidden rounded-t-lg">{children ?? <StoreMock store={store} />}</div>
        </div>
        <div className="relative mx-[-5%] h-3.5 rounded-b-[14px] bg-gradient-to-b from-[#dfe6e8] to-[#b9c5c8]" />
      </div>
      <div className="absolute end-[-6px] -bottom-6 z-[3] aspect-[9/18.5] w-[120px] rounded-[20px] bg-[#0f1d21] p-[5px] shadow-[0_22px_50px_rgba(13,55,67,0.3)] sm:end-0 sm:bottom-1.5 sm:w-[200px] sm:rounded-[32px] sm:p-[7px]">
        <div className="h-full overflow-hidden rounded-2xl bg-white sm:rounded-[26px]">
          <ProductMock store={store} />
        </div>
      </div>
      {floats}
    </div>
  );
}
