import { getEmailMessages, interpolate } from "./i18n/index.js";
import { PLATFORM_BRAND } from "./kit/brand.js";
import {
  Block,
  Cta,
  emailFrame,
  EmailShell,
  Eyebrow,
  FooterLines,
  FooterLink,
  H1,
  Lead,
  Text,
  Totals,
  type TotalsRow,
} from "./kit/components.js";
import { ItemList } from "./kit/parts.js";
import type { BaseEmailProps, EmailLineItem } from "./kit/types.js";

export interface AbandonedCartCoupon {
  code: string;
  /** Pre-formatted discount label, e.g. "10%". */
  discountLabel: string;
  /** Pre-formatted discount amount on this cart. */
  discountAmount: string;
  /** Pre-formatted total after the discount. */
  totalAfter: string;
  expiresOn?: string | null | undefined;
}

export interface AbandonedCartEmailProps extends BaseEmailProps {
  items: EmailLineItem[];
  subtotal: string;
  coupon?: AbandonedCartCoupon | null | undefined;
  links: { cart: string; unsubscribe?: string | null | undefined };
}

/** Customer: items left in the cart (Claude Design `Customer - Abandoned Cart`). */
export const AbandonedCartEmail = ({ items, subtotal, coupon, links, locale = "en", brand = PLATFORM_BRAND }: AbandonedCartEmailProps) => {
  const f = emailFrame(brand, locale);
  const copy = getEmailMessages(locale).abandonedCart;
  const kit = getEmailMessages(locale).kit;

  const rows: TotalsRow[] = [{ label: copy.subtotal, value: subtotal }];
  if (coupon) rows.push({ label: interpolate(copy.discount, { code: coupon.code }), value: `−${coupon.discountAmount}`, positive: true });

  return (
    <EmailShell
      f={f}
      audience="customer"
      title={copy.subject}
      preview={coupon ? interpolate(copy.previewCoupon, { code: coupon.code, discount: coupon.discountLabel }) : copy.preview}
      footer={
        <FooterLines
          f={f}
          lead={
            <>
              {kit.marketingReason}
              {links.unsubscribe ? (
                <>
                  {" "}
                  <FooterLink href={links.unsubscribe}>{kit.unsubscribe}</FooterLink>
                </>
              ) : null}
            </>
          }
        />
      }
    >
      <Block f={f} padding="36px 32px 8px">
        <Eyebrow f={f}>{copy.eyebrow}</Eyebrow>
        <H1 f={f}>{copy.heading}</H1>
        <Lead f={f}>{copy.lead}</Lead>
      </Block>

      <Block f={f} padding="0 32px 32px" last>
        <ItemList f={f} items={items} />
        <Totals
          f={f}
          rows={rows}
          total={{ label: coupon ? copy.totalAfter : copy.total, value: coupon ? coupon.totalAfter : subtotal }}
        />
        {coupon ? (
          <Text f={f} center pad={24}>
            {interpolate(copy.coupon, { discount: coupon.discountLabel })}{" "}
            <span
              dir="ltr"
              style={{
                display: "inline-block",
                padding: "2px 10px",
                border: `1px dashed ${brand.accent}`,
                borderRadius: 6,
                fontWeight: 700,
                color: brand.primary,
              }}
            >
              {coupon.code}
            </span>
            {coupon.expiresOn ? ` ${interpolate(copy.couponUntil, { date: coupon.expiresOn })}` : null}
          </Text>
        ) : null}
        <Cta f={f} href={links.cart} label={copy.complete} />
      </Block>
    </EmailShell>
  );
};

export default AbandonedCartEmail;
