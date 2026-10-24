import { getEmailMessages, interpolate } from "./i18n/index.js";
import { PLATFORM_BRAND } from "./kit/brand.js";
import {
  Block,
  Cta,
  CustomerFooter,
  emailFrame,
  EmailShell,
  Eyebrow,
  H1,
  HelpBlock,
  Lead,
  Ltr,
  MetaGrid,
  Progress,
  SectionTitle,
  TwoColumns,
  type InfoColumn,
  type MetaItem,
} from "./kit/components.js";
import { AddressBody, ItemList } from "./kit/parts.js";
import type { BaseEmailProps, EmailAddress, EmailCustomer, EmailLineItem } from "./kit/types.js";

export interface OrderShippedEmailProps extends BaseEmailProps {
  customer: EmailCustomer;
  orderNumber: string;
  carrier?: string | null | undefined;
  trackingNumber?: string | null | undefined;
  estimatedDelivery?: string | null | undefined;
  items: EmailLineItem[];
  shippingAddress?: EmailAddress | null | undefined;
  paymentMethod?: string | null | undefined;
  /** Cash still to pay the courier (COD), pre-formatted. */
  amountDue?: string | null | undefined;
  links: { trackOrder: string };
}

/** Customer: the order left with the courier (Claude Design `Customer - Order Shipped`). */
export const OrderShippedEmail = ({
  customer,
  orderNumber,
  carrier,
  trackingNumber,
  estimatedDelivery,
  items,
  shippingAddress,
  paymentMethod,
  amountDue,
  links,
  locale = "en",
  brand = PLATFORM_BRAND,
}: OrderShippedEmailProps) => {
  const f = emailFrame(brand, locale);
  const copy = getEmailMessages(locale).orderShipped;
  const kit = getEmailMessages(locale).kit;

  const meta: MetaItem[] = [];
  if (carrier) meta.push({ label: copy.carrier, value: carrier, ltr: /^[\x00-\x7f]+$/.test(carrier) });
  if (trackingNumber) meta.push({ label: copy.tracking, value: trackingNumber, ltr: true });
  if (estimatedDelivery) meta.push({ label: copy.arrivesBy, value: estimatedDelivery });

  const payment: InfoColumn[] = paymentMethod
    ? [
        {
          title: copy.payment,
          body: (
            <>
              {paymentMethod}
              {amountDue ? (
                <>
                  <br />
                  <span style={{ color: "#6b7280" }}>
                    {copy.amountDue} <strong style={{ color: "#171717" }}>{amountDue}</strong>
                  </span>
                </>
              ) : null}
            </>
          ),
        },
      ]
    : [];

  return (
    <EmailShell
      f={f}
      audience="customer"
      title={interpolate(copy.subject, { orderNumber })}
      preview={
        estimatedDelivery
          ? interpolate(copy.preview, { date: estimatedDelivery })
          : interpolate(copy.previewNoDate, { orderNumber })
      }
      headerMeta={
        <>
          {kit.order} <Ltr>#{orderNumber}</Ltr>
        </>
      }
      footer={<CustomerFooter f={f} email={customer.email} />}
    >
      <Block f={f} padding="36px 32px 8px">
        <Eyebrow f={f}>{copy.eyebrow}</Eyebrow>
        <H1 f={f}>{copy.heading}</H1>
        <Lead f={f}>{copy.lead}</Lead>
        <Progress f={f} step={1} />
        {meta.length > 0 ? <MetaGrid f={f} items={meta} /> : null}
        <Cta f={f} href={links.trackOrder} label={copy.track} />
      </Block>

      <Block f={f} divider>
        <SectionTitle f={f}>{copy.inShipment}</SectionTitle>
        <ItemList f={f} items={items} />
      </Block>

      {shippingAddress || payment.length > 0 ? (
        <Block f={f} divider padding="28px 32px 28px">
          <TwoColumns
            f={f}
            first={shippingAddress ? [{ title: copy.shippingAddress, body: <AddressBody address={{ ...shippingAddress, phone: null }} /> }] : []}
            second={payment}
          />
        </Block>
      ) : null}

      <Block f={f} divider padding="0 32px 32px" last>
        <HelpBlock f={f} />
      </Block>
    </EmailShell>
  );
};

export default OrderShippedEmail;
