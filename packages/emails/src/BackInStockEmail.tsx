import { getEmailMessages, interpolate } from "./i18n/index.js";
import { PLATFORM_BRAND } from "./kit/brand.js";
import { Block, Cta, emailFrame, EmailShell, Eyebrow, FooterLines, FooterLink, H1, ItemRow, Lead } from "./kit/components.js";
import type { BaseEmailProps } from "./kit/types.js";

export interface BackInStockEmailProps extends BaseEmailProps {
  storeName: string;
  product: {
    name: string;
    variant?: string | null | undefined;
    /** Pre-formatted price, e.g. "350 ج.م". */
    price?: string | null | undefined;
    imageUrl?: string | null | undefined;
  };
  links: { product: string; unsubscribe: string };
}

/**
 * Customer: an item they asked about is back in stock (ROADMAP.md F-23a).
 * Sent under the store's brand, once per alert (the stock-alerts cron).
 */
export const BackInStockEmail = ({ storeName, product, links, locale = "en", brand = PLATFORM_BRAND }: BackInStockEmailProps) => {
  const f = emailFrame(brand, locale);
  const copy = getEmailMessages(locale).backInStock;

  return (
    <EmailShell
      f={f}
      audience="customer"
      title={interpolate(copy.subject, { product: product.name })}
      preview={interpolate(copy.preview, { store: storeName })}
      footer={
        <FooterLines
          f={f}
          lead={
            <>
              {copy.reason} <FooterLink href={links.unsubscribe}>{copy.unsubscribe}</FooterLink>
            </>
          }
        />
      }
    >
      <Block f={f} padding="36px 32px 8px">
        <Eyebrow f={f}>{copy.eyebrow}</Eyebrow>
        <H1 f={f}>{copy.heading}</H1>
        <Lead f={f}>{interpolate(copy.lead, { store: storeName })}</Lead>
      </Block>

      <Block f={f} padding="0 32px 32px" last>
        <ItemRow
          f={f}
          name={product.name}
          imageUrl={product.imageUrl ?? null}
          details={product.variant ? [product.variant] : []}
          aside={product.price ?? null}
        />
        <Cta f={f} href={links.product} label={copy.shop} />
      </Block>
    </EmailShell>
  );
};

export default BackInStockEmail;
