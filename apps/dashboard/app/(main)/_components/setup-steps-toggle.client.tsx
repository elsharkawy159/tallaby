"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { useTranslations } from "next-intl";
import { cn } from "@workspace/ui/lib/utils";

/**
 * Up to 600px the setup guide shows only the next step until the seller opens
 * the rest. The steps always render, once, on the server: `data-open` here only
 * drives the CSS on them (`group-data-open/setup`). `contents` lets the guide's
 * own grid keep laying out the children.
 */
export function SetupStepsToggle({
  stepsId,
  total,
  collapsible,
  children,
}: {
  stepsId: string;
  total: number;
  /** False when no step is open, so there is nothing to collapse to. */
  collapsible: boolean;
  children: React.ReactNode;
}) {
  const t = useTranslations("home.setup");
  const [open, setOpen] = useState(false);

  return (
    <div data-open={open || undefined} className="group/setup contents">
      {children}
      {collapsible && (
        <button
          type="button"
          aria-expanded={open}
          aria-controls={stepsId}
          onClick={() => setOpen((value) => !value)}
          className="relative flex h-10 w-full cursor-pointer items-center justify-center gap-1.5 rounded-full border border-white/20 text-[13px] font-bold text-white transition-colors duration-150 hover:bg-white/8 min-[601px]:hidden"
        >
          {open ? t("showLess") : t("showAll", { count: total })}
          <ChevronDown
            aria-hidden
            className={cn("size-4 transition-transform duration-150 motion-reduce:transition-none", open && "rotate-180")}
          />
        </button>
      )}
    </div>
  );
}
