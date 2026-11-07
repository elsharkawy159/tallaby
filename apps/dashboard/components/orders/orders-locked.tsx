import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { Clock, Wallet } from "lucide-react";
import type { OrderLock } from "@workspace/lib/billing/order-lock";
import { Button } from "@workspace/ui/components/button";
import { getMinTopUpEgp } from "@/lib/billing/min-top-up-egp.server";

const PLACEHOLDER_ROWS = ["w-3/4", "w-2/3", "w-4/5", "w-1/2", "w-3/5", "w-2/3"];

/**
 * What a seller who isn't activated sees in Orders (ROADMAP.md F-68). The
 * blurred rows are placeholders: no order data is loaded or sent to the browser.
 */
/** The title says what $5 is in EGP, so the seller doesn't think they must pay in dollars. */
async function lockTitle(lock: OrderLock) {
  const [t, egp] = await Promise.all([getTranslations("orderLock"), getMinTopUpEgp()]);
  return lock.pendingReview ? t("reviewTitle") : t("title", { egp: egp == null ? "none" : String(egp) });
}

export async function OrdersLocked({ lock }: { lock: OrderLock }) {
  const [t, title] = await Promise.all([getTranslations("orderLock"), lockTitle(lock)]);
  const Icon = lock.pendingReview ? Clock : Wallet;
  return (
    <div className="relative min-h-[70vh] overflow-hidden p-4 sm:p-6">
      <div aria-hidden className="space-y-3 blur-sm select-none">
        {PLACEHOLDER_ROWS.map((width, index) => (
          <div key={index} className="flex items-center gap-4 rounded-xl border bg-card p-4">
            <div className="size-10 shrink-0 rounded-lg bg-muted" />
            <div className="min-w-0 flex-1 space-y-2">
              <div className={`h-3 rounded bg-muted ${width}`} />
              <div className="h-3 w-1/3 rounded bg-muted/70" />
            </div>
            <div className="h-6 w-16 shrink-0 rounded-full bg-muted" />
          </div>
        ))}
      </div>
      <div className="absolute inset-0 flex items-center justify-center p-4">
        <div className="w-full max-w-md rounded-2xl border bg-card p-6 text-center shadow-lg">
          <Icon className="mx-auto mb-3 size-8 text-primary" aria-hidden />
          <h1 className="text-lg font-bold">{title}</h1>
          <p className="mt-2 text-pretty text-sm text-muted-foreground">{t(lock.pendingReview ? "reviewBody" : "body")}</p>
          <Button asChild className="mt-4 max-[600px]:h-10">
            <Link href="/wallet">{t(lock.pendingReview ? "viewWallet" : "topUp")}</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}

/** The short message on the dashboard home. */
export async function OrdersLockedNotice({ lock }: { lock: OrderLock }) {
  if (!lock.locked) return null;
  const [t, title] = await Promise.all([getTranslations("orderLock"), lockTitle(lock)]);
  return (
    <div className="flex flex-wrap items-center gap-3 rounded-[20px] border border-(--tallaby-amber-100) bg-accent-soft px-4 py-3 text-[13.5px] text-accent-ink dark:border-transparent">
      <span aria-hidden>⚠️</span>
      <div className="min-w-0 flex-1">
        <p className="font-semibold">{title}</p>
        <p className="mt-0.5 text-pretty">{t(lock.pendingReview ? "reviewBody" : "body")}</p>
      </div>
      <Button asChild size="sm" className="max-[600px]:h-10">
        <Link href="/wallet">{t(lock.pendingReview ? "viewWallet" : "topUp")}</Link>
      </Button>
    </div>
  );
}
