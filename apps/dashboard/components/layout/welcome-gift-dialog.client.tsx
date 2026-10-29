"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { Wallet } from "lucide-react";
import { Button } from "@workspace/ui/components/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogTitle,
} from "@workspace/ui/components/dialog";
import { WELCOME_GIFT_IMAGE } from "@workspace/lib/store-wallet";
import type { WelcomeGiftWatch } from "@workspace/lib/store-wallet/server";
import { Confetti } from "@/app/(main)/_components/publish-celebration.client";
import { formatDate, formatMoney } from "@/lib/i18n/format";
import { WELCOME_GIFT_CHECK_EVENT } from "./welcome-gift.lib";
import { checkWelcomeGiftAction, dismissWelcomeGiftAction } from "./welcome-gift.server";

type Gift = { amount: string; expiresAt: string };

/**
 * "مبروك! 100 جنيه في محفظة طلبي" (0119): shown once, when a new seller's
 * welcome gift is granted. While the seller is still setting up ("pending"),
 * it checks again on every page change and when a page asks (after Publish),
 * which is also what grants the gift once setup is done.
 */
export function WelcomeGiftDialog({ initial }: { initial: WelcomeGiftWatch }) {
  const t = useTranslations("welcomeGift");
  const locale = useLocale();
  const pathname = usePathname();
  const [state, setState] = useState<WelcomeGiftWatch["state"]>(initial.state);
  const [gift, setGift] = useState<Gift | null>(
    initial.state === "unseen" ? { amount: initial.amount, expiresAt: initial.expiresAt } : null,
  );
  const checking = useRef(false);

  const check = useCallback(async () => {
    if (checking.current) return;
    checking.current = true;
    try {
      const next = await checkWelcomeGiftAction();
      setState(next.state);
      if (next.state === "unseen") setGift({ amount: next.amount, expiresAt: next.expiresAt });
    } finally {
      checking.current = false;
    }
  }, []);

  // Still setting up: look again on each page change.
  useEffect(() => {
    if (state === "pending") void check();
  }, [state, pathname, check]);

  // A page that just published asks for a check at once.
  useEffect(() => {
    if (state !== "pending") return;
    const onCheck = () => void check();
    window.addEventListener(WELCOME_GIFT_CHECK_EVENT, onCheck);
    return () => window.removeEventListener(WELCOME_GIFT_CHECK_EVENT, onCheck);
  }, [state, check]);

  const open = state === "unseen" && gift !== null;

  const close = () => {
    setState("none");
    void dismissWelcomeGiftAction();
  };

  return (
    <>
      {open && <Confetti />}
      <Dialog open={open} onOpenChange={(next) => !next && close()}>
        <DialogContent className="max-w-[calc(100%-2rem)] overflow-hidden p-0 sm:max-w-md">
          <Image
            src={WELCOME_GIFT_IMAGE}
            alt={t("imageAlt", { amount: gift ? formatMoney(Number(gift.amount), locale) : "" })}
            width={600}
            height={600}
            priority
            className="h-auto w-full"
          />
          <div className="space-y-3 px-5 pb-5">
            {/* The image carries the Arabic message; this text is for English and screen readers. */}
            <DialogTitle className={locale === "ar" ? "sr-only" : "text-center text-lg"}>
              {t("title", { amount: gift ? formatMoney(Number(gift.amount), locale) : "" })}
            </DialogTitle>
            <DialogDescription className="text-center text-pretty">
              {gift ? t("body", { date: formatDate(gift.expiresAt, locale) }) : null}
            </DialogDescription>
            <DialogFooter className="gap-2 sm:justify-center">
              <Button type="button" variant="neutral" onClick={close}>
                {t("close")}
              </Button>
              <Button asChild onClick={close}>
                <Link href="/wallet">
                  <Wallet aria-hidden />
                  {t("goToWallet")}
                </Link>
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
