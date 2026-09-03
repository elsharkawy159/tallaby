import { Button, Link, Section, Text } from "@react-email/components";
import { getEmailMessages, interpolate } from "./i18n/index.js";
import type { EmailLocale } from "./i18n/locale.js";
import { emailDateLocale } from "./i18n/locale.js";
import { EmailLayout } from "./layout/email-layout.js";
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
  const copy = getEmailMessages(locale).digitalDelivery;
  const dateLocale = emailDateLocale(locale);

  return (
    <EmailLayout
      locale={locale}
      preview={interpolate(copy.preview, { orderNumber })}
      showContactLine={true}
    >
      <Section className="email-pad px-6 pt-7">
        <Text className="m-0 mb-4 text-[20px] font-semibold text-foreground">
          {interpolate(copy.greeting, { name: customerName })}
        </Text>
        <Text className="m-0 text-[16px] leading-[1.6] text-[#555555]">
          {interpolate(copy.body, { orderNumber })}
        </Text>
      </Section>

      {items.map((item, index) => (
        <Section key={index} className="email-pad mb-4 mt-4 px-6">
          <Section className="w-full rounded-[10px] border-2 border-solid border-border bg-muted px-6 py-6 text-center">
            <Text className="m-0 mb-3 text-[18px] font-bold text-foreground">
              {item.productName}
            </Text>
            {item.licenseKey ? (
              <Text className="mb-4 mt-0 rounded-md bg-card px-3 py-3 font-mono text-[14px] text-foreground">
                {copy.licenseKey} <strong>{item.licenseKey}</strong>
              </Text>
            ) : null}
            <Button
              className="cta-btn box-border block w-full rounded-md bg-primary py-3 text-center text-[15px] font-semibold text-primary-foreground no-underline"
              href={item.downloadUrl}
            >
              {copy.accessDownload}
            </Button>
            <Text className="mb-0 mt-3 text-[12px] text-secondary">
              {item.maxDownloads
                ? `${interpolate(copy.maxDownloads, { count: item.maxDownloads })} `
                : ""}
              {item.expiresAt
                ? interpolate(copy.expires, {
                    date: new Date(item.expiresAt).toLocaleDateString(dateLocale),
                  })
                : copy.noExpiration}
            </Text>
          </Section>
        </Section>
      ))}

      <Section className="email-pad px-6 pt-2">
        <Text className="m-0 text-[13px] text-muted-foreground">
          {copy.findPurchases}{" "}
          <Link
            href={`${EMAIL_SITE_URL}/profile/downloads`}
            className="text-primary underline"
          >
            {copy.myDigitalProducts}
          </Link>
          .
        </Text>
      </Section>
    </EmailLayout>
  );
};

export default DigitalDeliveryEmail;
