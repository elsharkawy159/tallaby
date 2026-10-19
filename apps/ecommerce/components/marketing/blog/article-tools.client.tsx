"use client";

import * as React from "react";
import { Calculator, Link2, MessageCircle } from "lucide-react";
import { useTranslations } from "next-intl";
import { cn } from "@workspace/ui/lib/utils";
import { BrandIcon } from "@/components/marketing/site/brand-icon";
import { useScrollSpy } from "@/components/marketing/site/use-scroll-spy.client";
import { formatNumber, suggestedPrice } from "@/lib/marketing/pricing.lib";

/** Thin amber bar under the header that fills as the article is read. */
export function ReadingProgress({ targetId }: { targetId: string }) {
  const [progress, setProgress] = React.useState(0);

  React.useEffect(() => {
    const onScroll = () => {
      const el = document.getElementById(targetId);
      if (!el) return;
      const top = el.getBoundingClientRect().top + window.scrollY;
      const p = (window.scrollY - top + window.innerHeight * 0.4) / el.offsetHeight;
      setProgress(Math.min(1, Math.max(0, p)));
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [targetId]);

  return (
    <div aria-hidden data-print="hide" className="pointer-events-none fixed inset-x-0 top-[68px] z-[49] h-[3px]">
      <i className="block h-full bg-amber-600 transition-[width] duration-100 ltr:origin-left" style={{ width: `${progress * 100}%` }} />
    </div>
  );
}

export function ArticleToc({ title, sections }: { title: string; sections: { id: string; label: string }[] }) {
  const active = useScrollSpy(sections.map((s) => s.id));
  return (
    <nav aria-label={title} className="sticky top-[110px] hidden gap-0.5 self-start text-sm md:grid">
      <b className="mb-1.5 text-xs text-neutral-500">{title}</b>
      {sections.map((s) => (
        <a
          key={s.id}
          href={`#${s.id}`}
          aria-current={active === s.id ? "true" : undefined}
          className="border-s-2 border-neutral-200 px-3 py-1.5 leading-[1.45] text-slate-ink hover:text-teal-900 hover:no-underline aria-[current=true]:border-amber-600 aria-[current=true]:font-semibold aria-[current=true]:text-teal-900"
        >
          {s.label}
        </a>
      ))}
    </nav>
  );
}

/** Share links plus "copy link". */
export function ShareBar({ title }: { title: string }) {
  const t = useTranslations("blog.post");
  const [copied, setCopied] = React.useState(false);
  const [url, setUrl] = React.useState("");
  React.useEffect(() => setUrl(window.location.href), []);

  const btn = "grid size-10 place-items-center rounded-xl border border-neutral-200 bg-white text-teal-700 hover:bg-teal-50";
  const enc = encodeURIComponent;

  return (
    <aside
      data-print="hide"
      className="col-span-full flex items-center gap-2 lg:sticky lg:top-[110px] lg:col-span-1 lg:grid lg:justify-items-start lg:self-start"
    >
      <small className="text-xs font-semibold text-neutral-500 lg:mb-1">{t("share")}</small>
      <a className={btn} aria-label="WhatsApp" target="_blank" rel="noopener noreferrer" href={`https://wa.me/?text=${enc(`${title} ${url}`)}`}>
        <MessageCircle className="size-[18px]" aria-hidden />
      </a>
      <a
        className={btn}
        aria-label="X"
        target="_blank"
        rel="noopener noreferrer"
        href={`https://x.com/intent/post?text=${enc(title)}&url=${enc(url)}`}
      >
        <BrandIcon name="x" className="size-4" />
      </a>
      <button
        type="button"
        className={cn(btn, "flex w-auto gap-1.5 px-3 text-[13px] font-semibold")}
        onClick={() => {
          void navigator.clipboard?.writeText(window.location.href);
          setCopied(true);
        }}
      >
        <Link2 className="size-[15px]" aria-hidden />
        <span>{copied ? t("copied") : t("copy")}</span>
      </button>
    </aside>
  );
}

/** "Try it: price calculator" box inside the pricing article. */
export function PriceCalculator() {
  const t = useTranslations("blog.article");
  const tc = useTranslations("common");
  const [values, setValues] = React.useState({ unitCost: "180", packaging: "15", shipping: "45", marginPct: "60" });
  const n = (v: string) => Math.max(0, parseFloat(v) || 0);
  const result = suggestedPrice({
    unitCost: n(values.unitCost),
    packaging: n(values.packaging),
    shipping: n(values.shipping),
    marginPct: n(values.marginPct),
  });

  const fields = [
    { key: "unitCost", label: t("unitCost") },
    { key: "packaging", label: t("packaging") },
    { key: "shipping", label: t("shipping") },
    { key: "marginPct", label: t("margin"), max: 300 },
  ] as const;

  return (
    <div className="my-9 rounded-[22px] bg-teal-900 p-7 text-[15px] leading-[1.6] text-white">
      <h3 className="mb-1 flex items-center gap-2 text-lg font-bold">
        <Calculator className="size-[18px] text-amber-600" aria-hidden />
        {t("toolTitle")}
      </h3>
      <p className="mb-5 text-haze">{t("toolBody")}</p>
      <div className="grid grid-cols-2 gap-2.5 md:grid-cols-4">
        {fields.map((f) => (
          <label key={f.key} className="grid gap-1.5 text-xs font-semibold text-mist">
            <span>{f.label}</span>
            <input
              type="number"
              inputMode="decimal"
              min={0}
              max={"max" in f ? f.max : undefined}
              value={values[f.key]}
              onChange={(e) => setValues((v) => ({ ...v, [f.key]: e.target.value }))}
              className="h-[46px] w-full rounded-xl border border-white/20 bg-white/5 px-3 font-latin text-[17px] font-bold text-white outline-none focus:border-amber-600"
            />
          </label>
        ))}
      </div>
      <div aria-live="polite" className="mt-5 flex flex-wrap items-center justify-between gap-4 border-t border-white/10 pt-5">
        <div>
          <span className="text-[13px] text-mist">{t("suggested")}</span>
          <div className="font-latin text-[44px] leading-none font-extrabold tracking-[-0.03em] text-amber-600">
            {formatNumber(result.price)}
            <small className="ms-1.5 text-base tracking-normal text-white">{tc("egp")}</small>
          </div>
        </div>
        <ul className="m-0 grid list-none gap-0.5 p-0 text-[13px] text-mist [&_b]:font-latin [&_b]:text-white">
          <li>
            {t("cost")}: <b>{formatNumber(result.cost)}</b>
          </li>
          <li>
            {t("fee")}: <b>{result.fee}</b>
          </li>
          <li>
            {t("profit")}: <b>{formatNumber(result.profit)}</b>
          </li>
        </ul>
      </div>
    </div>
  );
}
