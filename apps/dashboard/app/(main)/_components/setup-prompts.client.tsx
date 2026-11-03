"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Rocket, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@workspace/ui/components/button";
import { WELCOME_GIFT_CHECK_EVENT } from "@/components/layout/welcome-gift.lib";
import type { SetupKey } from "./setup-checklist.lib";
import {
  isPromptBlockedRoute,
  SETUP_PROMPT_CHECK_EVENT,
  SETUP_PROMPT_DELAY_MS,
  type SetupPrompt,
  type SetupPromptEvent,
  type SetupPromptSync,
} from "./setup-prompts.lib";

/**
 * Guided setup prompts (ROADMAP.md F-44): a one-time toast on the first visit,
 * then a slim banner for each next step. Loads after the page, so it never
 * delays it, and looks again on each page change until nothing is left.
 */
export function SetupPrompts() {
  const t = useTranslations("home.setup");
  const pathname = usePathname() ?? "";
  const router = useRouter();
  const [prompt, setPrompt] = useState<SetupPrompt | null>(null);
  const [revealed, setRevealed] = useState<SetupKey | null>(null);
  const finished = useRef(false);
  const latestRequest = useRef(0);
  const toastFired = useRef(false);

  const sync = useCallback(async (event?: SetupPromptEvent) => {
    if (finished.current && !event) return;
    const request = ++latestRequest.current;
    try {
      const response = await fetch("/api/setup-prompts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(event ? { event } : {}),
      });
      if (!response.ok) return;
      const data = (await response.json()) as SetupPromptSync;
      if (request !== latestRequest.current) return;
      finished.current = data.finished;
      setPrompt(data.prompt);
    } catch {
      // Offline or a hiccup: no prompt now, the next page change tries again.
    }
  }, []);

  useEffect(() => {
    void sync();
  }, [pathname, sync]);

  // Publishing, saving the design and hiding the guide don't change the page.
  useEffect(() => {
    const onCheck = () => void sync();
    window.addEventListener(WELCOME_GIFT_CHECK_EVENT, onCheck);
    window.addEventListener(SETUP_PROMPT_CHECK_EVENT, onCheck);
    return () => {
      window.removeEventListener(WELCOME_GIFT_CHECK_EVENT, onCheck);
      window.removeEventListener(SETUP_PROMPT_CHECK_EVENT, onCheck);
    };
  }, [sync]);

  const blocked = prompt ? isPromptBlockedRoute(pathname, prompt) : false;
  const toastKey = prompt?.kind === "toast" && !blocked ? prompt.key : null;
  const toastHref = prompt?.href ?? null;

  useEffect(() => {
    if (!toastKey || !toastHref || toastFired.current) return;
    let timer: ReturnType<typeof setTimeout>;
    const fire = () => {
      // An open dialog makes the page, this toast included, unclickable. It only shows once, so wait.
      if (document.querySelector('[role="dialog"]')) {
        timer = setTimeout(fire, SETUP_PROMPT_DELAY_MS);
        return;
      }
      toastFired.current = true;
      toast(t("prompts.toast", { step: t(`tasks.${toastKey}.title`) }), {
        position: "top-center",
        duration: 15000,
        action: { label: t("prompts.start"), onClick: () => router.push(toastHref) },
      });
      void sync({ type: "toast_shown", step: toastKey });
    };
    timer = setTimeout(fire, SETUP_PROMPT_DELAY_MS);
    return () => clearTimeout(timer);
  }, [toastKey, toastHref, t, router, sync]);

  const bannerKey = prompt?.kind === "banner" && !blocked ? prompt.key : null;

  useEffect(() => {
    if (!bannerKey || revealed === bannerKey) return;
    const timer = setTimeout(() => setRevealed(bannerKey), SETUP_PROMPT_DELAY_MS);
    return () => clearTimeout(timer);
  }, [bannerKey, revealed]);

  if (!prompt || !bannerKey || revealed !== bannerKey) return null;

  const dismiss = () => {
    setPrompt(null);
    void sync({ type: "dismissed", step: bannerKey });
  };

  return (
    <div role="status" className="flex items-center gap-2.5 border-b bg-primary/10 px-4 py-1.5 text-sm sm:px-6">
      <Rocket className="size-4 shrink-0 text-primary-ink" aria-hidden />
      <p className="min-w-0 flex-1 text-pretty">{t("prompts.banner", { step: t(`tasks.${bannerKey}.title`) })}</p>
      <Button asChild size="sm" variant="secondary" className="shrink-0 rounded-[9px]">
        <Link href={prompt.href}>{t("prompts.start")}</Link>
      </Button>
      <button
        type="button"
        onClick={dismiss}
        aria-label={t("prompts.dismiss")}
        className="flex size-8 shrink-0 items-center justify-center rounded-[10px] text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
      >
        <X className="size-4" aria-hidden />
      </button>
    </div>
  );
}
