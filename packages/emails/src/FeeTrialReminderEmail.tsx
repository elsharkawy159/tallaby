import { Button, Section, Text } from "@react-email/components";
import { getEmailMessages, interpolate } from "./i18n/index.js";
import type { EmailLocale } from "./i18n/locale.js";
import { emailDateLocale } from "./i18n/locale.js";
import { EmailLayout } from "./layout/email-layout.js";

export type FeeTrialReminderStage = "t7" | "t1";

export interface FeeTrialReminderEmailProps {
  sellerName?: string;
  stage?: FeeTrialReminderStage;
  /** ISO date-time the trial ends. */
  endsAt?: string;
  dashboardUrl?: string;
  locale?: EmailLocale;
}

/** Seller reminder 7 days and 1 day before the fee trial ends (PLAN.md §13.5, P6-07). */
export const FeeTrialReminderEmail = ({
  sellerName = "there",
  stage = "t7",
  endsAt = new Date().toISOString(),
  dashboardUrl = "https://dashboard.tallaby.com/",
  locale = "en",
}: FeeTrialReminderEmailProps) => {
  const copy = getEmailMessages(locale).feeTrialReminder;
  const date = new Date(endsAt).toLocaleDateString(emailDateLocale(locale), {
    dateStyle: "long",
    timeZone: "Africa/Cairo",
  });
  const t1 = stage === "t1";

  return (
    <EmailLayout
      locale={locale}
      preview={interpolate(t1 ? copy.previewT1 : copy.previewT7, { date })}
      showContactLine={true}
    >
      <Section className="email-pad px-6 pt-7">
        <Text className="m-0 mb-4 text-[20px] font-semibold text-foreground">
          {interpolate(copy.greeting, { name: sellerName })}
        </Text>
        <Text className="m-0 mb-4 text-[16px] leading-[1.6] text-[#555555]">
          {interpolate(t1 ? copy.bodyT1 : copy.bodyT7, { date })}
        </Text>
        <Text className="m-0 text-[14px] leading-[1.6] text-secondary">{copy.feeNote}</Text>
      </Section>

      <Section className="email-pad px-6 py-6">
        <Button
          className="cta-btn box-border block w-full rounded-md bg-primary py-3 text-center text-[16px] font-semibold text-primary-foreground no-underline"
          href={dashboardUrl}
        >
          {copy.cta}
        </Button>
      </Section>
    </EmailLayout>
  );
};

export default FeeTrialReminderEmail;
