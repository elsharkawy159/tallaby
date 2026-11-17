import { Link } from "@/i18n/navigation";
import { getLocale, getTranslations } from "next-intl/server";
import { Clock, Wallet } from "lucide-react";
import { daysUntilOffline, type OrderLock } from "@workspace/lib/billing/order-lock";
import { Button } from "@workspace/ui/components/button";
import { getMinTopUpText } from "@/lib/billing/min-top-up-egp.server";
import { showGraceNotice } from "@/lib/billing/grace-notice.lib";

const PLACEHOLDER_ROWS = ["w-3/4", "w-2/3", "w-4/5", "w-1/2", "w-3/5", "w-2/3"];

/**
 * What a seller whose orders are locked sees in Orders (ROADMAP.md F-68, F-84:
 * not activated; from the start and with no first-order exception since owner
 * 2026-11-16). The blurred rows are placeholders: no order data is loaded or
 * sent to the browser.
 */
/** The title names the smallest top-up in EGP ("≈ 269 جنيه"), never in dollars (owner, 2026-11-09). */
async function lockTitle(lock: OrderLock) {
  const [t, amount] = await Promise.all([getTranslations("orderLock"), getLocale().then(getMinTopUpText)]);
  if (lock.pendingReview) return t("reviewTitle");
  return lock.storeOffline ? t("offlineTitle") : t("title", { amount: amount ?? "none" });
}

/**
 * The message under the title: a top-up in review, the store already offline
 * (the trial's days are over, owner 2026-11-17), the days until it goes offline
 * (the countdown), or that orders wait for a top-up.
 */
async function lockBody(lock: OrderLock) {
  const [t, amount] = await Promise.all([getTranslations("orderLock"), getLocale().then(getMinTopUpText)]);
  if (lock.pendingReview) return t("reviewBody");
  if (lock.storeOffline) return t("offlineBody", { amount: amount ?? "none" });
  const offlineIn = lock.grace ? daysUntilOffline(lock.grace) : 0;
  return offlineIn > 0 ? t("bodyShort", { days: offlineIn }) : t("body");
}

export async function OrdersLocked({ lock }: { lock: OrderLock }) {
  const [t, title, body] = await Promise.all([getTranslations("orderLock"), lockTitle(lock), lockBody(lock)]);
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
          <p className="mt-2 text-pretty text-sm text-muted-foreground">{body}</p>
          <Button asChild className="mt-4 max-[600px]:h-10">
            <Link href="/wallet">{t(lock.pendingReview ? "viewWallet" : "topUp")}</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}

/**
 * The amber notice row. Phones: the icon and text get the full width and the
 * button goes on its own line under them, full width; from `sm` it sits inline
 * at the end. (The old wrapping row never wrapped: its `flex-1` text column has
 * a 0 basis, so the nowrap button always fit beside it and squeezed the text
 * into a thin column on phones.)
 */
const NOTICE_ROW =
  "flex flex-col gap-3 rounded-[20px] border border-(--tallaby-amber-100) bg-accent-soft px-4 py-3 text-[13.5px] text-accent-ink sm:flex-row sm:items-center dark:border-transparent";
const NOTICE_BUTTON = "w-full max-[600px]:h-10 sm:w-auto";

/**
 * The short message on the dashboard home. While the window is open and no order
 * came, it waits for a published store with a product (`storeReady`, owner
 * 2026-11-13; showGraceNotice).
 */
export async function OrdersLockedNotice({ lock, storeReady }: { lock: OrderLock; storeReady: boolean }) {
  if (!showGraceNotice(lock, storeReady)) return null;
  const [t, title, body] = await Promise.all([getTranslations("orderLock"), lockTitle(lock), lockBody(lock)]);
  return (
    <div className={NOTICE_ROW}>
      <div className="flex min-w-0 flex-1 items-start gap-3">
        <span aria-hidden className="shrink-0 text-sm leading-5">
          ⚠️
        </span>
        <div className="min-w-0 flex-1 break-words">
          <p className="font-semibold leading-5">{title}</p>
          <p className="mt-0.5 text-pretty">{body}</p>
        </div>
      </div>
      <Button asChild size="sm" className={NOTICE_BUTTON}>
        <Link href="/wallet">{t(lock.pendingReview ? "viewWallet" : "topUp")}</Link>
      </Button>
    </div>
  );
}
