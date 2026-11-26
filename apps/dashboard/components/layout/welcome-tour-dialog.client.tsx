"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import {
  ArrowLeft,
  ArrowRight,
  Banknote,
  CreditCard,
  LayoutTemplate,
  ReceiptText,
  ShieldCheck,
  Wallet,
  WalletCards,
  type LucideIcon,
} from "lucide-react";
import { Link } from "@/i18n/navigation";
import { Tag } from "@/components/seller-ui";
import { Button } from "@workspace/ui/components/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogTitle,
} from "@workspace/ui/components/dialog";
import { cn } from "@workspace/ui/lib/utils";
import { storeProductsHref } from "@/lib/products/product-routes.lib";
import { aiEditorHref, manualEditorHref } from "@/app/[locale]/(builder)/stores/[storeId]/editor/editor-entry.lib";
import {
  WELCOME_TOUR_STEPS,
  welcomeTourStorageKey,
  type WelcomeTourStep,
} from "./welcome-tour.lib";

export type WelcomeTourProps = {
  /** Server rule: a new seller (welcome-tour.lib) and no other shell pop-up is due. */
  show: boolean;
  userId: string;
  /** The sidebar's selected store, for the tiles' links. None yet: the store tiles are not links. */
  storeId: string | null;
  /** Add with AI is offered on the add-product page (an AI provider is configured). */
  productAi: boolean;
  /** Edit with AI is offered in the website editor (editorAiEnabled). */
  editorAi: boolean;
  /** The `tallaby_pay_live` switch: off, the Tallaby Pay tile says "Soon", as the payments page does. */
  tallabyPayLive: boolean;
  /** Free pays a small fee per order from the wallet; Pro pays its monthly price from it. */
  plan: "free" | "pro";
};

type Tile = {
  key: string;
  title: string;
  body: string;
  image?: string;
  icon?: LucideIcon;
  href?: string;
  badge?: string;
};

const STEP_IMAGE: Record<WelcomeTourStep, string | null> = {
  products: "/illustrations/onboarding/setup-product.png",
  website: "/illustrations/onboarding/setup-design.png",
  payments: "/illustrations/onboarding/setup-payments.png",
  wallet: null,
};

const OPEN_DELAY_MS = 400;

const TILE =
  "flex h-full w-full items-center gap-3 rounded-2xl border border-(--s-line) bg-(--s-surface) p-3 text-start transition-colors";
const TILE_LINK =
  "cursor-pointer hover:border-(--s-primary) focus-visible:outline-[3px] focus-visible:outline-offset-2 focus-visible:outline-(--s-focus)";

/**
 * A short welcome tour for new sellers (ROADMAP.md F-114): the four areas that
 * matter first, one step per screen. Opens by itself once per user per browser
 * (localStorage, marked seen the moment it opens), on the first dashboard page
 * a new seller sees, and only when the server says no other shell pop-up is due.
 */
export function WelcomeTourDialog({ show, userId, storeId, productAi, editorAi, tallabyPayLive, plan }: WelcomeTourProps) {
  const t = useTranslations("welcomeTour");
  const [open, setOpen] = useState(false);
  const [index, setIndex] = useState(0);
  // Decided once per page load: with storage blocked it would otherwise open again on every page change.
  const handled = useRef(false);
  const nextRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!show) return;
    // A short beat so the page paints first; decided inside the timer, so a cleared one decides nothing.
    const timer = window.setTimeout(() => {
      if (handled.current) return;
      handled.current = true;
      const key = welcomeTourStorageKey(userId);
      try {
        if (window.localStorage.getItem(key)) return;
        // Seen as soon as it opens: a reload or a closed tab never shows it again.
        window.localStorage.setItem(key, new Date().toISOString());
      } catch {
        // Storage blocked: still show it, just not remembered.
      }
      setOpen(true);
    }, OPEN_DELAY_MS);
    return () => window.clearTimeout(timer);
  }, [show, userId]);

  if (!show) return null;

  const close = () => setOpen(false);
  const step = WELCOME_TOUR_STEPS[index]!;
  const last = index === WELCOME_TOUR_STEPS.length - 1;
  const storeHref = (sub: string) => (storeId ? `/stores/${encodeURIComponent(storeId)}${sub}` : undefined);
  const productHref = (sub: string) => (storeId ? storeProductsHref(storeId, sub) : undefined);

  const tiles: Record<WelcomeTourStep, Tile[]> = {
    products: [
      ...(productAi
        ? [{ key: "ai", image: "/illustrations/features/add-ai.png", href: productHref("/add?method=ai") }]
        : []),
      { key: "url", image: "/illustrations/features/add-url.png", href: productHref("/add?method=url") },
      { key: "file", image: "/illustrations/features/add-file.png", href: productHref("/add/from-file") },
      { key: "manual", image: "/illustrations/features/add-manual.png", href: productHref("/add?method=manual") },
    ].map((tile) => ({ ...tile, title: t(`products.tiles.${tile.key}.title`), body: t(`products.tiles.${tile.key}.body`) })),
    website: [
      { key: "theme", icon: LayoutTemplate, href: storeHref("/website/templates") },
      ...(editorAi
        ? [{ key: "ai", image: "/illustrations/features/add-ai.png", href: storeId ? aiEditorHref(storeId) : undefined }]
        : []),
      { key: "dnd", image: "/illustrations/onboarding/setup-design.png", href: storeId ? manualEditorHref(storeId) : undefined },
    ].map((tile) => ({ ...tile, title: t(`website.tiles.${tile.key}.title`), body: t(`website.tiles.${tile.key}.body`) })),
    payments: [
      { key: "cod", icon: Banknote },
      { key: "gateway", icon: CreditCard },
      { key: "tallabyPay", icon: WalletCards, badge: tallabyPayLive ? undefined : t("soon") },
    ].map((tile) => ({
      ...tile,
      href: storeHref("/settings/payments"),
      title: t(`payments.tiles.${tile.key}.title`),
      body: t(`payments.tiles.${tile.key}.body`),
    })),
    wallet: [
      { key: "fee", icon: ReceiptText, body: t(plan === "free" ? "wallet.tiles.fee.bodyFree" : "wallet.tiles.fee.bodyPro") },
      { key: "topUp", icon: Wallet, href: "/wallet", body: t("wallet.tiles.topUp.body") },
      { key: "online", icon: ShieldCheck, body: t("wallet.tiles.online.body") },
    ].map((tile) => ({ ...tile, title: t(`wallet.tiles.${tile.key}.title`) })),
  };

  const stepTiles = tiles[step];
  const image = STEP_IMAGE[step];

  return (
    <Dialog open={open} onOpenChange={(next) => !next && close()}>
      <DialogContent
        closeLabel={t("skip")}
        className="gap-0 overflow-hidden p-0 sm:max-w-lg"
        onOpenAutoFocus={(event) => {
          event.preventDefault();
          nextRef.current?.focus();
        }}
      >
        <div
          key={step}
          className="motion-safe:animate-in motion-safe:fade-in motion-safe:duration-300"
        >
          <div className="flex items-center justify-center bg-primary-soft px-5 pt-6 pb-4">
            {image ? (
              <Image src={image} alt="" aria-hidden width={96} height={96} priority className="size-20 select-none sm:size-24" />
            ) : (
              <span className="flex size-20 items-center justify-center rounded-full bg-(--s-surface) text-primary-ink shadow-(--s-shadow-card) sm:size-24">
                <Wallet className="size-9 sm:size-10" aria-hidden />
              </span>
            )}
          </div>

          <div className="space-y-4 px-5 pt-4 pb-2">
            <div className="space-y-1.5 text-center">
              <p className="text-xs font-semibold text-(--s-muted)">
                {t("progress", { current: index + 1, total: WELCOME_TOUR_STEPS.length })}
              </p>
              <DialogTitle className="text-lg leading-normal font-bold text-balance text-(--s-ink)">
                {t(`${step}.title`)}
              </DialogTitle>
              <DialogDescription className="text-[13.5px] text-pretty text-(--s-muted)">
                {t(`${step}.body`)}
              </DialogDescription>
            </div>

            <ul
              aria-label={t(`${step}.title`)}
              className={cn("grid grid-cols-1 gap-2", stepTiles.length % 2 === 0 && "sm:grid-cols-2")}
            >
              {stepTiles.map((tile) => (
                <li key={tile.key}>
                  {tile.href ? (
                    <Link href={tile.href} onClick={close} className={cn(TILE, TILE_LINK)}>
                      <TileBody tile={tile} />
                    </Link>
                  ) : (
                    <div className={TILE}>
                      <TileBody tile={tile} />
                    </div>
                  )}
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="flex justify-center gap-1.5 pt-2" aria-hidden>
          {WELCOME_TOUR_STEPS.map((key, i) => (
            <span
              key={key}
              className={cn(
                "h-1.5 rounded-full transition-[width,background-color] motion-reduce:transition-none",
                i === index ? "w-5 bg-primary" : "w-1.5 bg-(--s-line)",
              )}
            />
          ))}
        </div>

        <DialogFooter className="flex-row items-center justify-between gap-2 px-5 pt-3 pb-5 sm:justify-between">
          <Button type="button" variant="ghost" onClick={close} className="text-(--s-muted)">
            {t("skip")}
          </Button>
          <div className="flex items-center gap-2">
            {index > 0 && (
              <Button type="button" variant="neutral" onClick={() => setIndex((i) => Math.max(0, i - 1))}>
                <ArrowLeft className="rtl:rotate-180" aria-hidden />
                {t("back")}
              </Button>
            )}
            <Button
              ref={nextRef}
              type="button"
              onClick={() => (last ? close() : setIndex((i) => Math.min(WELCOME_TOUR_STEPS.length - 1, i + 1)))}
            >
              {last ? t("start") : t("next")}
              {!last && <ArrowRight className="rtl:rotate-180" aria-hidden />}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function TileBody({ tile }: { tile: Tile }) {
  const Icon = tile.icon;
  return (
    <>
      {tile.image ? (
        // Decorative (docs/dashboard-photos.md §4): the title carries the meaning.
        <Image src={tile.image} alt="" aria-hidden width={40} height={40} className="size-10 shrink-0 select-none" />
      ) : Icon ? (
        <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary-soft text-primary-ink">
          <Icon className="size-5" aria-hidden />
        </span>
      ) : null}
      <span className="min-w-0 flex-1">
        <span className="flex flex-wrap items-center gap-1.5">
          <b className="text-[13.5px] font-bold text-(--s-ink)">{tile.title}</b>
          {tile.badge && <Tag tone="warning">{tile.badge}</Tag>}
        </span>
        <span className="mt-0.5 block text-xs leading-relaxed text-(--s-muted)">{tile.body}</span>
      </span>
    </>
  );
}
