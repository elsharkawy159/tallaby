"use client";

import { useEffect, useRef } from "react";
import { useTranslations } from "next-intl";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { scrollToSection, type SectionProgress } from "./add-product.lib";

export function summarize(sections: SectionProgress[]) {
  const total = sections.reduce((sum, s) => sum + s.total, 0);
  const done = sections.reduce((sum, s) => sum + s.done, 0);
  return { percent: total ? Math.round((done / total) * 100) : 100, left: total - done };
}

export function ProgressRing({ percent, small = false }: { percent: number; small?: boolean }) {
  return (
    <div
      className={cn(
        "grid shrink-0 place-items-center rounded-full",
        small ? "size-10" : "size-[46px]"
      )}
      style={{
        background: `conic-gradient(var(--primary) ${percent}%, var(--border) 0)`,
      }}
      role="img"
      aria-label={`${percent}%`}
    >
      <b
        className={cn(
          "grid place-items-center rounded-full bg-card font-sans text-[11px] font-bold tabular-nums",
          small ? "size-[31px]" : "size-9"
        )}
      >
        {percent}%
      </b>
    </div>
  );
}

/** Desktop aside: readiness ring plus a clickable section checklist. */
export function PublishChecklist({
  sections,
  activeId,
}: {
  sections: SectionProgress[];
  activeId: string;
}) {
  const t = useTranslations("productForm.page");
  const { percent, left } = summarize(sections);

  return (
    <div className="rounded-2xl border bg-card p-4 shadow-xs">
      <div className="mb-3 flex items-center gap-3">
        <ProgressRing percent={percent} />
        <div className="min-w-0">
          <strong className="block text-sm">
            {percent === 0 ? t("startBasics") : left ? t("readiness") : t("ready")}
          </strong>
          <small className="text-xs text-muted-foreground">
            {left ? t("remaining", { count: left }) : t("allDone")}
          </small>
        </div>
      </div>
      <nav className="flex flex-col gap-0.5">
        {sections.map((section) => (
          <a
            key={section.id}
            href={`#${section.id}`}
            onClick={(e) => {
              e.preventDefault();
              scrollToSection(section.id);
            }}
            className={cn(
              "flex items-center gap-2.5 rounded-[9px] px-2 py-[7px] text-[13px] transition-colors",
              activeId === section.id
                ? "bg-primary-soft font-semibold text-primary-ink"
                : "text-foreground hover:bg-muted"
            )}
          >
            <StatusDot section={section} />
            <span>{t(`nav.${section.nav}`)}</span>
            <em
              className={cn(
                "ms-auto text-[11px] not-italic tabular-nums",
                section.hasError ? "text-destructive" : "text-faint"
              )}
            >
              {section.total ? `${section.done}/${section.total}` : t("optional")}
            </em>
          </a>
        ))}
      </nav>
    </div>
  );
}

function StatusDot({ section }: { section: SectionProgress }) {
  return (
    <span
      className={cn(
        "grid size-[18px] shrink-0 place-items-center rounded-full border-[1.5px]",
        section.complete && !section.hasError
          ? "border-success bg-success text-white"
          : section.hasError
            ? "border-destructive bg-destructive-soft"
            : "border-input"
      )}
    >
      {section.complete && !section.hasError && <Check className="size-[11px] stroke-[3]" />}
    </span>
  );
}

/** Mobile: horizontally scrolling section chips under the page header. */
export function SectionChips({
  sections,
  activeId,
}: {
  sections: SectionProgress[];
  activeId: string;
}) {
  const t = useTranslations("productForm.page");
  const navRef = useRef<HTMLElement>(null);

  // Keep the active chip in view as the seller scrolls the form.
  useEffect(() => {
    const nav = navRef.current;
    const chip = nav?.querySelector<HTMLElement>(`[data-section="${activeId}"]`);
    if (!nav || !chip) return;
    nav.scrollTo({
      left: chip.offsetLeft - nav.clientWidth / 2 + chip.clientWidth / 2,
      behavior: "smooth",
    });
  }, [activeId]);

  return (
    <nav
      ref={navRef}
      className="flex gap-1.5 overflow-x-auto px-3 pb-3 [scrollbar-width:none] sm:px-6 lg:hidden"
    >
      {sections.map((section) => (
        <a
          key={section.id}
          data-section={section.id}
          href={`#${section.id}`}
          onClick={(e) => {
            e.preventDefault();
            scrollToSection(section.id);
          }}
          className={cn(
            "flex h-8 shrink-0 items-center gap-1.5 rounded-full border px-3 text-xs whitespace-nowrap",
            activeId === section.id
              ? "border-primary bg-primary text-primary-foreground"
              : "bg-card text-foreground"
          )}
        >
          <i
            className={cn(
              "size-1.5 rounded-full",
              section.hasError
                ? "bg-destructive"
                : section.complete
                  ? "bg-success"
                  : activeId === section.id
                    ? "bg-white/50"
                    : "bg-input"
            )}
          />
          {t(`nav.${section.nav}`)}
        </a>
      ))}
    </nav>
  );
}

/** Mobile: fixed bottom bar with readiness and the publish actions. */
export function MobilePublishBar({
  sections,
  actions,
}: {
  sections: SectionProgress[];
  actions: React.ReactNode;
}) {
  const t = useTranslations("productForm.page");
  const { percent, left } = summarize(sections);

  return (
    <div className="fixed inset-x-0 bottom-0 z-30 flex items-center gap-2.5 border-t bg-card px-4 py-3 shadow-[0_-6px_20px_rgba(20,81,99,0.08)] lg:hidden">
      <ProgressRing percent={percent} small />
      <div className="min-w-0 flex-1">
        <small className="block text-[11px] text-muted-foreground">{t("readiness")}</small>
        <b className="block truncate text-[13px]">
          {left ? t("remaining", { count: left }) : t("ready")}
        </b>
      </div>
      {actions}
    </div>
  );
}
