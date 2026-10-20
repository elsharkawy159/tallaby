"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Copy, ExternalLink, LoaderCircle, PartyPopper } from "lucide-react";
import { Button } from "@workspace/ui/components/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@workspace/ui/components/dialog";
import { publishStoreFromHome } from "./setup-publish.server";

type Live = { url: string; hostname: string };

/**
 * The checklist's "Publish now" button. On success it shows the live address
 * over a confetti burst; the home page refreshes only when the dialog closes,
 * so the dialog survives the checklist hiding itself once every step is done.
 */
export function SetupPublishButton({
  storeId,
  ready,
  variant,
}: {
  storeId: string;
  /** Profile, first product and legal details are done (publishReady). */
  ready: boolean;
  variant: "secondary" | "neutral";
}) {
  const t = useTranslations("home.setup.publish");
  const te = useTranslations("storeEditor");
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [live, setLive] = useState<Live | null>(null);

  const run = () =>
    startTransition(async () => {
      try {
        const result = await publishStoreFromHome(storeId);
        if (result.success) setLive({ url: result.url, hostname: result.hostname });
        else toast.error(te(`errors.${result.error}` as "errors.generic"));
      } catch {
        toast.error(te("errors.generic"));
      }
    });

  const copy = async () => {
    if (!live) return;
    try {
      await navigator.clipboard.writeText(live.url);
      toast.success(t("copied"));
    } catch {
      toast.error(t("copyFailed"));
    }
  };

  const close = (open: boolean) => {
    if (open) return;
    setLive(null);
    router.refresh();
  };

  return (
    <>
      <Button
        type="button"
        size="sm"
        variant={variant}
        className="rounded-[9px]"
        disabled={!ready || pending}
        title={ready ? undefined : t("locked")}
        onClick={run}
      >
        {pending && <LoaderCircle className="animate-spin" aria-hidden />}
        {t("cta")}
      </Button>

      {live && <Confetti />}
      <Dialog open={live !== null} onOpenChange={close}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader className="items-center text-center sm:text-center">
            <span className="mb-1 flex size-14 items-center justify-center rounded-2xl bg-accent/15 text-accent motion-safe:animate-bounce">
              <PartyPopper className="size-7" aria-hidden />
            </span>
            <DialogTitle className="text-xl">{t("successTitle")}</DialogTitle>
            <DialogDescription>{t("successBody")}</DialogDescription>
          </DialogHeader>
          {live && (
            <a
              href={live.url}
              target="_blank"
              rel="noopener noreferrer"
              dir="ltr"
              className="block truncate rounded-xl border bg-muted/50 px-4 py-3 text-center font-mono text-base font-semibold text-primary hover:underline"
            >
              {live.hostname}
            </a>
          )}
          <DialogFooter className="gap-2 sm:justify-center">
            <Button type="button" variant="neutral" onClick={copy}>
              <Copy aria-hidden />
              {t("copy")}
            </Button>
            {live && (
              <Button asChild>
                <a href={live.url} target="_blank" rel="noopener noreferrer">
                  <ExternalLink aria-hidden />
                  {t("visit")}
                </a>
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

const COLORS = ["#f59e0b", "#3b82f6", "#10b981", "#ef4444", "#8b5cf6", "#ec4899", "#facc15"];
const DURATION_MS = 3800;

/** A one-off confetti burst from both bottom corners, over the whole screen. Skipped for reduced motion. */
function Confetti() {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const dpr = window.devicePixelRatio || 1;
    const resize = () => {
      canvas.width = window.innerWidth * dpr;
      canvas.height = window.innerHeight * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    window.addEventListener("resize", resize);

    const w = window.innerWidth;
    const h = window.innerHeight;
    const pieces = Array.from({ length: 180 }, (_, i) => {
      const left = i % 2 === 0;
      const angle = ((left ? -60 : -120) + (Math.random() - 0.5) * 50) * (Math.PI / 180);
      const speed = 9 + Math.random() * 11;
      return {
        x: left ? 0 : w,
        y: h,
        vx: Math.cos(angle) * speed * (w / 1200 + 0.6),
        vy: Math.sin(angle) * speed * (h / 900 + 0.5),
        size: 6 + Math.random() * 6,
        color: COLORS[i % COLORS.length]!,
        rotation: Math.random() * Math.PI,
        spin: (Math.random() - 0.5) * 0.3,
        delay: Math.random() * 250,
      };
    });

    const start = performance.now();
    let frame = 0;
    const tick = (now: number) => {
      const elapsed = now - start;
      ctx.clearRect(0, 0, w, h);
      ctx.globalAlpha = Math.max(0, Math.min(1, (DURATION_MS - elapsed) / 800));
      for (const p of pieces) {
        if (elapsed < p.delay) continue;
        p.vy += 0.28;
        p.vx *= 0.985;
        p.vy *= 0.985;
        p.x += p.vx;
        p.y += p.vy;
        p.rotation += p.spin;
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rotation);
        ctx.fillStyle = p.color;
        ctx.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2);
        ctx.restore();
      }
      if (elapsed < DURATION_MS) frame = requestAnimationFrame(tick);
      else ctx.clearRect(0, 0, w, h);
    };
    frame = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return <canvas ref={ref} aria-hidden className="pointer-events-none fixed inset-0 z-[60] size-full" />;
}
