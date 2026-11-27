import { getEmailMessages, interpolate } from "./i18n/index.js";
import type { EmailLocale } from "./i18n/locale.js";
import { emailDateLocale } from "./i18n/locale.js";
import { PLATFORM_BRAND, type EmailBrand } from "./kit/brand.js";
import {
  Block,
  Callout,
  Cta,
  emailFrame,
  EmailShell,
  FooterLines,
  H1,
  HelpBlock,
  Lead,
  MailLink,
  SectionTitle,
  Text,
} from "./kit/components.js";

export interface DigitalDeliveryItem {
  productName: string;
  /** The one-time download page, `account.<root>/d/<token>` (F-108c). */
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
  /** Defaults to Tallaby's. A storefront order passes the store's. */
  brand?: EmailBrand;
  /** The store the order was placed on; null or missing for a marketplace order. */
  storeName?: string | null;
}

/** Customer: download links after an online payment, one per purchased item. */
export const DigitalDeliveryEmail = ({
  customerName = "there",
  orderNumber = "",
  items = [],
  locale = "en",
  brand = PLATFORM_BRAND,
  storeName = null,
}: DigitalDeliveryEmailProps) => {
  const f = emailFrame(brand, locale);
  const messages = getEmailMessages(locale);
  const copy = messages.digitalDelivery;
  const dateLocale = emailDateLocale(locale);
  const store = storeName?.trim() || copy.platformName;

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
        <Lead f={f}>{interpolate(copy.body, { store })}</Lead>
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
            {item.maxDownloads === 1
              ? copy.once
              : item.maxDownloads && item.maxDownloads > 1
                ? interpolate(copy.maxDownloads, { count: item.maxDownloads })
                : ""}
            {item.expiresAt
              ? ` ${interpolate(copy.expires, {
                  date: new Date(item.expiresAt).toLocaleDateString(dateLocale, { dateStyle: "long" }),
                })}`
              : ""}
          </Text>
        </Block>
      ))}

      <Block f={f} divider last padding="20px 32px 28px">
        <Text f={f} muted size={13}>
          {copy.saveFiles}
        </Text>
        <HelpBlock f={f} title={null}>
          {interpolate(copy.needNewLink, { store })}
        </HelpBlock>
      </Block>
    </EmailShell>
  );
};

export default DigitalDeliveryEmail;
