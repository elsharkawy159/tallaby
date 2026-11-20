import { getEmailMessages, interpolate } from "./i18n/index.js";
import type { EmailLocale } from "./i18n/locale.js";
import { PLATFORM_BRAND } from "./kit/brand.js";
import {
  BigAmount,
  Block,
  CodeBox,
  Cta,
  emailFrame,
  EmailShell,
  Eyebrow,
  FooterLines,
  H1,
  Lead,
  MailLink,
  Strong,
  Text,
} from "./kit/components.js";
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
  const f = emailFrame(PLATFORM_BRAND, locale);
  const messages = getEmailMessages(locale);
  const copy = messages.welcome;
  const benefits = [copy.benefitShipping, copy.benefitReturns, copy.benefitSecure];

  return (
    <EmailShell
      f={f}
      audience="customer"
      title={copy.subject}
      preview={copy.preview}
      footer={
        <FooterLines
          f={f}
          lead={
            <>
              {messages.common.contactPrefix} <MailLink f={f} email={f.brand.supportEmail} />
            </>
          }
        />
      }
    >
      <Block f={f} padding="36px 32px 8px">
        <H1 f={f} flush>
          {copy.heroHeading}
        </H1>
        <Lead f={f}>{copy.heroSubheading}</Lead>
        <Text f={f} pad={20}>
          <Strong>{interpolate(copy.greeting, { name: customerName })}</Strong>
        </Text>
        <Text f={f} pad={8}>
          {copy.body1}
        </Text>
        <Text f={f} pad={8}>
          {copy.body2}
        </Text>
      </Block>
      <Block f={f} divider padding="20px 32px 0">
        <Eyebrow f={f}>{copy.offerLabel}</Eyebrow>
        <BigAmount f={f}>{discountPercent}%</BigAmount>
        <Text f={f} muted>
          {copy.offerDescription}
        </Text>
        <Text f={f} pad={16}>
          {copy.useCode}
        </Text>
        <CodeBox f={f}>{discountCode}</CodeBox>
        <Cta f={f} href={EMAIL_SITE_URL} label={copy.shopNow} />
      </Block>
      <Block f={f} divider last padding="20px 32px 28px">
        <table role="presentation" cellPadding={0} cellSpacing={0} border={0} width="100%" dir={f.dir}>
          <tbody>
            <tr>
              {benefits.map((label) => (
                <td
                  key={label}
                  className="col"
                  width="33%"
                  align="center"
                  style={{
                    padding: "4px 6px",
                    textAlign: "center",
                    fontFamily: f.font,
                    fontSize: 14,
                    lineHeight: "22px",
                    fontWeight: 600,
                    color: f.brand.primary,
                  }}
                >
                  {label}
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </Block>
    </EmailShell>
  );
};

export default WelcomeEmail;
