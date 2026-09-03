import {
  Button,
  Column,
  Row,
  Section,
  Text,
} from "@react-email/components";
import { getEmailMessages, interpolate } from "./i18n/index.js";
import type { EmailLocale } from "./i18n/locale.js";
import { EmailLayout } from "./layout/email-layout.js";
import { EMAIL_SITE_URL } from "./theme/tokens.js";

export interface WelcomeEmailProps {
  customerName?: string;
  discountCode?: string;
  discountPercent?: number;
  locale?: EmailLocale;
}

export const WelcomeEmail = ({
  customerName = "Friend",
  discountCode = "WELCOME10",
  discountPercent = 10,
  locale = "en",
}: WelcomeEmailProps) => {
  const copy = getEmailMessages(locale).welcome;

  return (
    <EmailLayout
      locale={locale}
      preview={copy.preview}
      showContactLine={true}
    >
      <Section className="email-pad mt-4 px-4">
        <Section className="w-full rounded-[10px] bg-muted px-6 py-8 text-center">
          <Text className="m-0 mb-3 text-[26px] font-bold leading-8 text-foreground">
            {copy.heroHeading}
          </Text>
          <Text className="m-0 text-[16px] text-secondary">{copy.heroSubheading}</Text>
        </Section>
      </Section>

      <Section className="email-pad px-6 pt-8">
        <Text className="m-0 mb-4 text-[20px] font-semibold text-foreground">
          {interpolate(copy.greeting, { name: customerName })}
        </Text>
        <Text className="m-0 mb-4 text-[16px] leading-[1.6] text-[#555555]">
          {copy.body1}
        </Text>
        <Text className="m-0 mb-0 text-[16px] leading-[1.6] text-[#555555]">
          {copy.body2}
        </Text>
      </Section>

      <Section className="email-pad px-4 py-6">
        <Section className="rounded-[10px] border-2 border-solid border-border bg-muted px-6 py-8 text-center">
          <Text className="m-0 mb-3 text-[12px] font-bold uppercase tracking-[1px] text-secondary">
            {copy.offerLabel}
          </Text>
          <Text className="m-0 text-[48px] font-bold leading-[1.2] text-accent">
            {discountPercent}%
          </Text>
          <Text className="mb-5 mt-2 text-[14px] text-secondary">
            {copy.offerDescription}
          </Text>
          <Text className="m-0 rounded-md bg-card px-3 py-3 font-mono text-[14px] text-foreground">
            {copy.useCode} <strong>{discountCode}</strong>
          </Text>
        </Section>
      </Section>

      <Section className="email-pad px-6 pb-2">
        <Button
          className="cta-btn box-border block w-full rounded-md bg-primary py-3 text-center text-[16px] font-semibold text-primary-foreground no-underline"
          href={EMAIL_SITE_URL}
        >
          {copy.shopNow}
        </Button>
      </Section>

      <Section className="email-pad px-6 py-6 text-center">
        <Row>
          <Column>
            <Text className="m-0 mb-1 text-[32px]">🚚</Text>
            <Text className="m-0 text-[14px] font-semibold text-foreground">
              {copy.benefitShipping}
            </Text>
          </Column>
          <Column>
            <Text className="m-0 mb-1 text-[32px]">↩️</Text>
            <Text className="m-0 text-[14px] font-semibold text-foreground">
              {copy.benefitReturns}
            </Text>
          </Column>
          <Column>
            <Text className="m-0 mb-1 text-[32px]">🔒</Text>
            <Text className="m-0 text-[14px] font-semibold text-foreground">
              {copy.benefitSecure}
            </Text>
          </Column>
        </Row>
      </Section>
    </EmailLayout>
  );
};

export default WelcomeEmail;
