"use client";

import { useEffect } from "react";
import Link from "next/link";
import { Printer, X } from "lucide-react";
import { Button } from "@workspace/ui/components/button";
import { cn } from "@/lib/utils";

type ToolbarLink = { href: string; label: string; active: boolean };

/**
 * Screen-only bar above the sheets. With `autoPrint` (links from /orders) it
 * opens the print dialog once fonts and images have loaded.
 */
export function PrintToolbar({
  autoPrint,
  title,
  printLabel,
  closeLabel,
  docs,
  languages,
}: {
  autoPrint: boolean;
  title: string;
  printLabel: string;
  closeLabel: string;
  docs: ToolbarLink[];
  languages: ToolbarLink[];
}) {
  useEffect(() => {
    if (!autoPrint) return;
    let cancelled = false;
    const images = Array.from(document.images).filter((img) => !img.complete);
    Promise.all([
      document.fonts?.ready,
      ...images.map(
        (img) =>
          new Promise((done) => {
            img.addEventListener("load", done, { once: true });
            img.addEventListener("error", done, { once: true });
          }),
      ),
    ]).then(() => {
      if (!cancelled) window.print();
    });
    return () => {
      cancelled = true;
    };
  }, [autoPrint]);

  const tabs = (links: ToolbarLink[]) => (
    <div className="inline-flex gap-0.5 rounded-[10px] border bg-card p-[3px]">
      {links.map((link) => (
        <Link
          key={link.href}
          href={link.href}
          replace
          aria-current={link.active ? "page" : undefined}
          className={cn(
            "rounded-lg px-3 py-1.5 text-[13px] font-medium text-muted-foreground transition-colors hover:text-foreground",
            link.active && "bg-primary-soft text-primary-ink hover:text-primary-ink",
          )}
        >
          {link.label}
        </Link>
      ))}
    </div>
  );

  return (
    <div className="print-toolbar sticky top-0 z-10 border-b bg-background/95 backdrop-blur">
      <div className="mx-auto flex max-w-[210mm] flex-wrap items-center gap-2 px-4 py-3">
        <p className="me-auto text-sm font-semibold">{title}</p>
        {tabs(docs)}
        {tabs(languages)}
        <Button onClick={() => window.print()}>
          <Printer className="size-4" aria-hidden />
          {printLabel}
        </Button>
        <Button variant="outline" size="icon" onClick={() => window.close()} aria-label={closeLabel} title={closeLabel}>
          <X className="size-4" aria-hidden />
        </Button>
      </div>
    </div>
  );
}
