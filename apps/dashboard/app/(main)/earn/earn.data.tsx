import { CircleCheck, Clock, CircleX, HandCoins, Lock, MessageCircle, Unlock } from "lucide-react";
import { getLocale, getTranslations } from "next-intl/server";
import { REFERRAL_MIN_PAYOUT_PIASTRES, fromPiastres, referralShareUrl } from "@workspace/lib/referrals";
import { getReferralOverview, type ReferralPayoutView } from "@workspace/lib/referrals/server";
import { Badge } from "@workspace/ui/components/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@workspace/ui/components/card";
import { Progress } from "@workspace/ui/components/progress";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@workspace/ui/components/table";
import { cn } from "@workspace/ui/lib/utils";
import { STOREFRONT_URL, getSupportWhatsAppUrl } from "@/lib/constants";
import { formatDate, formatMoney } from "@/lib/i18n/format";
import { ReferralLinkCard, WithdrawButton } from "./earn.client";

/**
 * Earn with us (F-37): commission totals, the share link, progress to unlock
 * withdrawals, referred sellers and withdrawals. Never cached: money data is
 * read fresh on every request (CLAUDE.md rule 8).
 */
export async function EarnSection({ sellerId }: { sellerId: string }) {
  const [t, locale, overview] = await Promise.all([getTranslations("earn"), getLocale(), getReferralOverview(sellerId)]);
  if (!overview) return null;

  const minimum = formatMoney(fromPiastres(REFERRAL_MIN_PAYOUT_PIASTRES), locale);
  const shareUrl = referralShareUrl(overview.code, STOREFRONT_URL);
  const percent = (count: number, goal: number) => Math.min(100, Math.round((count / goal) * 100));

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <header className="space-y-2">
        <h1 className="flex items-center gap-2 text-2xl font-semibold">
          <HandCoins className="size-6 text-primary" aria-hidden />
          {t("title")}
        </h1>
        <p className="max-w-3xl text-sm text-muted-foreground">{t("intro")}</p>
      </header>

      <div className="grid gap-4 sm:grid-cols-3">
        {(
          [
            ["earned", overview.earned],
            ["available", overview.available],
            ["paid", overview.paid],
          ] as const
        ).map(([key, value]) => (
          <Card key={key} className={cn(key === "available" && "border-primary/40 bg-primary/5")}>
            <CardHeader className="pb-1">
              <CardTitle className="text-sm font-medium text-muted-foreground">{t(`stats.${key}`)}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-semibold tabular-nums">{formatMoney(value, locale)}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <ReferralLinkCard url={shareUrl} code={overview.code} />

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              {overview.unlocked ? <Unlock className="size-4 text-primary" aria-hidden /> : <Lock className="size-4" aria-hidden />}
              {overview.unlocked ? t("progress.unlocked") : t("progress.title")}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {(
              [
                ["referrals", overview.counts.successfulReferrals, overview.goals.referrals],
                ["stores", overview.counts.stores, overview.goals.stores],
              ] as const
            ).map(([key, count, goal]) => (
              <div key={key} className="space-y-1.5">
                <p className="text-sm font-medium tabular-nums">{t(`progress.${key}`, { count, goal })}</p>
                <Progress value={percent(count, goal)} />
              </div>
            ))}
            <p className="text-xs text-muted-foreground">{t("progress.rule")}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t("withdraw.title")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground">{t("withdraw.minimum", { amount: minimum })}</p>
            {overview.blockReason && (
              <p className="rounded-md bg-muted p-3 text-sm">
                {t(`withdraw.blocked.${overview.blockReason}`, { amount: minimum })}
              </p>
            )}
            <div className="flex flex-wrap gap-2">
              <WithdrawButton
                disabled={overview.blockReason !== null}
                amountLabel={formatMoney(overview.available, locale)}
              />
              <a
                href={getSupportWhatsAppUrl(t("withdraw.supportMessage"))}
                target="_blank"
                rel="noreferrer"
                className="inline-flex h-9 items-center gap-2 rounded-md border px-3 text-sm hover:bg-muted"
              >
                <MessageCircle className="size-4" aria-hidden />
                {t("withdraw.support")}
              </a>
            </div>
            {overview.payouts.length > 0 && (
              <div className="space-y-2 pt-2">
                <p className="text-sm font-medium">{t("payouts.title")}</p>
                <ul className="space-y-2">
                  {overview.payouts.map((p) => (
                    <PayoutRow key={p.id} payout={p} locale={locale} t={t} />
                  ))}
                </ul>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t("referrals.title")}</CardTitle>
        </CardHeader>
        <CardContent>
          {overview.referrals.length === 0 ? (
            <p className="text-sm text-muted-foreground">{t("referrals.empty")}</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t("referrals.store")}</TableHead>
                    <TableHead>{t("referrals.signedUp")}</TableHead>
                    <TableHead className="text-end">{t("referrals.stores")}</TableHead>
                    <TableHead className="text-end">{t("referrals.toppedUp")}</TableHead>
                    <TableHead className="text-end">{t("referrals.commission")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {overview.referrals.map((r, i) => (
                    <TableRow key={i}>
                      <TableCell className="font-medium">{r.storeName ?? t("referrals.unnamed")}</TableCell>
                      <TableCell>{r.signedUpAt ? formatDate(r.signedUpAt, locale) : "—"}</TableCell>
                      <TableCell className="text-end tabular-nums">{r.stores}</TableCell>
                      <TableCell className="text-end tabular-nums">{formatMoney(r.toppedUp, locale)}</TableCell>
                      <TableCell className="text-end font-medium tabular-nums">{formatMoney(r.commission, locale)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

const STATUS_ICON = { requested: Clock, paid: CircleCheck, rejected: CircleX } as const;

function PayoutRow({
  payout,
  locale,
  t,
}: {
  payout: ReferralPayoutView;
  locale: string;
  t: Awaited<ReturnType<typeof getTranslations<"earn">>>;
}) {
  const Icon = STATUS_ICON[payout.status];
  return (
    <li className="flex flex-wrap items-center justify-between gap-2 rounded-md border p-2 text-sm">
      <span className="flex items-center gap-2">
        <Icon className="size-4 text-muted-foreground" aria-hidden />
        <span className="font-medium tabular-nums">{formatMoney(payout.amount, locale)}</span>
        <span className="text-muted-foreground">{payout.destination}</span>
      </span>
      <span className="flex items-center gap-2 text-xs text-muted-foreground">
        {formatDate(payout.createdAt, locale)}
        <Badge variant={payout.status === "paid" ? "default" : payout.status === "rejected" ? "destructive" : "secondary"}>
          {t(`payouts.status.${payout.status}`)}
        </Badge>
      </span>
      {payout.status === "paid" && payout.reference && (
        <span className="w-full text-xs text-muted-foreground">{t("payouts.reference", { reference: payout.reference })}</span>
      )}
      {payout.status === "rejected" && payout.rejectionReason && (
        <span className="w-full text-xs text-muted-foreground">{t("payouts.reason", { reason: payout.rejectionReason })}</span>
      )}
    </li>
  );
}
