import { getEmailMessages, interpolate } from "./i18n/index.js";
import type { EmailLocale } from "./i18n/locale.js";
import { emailDateLocale } from "./i18n/locale.js";
import { PLATFORM_BRAND } from "./kit/brand.js";
import { Block, Callout, Cta, emailFrame, EmailShell, H1, Lead, SellerFooter } from "./kit/components.js";

export type FeeTrialReminderStage = "t7" | "t1";

export interface FeeTrialReminderEmailProps {
  sellerName?: string;
  stage?: FeeTrialReminderStage;
  /** ISO date-time the trial ends. */
  endsAt?: string;
  dashboardUrl?: string;
  locale?: EmailLocale;
  /** After the USD switch (0136): the fee line names the new fee. */
  usdLive?: boolean;
  /**
   * After the switch: the order fee in EGP at the live rate, already formatted
   * (`formatEgpApprox(FREE_ORDER_FEE_USD_CENTS, rate, locale)` from @workspace/lib/billing).
   * Without it the fee line names no amount, never a dollar price (owner, 2026-11-09).
   */
  orderFeeEgp?: string;
}

/** Seller reminder 7 days and 1 day before the fee trial ends (PLAN.md §13.5, P6-07). */
export const FeeTrialReminderEmail = ({
  sellerName = "there",
  stage = "t7",
  endsAt = new Date().toISOString(),
  dashboardUrl = "https://dashboard.tallaby.com/",
  locale = "en",
  usdLive = false,
  orderFeeEgp,
}: FeeTrialReminderEmailProps) => {
  const f = emailFrame(PLATFORM_BRAND, locale);
  const copy = getEmailMessages(locale).feeTrialReminder;
  const date = new Date(endsAt).toLocaleDateString(emailDateLocale(locale), {
    dateStyle: "long",
    timeZone: "Africa/Cairo",
  });
  const t1 = stage === "t1";
  const preview = interpolate(t1 ? copy.previewT1 : copy.previewT7, { date });
  // Same page the other seller mail links to (`<dashboard>/settings`).
  const settingsUrl = `${dashboardUrl.replace(/\/+$/, "")}/settings`;
  const feeNote = usdLive
    ? orderFeeEgp
      ? interpolate(copy.feeNoteUsd, { fee: orderFeeEgp })
      : copy.feeNoteUsdNoAmount
    : copy.feeNote;

  return (
    <EmailShell
      f={f}
      audience="seller"
      title={preview}
      preview={preview}
      footer={<SellerFooter f={f} settingsUrl={settingsUrl} />}
    >
      <Block f={f} last padding="36px 32px 32px">
        <H1 f={f} flush>
          {interpolate(copy.greeting, { name: sellerName })}
        </H1>
        <Lead f={f}>{interpolate(t1 ? copy.bodyT1 : copy.bodyT7, { date })}</Lead>
        <Callout f={f} tone={t1 ? "warning" : "info"}>
          {feeNote}
        </Callout>
        <Cta f={f} href={dashboardUrl} label={copy.cta} />
      </Block>
    </EmailShell>
  );
};

export default FeeTrialReminderEmail;
