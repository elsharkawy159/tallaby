import { getEmailMessages, interpolate } from "./i18n/index.js";
import type { EmailLocale } from "./i18n/locale.js";
import { emailDateLocale } from "./i18n/locale.js";
import { PLATFORM_BRAND } from "./kit/brand.js";
import {
  Block,
  Callout,
  Cta,
  emailFrame,
  EmailShell,
  FooterLines,
  H1,
  InlineLink,
  Lead,
  MailLink,
  SectionTitle,
  Text,
} from "./kit/components.js";
import { EMAIL_SITE_URL } from "./theme/tokens.js";

export interface DigitalDeliveryItem {
  productName: string;
  downloadUrl: string;
  licenseKey?: string | null;
  expiresAt?: string | null;
  maxDownloads?: number | null;
}

export interface DigitalDeliveryEmailProps {
  customerName?: string;
  orderNumber?: string;
  items?: DigitalDeliveryItem[];
  locale?: EmailLocale;
}

export const DigitalDeliveryEmail = ({
  customerName = "there",
  orderNumber = "",
  items = [],
  locale = "en",
}: DigitalDeliveryEmailProps) => {
  const f = emailFrame(PLATFORM_BRAND, locale);
  const messages = getEmailMessages(locale);
  const copy = messages.digitalDelivery;
  const dateLocale = emailDateLocale(locale);

  return (
    <EmailShell
      f={f}
      audience="customer"
      title={interpolate(copy.preview, { orderNumber })}
      preview={interpolate(copy.preview, { orderNumber })}
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
          {interpolate(copy.greeting, { name: customerName })}
        </H1>
        <Lead f={f}>{interpolate(copy.body, { orderNumber })}</Lead>
      </Block>

      {items.map((item, index) => (
        <Block key={index} f={f} divider padding="20px 32px 0">
          <SectionTitle f={f}>{item.productName}</SectionTitle>
          {item.licenseKey ? (
            <Callout f={f} marginTop={14}>
              {copy.licenseKey}{" "}
              <strong dir="ltr" style={{ color: "#171717", fontFamily: "Consolas,Monaco,monospace", wordBreak: "break-all" }}>
                {item.licenseKey}
              </strong>
            </Callout>
          ) : null}
          <Cta f={f} href={item.downloadUrl} label={copy.accessDownload} />
          <Text f={f} muted size={12} center pad={10}>
            {item.maxDownloads ? `${interpolate(copy.maxDownloads, { count: item.maxDownloads })} ` : ""}
            {item.expiresAt
              ? interpolate(copy.expires, {
                  date: new Date(item.expiresAt).toLocaleDateString(dateLocale),
                })
              : copy.noExpiration}
          </Text>
        </Block>
      ))}

      <Block f={f} divider last padding="20px 32px 28px">
        <Text f={f} muted size={13}>
          {copy.findPurchases}{" "}
          <InlineLink f={f} href={`${EMAIL_SITE_URL}/profile/downloads`}>
            {copy.myDigitalProducts}
          </InlineLink>
          .
        </Text>
      </Block>
    </EmailShell>
  );
};

export default DigitalDeliveryEmail;
