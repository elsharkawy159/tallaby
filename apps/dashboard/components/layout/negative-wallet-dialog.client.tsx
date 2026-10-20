"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { AlertTriangle } from "lucide-react";
import { Button } from "@workspace/ui/components/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@workspace/ui/components/dialog";
import { formatMoney } from "@/lib/i18n/format";

/** Per browser session: closing the pop-up hides it until the next session. */
const DISMISSED_KEY = "tallaby:negative-wallet-dialog";

/**
 * Opens by itself when the store wallet is below zero (platform fees keep
 * being taken from a zero or negative balance, PLAN.md §13.4). Shown once per
 * session and never on /wallet, where the balance and top-up are on screen.
 */
export function NegativeWalletDialog({ balance }: { balance: number | null }) {
  const t = useTranslations("negativeWalletDialog");
  const locale = useLocale();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const negative = balance != null && balance < 0;
  const onWalletPage = pathname === "/wallet" || pathname.startsWith("/wallet/");

  useEffect(() => {
    if (!negative || onWalletPage) return;
    try {
      if (window.sessionStorage.getItem(DISMISSED_KEY)) return;
    } catch {
      // Storage blocked: still show it, just not remembered.
    }
    setOpen(true);
  }, [negative, onWalletPage]);

  const onOpenChange = (next: boolean) => {
    setOpen(next);
    if (next) return;
    try {
      window.sessionStorage.setItem(DISMISSED_KEY, "1");
    } catch {
      // Storage blocked: it may show again on the next page load.
    }
  };

  if (!negative) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader className="items-center text-center sm:text-center">
          <span className="flex size-12 items-center justify-center rounded-full bg-destructive-soft text-destructive">
            <AlertTriangle className="size-6" aria-hidden />
          </span>
          <DialogTitle>{t("title")}</DialogTitle>
          <DialogDescription>{t("description")}</DialogDescription>
        </DialogHeader>
        <p className="text-center text-sm text-muted-foreground">
          {t("balanceLabel")}{" "}
          <bdi dir="ltr" className="text-lg font-bold tabular-nums text-destructive">
            {formatMoney(balance ?? 0, locale)}
          </bdi>
        </p>
        <DialogFooter className="gap-2 sm:justify-center">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            {t("later")}
          </Button>
          <Button asChild variant="accent">
            <Link href="/wallet?topup=1" onClick={() => onOpenChange(false)}>
              {t("topUp")}
            </Link>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
