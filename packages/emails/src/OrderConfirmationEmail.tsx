import { getEmailMessages, interpolate } from "./i18n/index.js";
import type { EmailLocale } from "./i18n/locale.js";
import { PLATFORM_BRAND, type EmailBrand } from "./kit/brand.js";
import {
  Block,
  Callout,
  Cta,
  emailFrame,
  EmailShell,
  Eyebrow,
  FooterLines,
  H1,
  HelpBlock,
  InlineLink,
  Lead,
  Ltr,
  MailLink,
  MetaGrid,
  Progress,
  SectionTitle,
  SentTo,
  Totals,
  TwoColumns,
  type MetaItem,
  type TotalsRow,
} from "./kit/components.js";
import { AddressBody, ItemList } from "./kit/parts.js";

export interface OrderConfirmationCustomer {
  name: string;
  email: string;
}

export interface OrderConfirmationOrder {
  orderNumber: string;
  /** Pre-formatted order date, e.g. "September 2, 2026". */
  orderDate: string;
  /** Pre-formatted estimated delivery date; omit for digital-only orders. */
  estimatedDelivery?: string | null;
}

export interface OrderConfirmationItem {
  productName: string;
  variantName?: string | null;
  sellerName?: string | null;
  quantity: number;
  /** Pre-formatted unit price, e.g. "EGP 1,250". */
  unitPrice: string;
  /** Pre-formatted line subtotal (unit price x quantity). */
  lineTotal: string;
  /** Absolute, publicly reachable image URL; omitted when none is reliable. */
  imageUrl?: string | null;
}

export interface OrderConfirmationPricing {
  subtotal: string;
  shipping: string;
  /** Pre-formatted discount; omit or leave null when no discount applied. */
  discount?: string | null;
  couponCode?: string | null;
  total: string;
}

export interface OrderConfirmationShippingAddress {
  fullName: string;
  addressLine1: string;
  addressLine2?: string | null;
  city: string;
  state: string;
  postalCode?: string | null;
  country: string;
  phone?: string | null;
}

export interface OrderConfirmationEmailProps {
  customer: OrderConfirmationCustomer;
  order: OrderConfirmationOrder;
  items: OrderConfirmationItem[];
  pricing: OrderConfirmationPricing;
  /** Human-readable payment method label, e.g. "Cash on delivery". */
  paymentMethod?: string | null;
  /** Cash on delivery: shows the "have {total} ready" note. */
  isCashOnDelivery?: boolean;
  shippingAddress?: OrderConfirmationShippingAddress | null;
  links: {
    /** Absolute URL to the customer's order page. */
    viewOrder: string;
  };
  locale?: EmailLocale;
  /** The store's identity for a storefront order; Tallaby's otherwise. */
  brand?: EmailBrand;
}

/** Address in the shared `{ fullName, lines }` shape the kit renders. */
export function addressLines(address: OrderConfirmationShippingAddress) {
  const cityLine = [address.city, address.state].filter(Boolean).join(", ");
  return {
    fullName: address.fullName,
    lines: [
      address.addressLine1,
      address.addressLine2 ?? "",
      `${cityLine}${address.postalCode ? ` ${address.postalCode}` : ""}`,
      address.country,
    ].filter((line) => line.trim().length > 0),
    phone: address.phone ?? null,
  };
}

/** Customer order confirmation (Claude Design `Customer - Order Confirmation`). */
export const OrderConfirmationEmail = ({
  customer,
  order,
  items = [],
  pricing,
  paymentMethod,
  isCashOnDelivery = false,
  shippingAddress,
  links,
  locale = "en",
  brand = PLATFORM_BRAND,
}: OrderConfirmationEmailProps) => {
  const f = emailFrame(brand, locale);
  const copy = getEmailMessages(locale).orderConfirmationV2;
  const legacy = getEmailMessages(locale).orderConfirmation;
  const kit = getEmailMessages(locale).kit;

  const meta: MetaItem[] = [
    { label: legacy.orderNumber, value: `#${order.orderNumber}`, ltr: true },
    { label: legacy.orderDate, value: order.orderDate },
  ];
  if (order.estimatedDelivery) meta.push({ label: copy.arrivesBy, value: order.estimatedDelivery });

  const rows: TotalsRow[] = [
    { label: legacy.subtotal, value: pricing.subtotal },
    { label: legacy.shipping, value: pricing.shipping },
  ];
  if (pricing.discount) {
    rows.push({
      label: pricing.couponCode ? interpolate(legacy.discountWithCoupon, { couponCode: pricing.couponCode }) : legacy.discount,
      value: `−${pricing.discount}`,
      positive: true,
    });
  }

  return (
    <EmailShell
      f={f}
      audience="customer"
      title={interpolate(copy.title, { orderNumber: order.orderNumber })}
      preview={interpolate(copy.preview, { orderNumber: order.orderNumber })}
      headerMeta={
        <a href={links.viewOrder} style={{ color: brand.onPrimaryMuted, textDecoration: "none" }}>
          {kit.order} <Ltr>#{order.orderNumber}</Ltr>
        </a>
      }
      footer={
        <FooterLines
          f={f}
          lead={
            <>
              {copy.footer.split("{orderNumber}")[0]}
              <Ltr>#{order.orderNumber}</Ltr>
              {copy.footer.split("{orderNumber}")[1]} <SentTo email={customer.email} />.
            </>
          }
        />
      }
    >
      <Block f={f} padding="36px 32px 8px">
        <Eyebrow f={f}>{copy.eyebrow}</Eyebrow>
        <H1 f={f}>{interpolate(copy.heading, { name: customer.name })}</H1>
        <Lead f={f}>{copy.lead}</Lead>
        <Progress f={f} step={0} />
        <MetaGrid f={f} items={meta} />
        <Cta f={f} href={links.viewOrder} label={copy.track} />
      </Block>

      <Block f={f} divider>
        <SectionTitle f={f} count={items.length}>
          {copy.yourItems}
        </SectionTitle>
        <ItemList
          f={f}
          items={items.map((item) => ({
            name: item.productName,
            variant: item.variantName,
            quantity: item.quantity,
            price: item.lineTotal,
            imageUrl: item.imageUrl,
            sellerName: item.sellerName,
          }))}
          options={{ seller: brand.isPlatform }}
        />
        <Totals f={f} rows={rows} total={{ label: legacy.total, value: pricing.total }} />
      </Block>

      {shippingAddress || paymentMethod ? (
        <Block f={f} divider>
          <TwoColumns
            f={f}
            first={shippingAddress ? [{ title: legacy.shippingTo, body: <AddressBody address={addressLines(shippingAddress)} /> }] : []}
            second={
              paymentMethod
                ? [
                    {
                      title: legacy.payment,
                      body: (
                        <>
                          {paymentMethod}
                          {isCashOnDelivery ? (
                            <Callout f={f} tone="warning" marginTop={10}>
                              {interpolate(copy.codNote, { total: pricing.total })}
                            </Callout>
                          ) : null}
                        </>
                      ),
                    },
                  ]
                : []
            }
          />
        </Block>
      ) : null}

      <Block f={f} divider padding="28px 32px 32px" last>
        <HelpBlock f={f} title={copy.help}>
          {kit.replyOrWrite} <MailLink f={f} email={brand.supportEmail} />. {copy.helpTrack}{" "}
          <InlineLink f={f} href={links.viewOrder}>
            {legacy.orderPage}
          </InlineLink>
          .
        </HelpBlock>
      </Block>
    </EmailShell>
  );
};

export default OrderConfirmationEmail;
