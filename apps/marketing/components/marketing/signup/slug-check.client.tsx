"use client";

import * as React from "react";
import { Check, CircleAlert, Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { cn } from "@workspace/ui/lib/utils";
import { checkSubdomainAvailability } from "./subdomain.server";
import type { SubdomainAvailability } from "./subdomain.dto";

export type SlugState =
  | { kind: "idle" }
  | { kind: "checking" }
  | { kind: "local"; message: "tooShort" | "arabic" | "required" }
  | { kind: "result"; result: SubdomainAvailability };

/** Live, debounced "is this store link free?" check. Late answers for older input are dropped. */
export function useSlugCheck(slug: string, initialSlug = "") {
  const [state, setState] = React.useState<SlugState>({ kind: "idle" });
  const requestId = React.useRef(0);

  const run = React.useCallback((value: string) => {
    const id = ++requestId.current;
    if (!value) return setState({ kind: "idle" });
    if (value.length < 3) return setState({ kind: "local", message: "tooShort" });
    setState({ kind: "checking" });
    checkSubdomainAvailability(value)
      .then((result) => id === requestId.current && setState({ kind: "result", result }))
      .catch(() => id === requestId.current && setState({ kind: "result", result: { status: "unknown", subdomain: value, suggestions: [] } }));
  }, []);

  React.useEffect(() => {
    const timer = window.setTimeout(() => run(slug), slug === initialSlug ? 0 : 350);
    return () => window.clearTimeout(timer);
  }, [slug, initialSlug, run]);

  return [state, setState] as const;
}

const PILL = "items-center gap-[5px] rounded-full font-latin font-bold whitespace-nowrap transition-[opacity,transform,background-color,color] duration-300";

/**
 * The pill next to a hero "claim your link" field. With `demo`, it shows the
 * typing demo's "available" (no real link yet); otherwise it reflects `state`.
 * Hidden when the check couldn't run, since the signup form checks again.
 */
export function SlugBadge({ state, demo, className }: { state: SlugState; demo?: boolean; className?: string }) {
  const t = useTranslations("common");
  const ts = useTranslations("signup");

  let tone: "ok" | "bad" | "wait" | null = null;
  let label = "";
  if (demo !== undefined) {
    tone = "ok";
    label = t("available");
  } else if (state.kind === "checking") {
    tone = "wait";
    label = ts("checking");
  } else if (state.kind === "local" && state.message === "tooShort") {
    tone = "bad";
    label = ts("tooShort");
  } else if (state.kind === "result") {
    const { status } = state.result;
    if (status === "available") {
      tone = "ok";
      label = t("available");
    } else if (status !== "unknown" && status !== "rateLimited") {
      tone = "bad";
      label = t("unavailable");
    }
  }

  const Icon = tone === "wait" ? Loader2 : tone === "bad" ? CircleAlert : Check;
  return (
    <span
      role="status"
      aria-live="polite"
      className={cn(
        PILL,
        tone === "ok" && "bg-success-soft text-[#166534]",
        tone === "bad" && "bg-destructive/10 text-destructive",
        tone === "wait" && "bg-neutral-100 text-neutral-600",
        (!tone || demo === false) && "scale-90 opacity-0",
        className,
      )}
    >
      <Icon className={cn("size-[13px]", tone === "wait" && "animate-spin")} aria-hidden />
      {label}
    </span>
  );
}
