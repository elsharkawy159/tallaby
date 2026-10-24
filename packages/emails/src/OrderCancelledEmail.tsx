import { getEmailMessages, interpolate } from "./i18n/index.js";
import { PLATFORM_BRAND } from "./kit/brand.js";
import {
  Block,
  Callout,
  Cta,
  CustomerFooter,
  emailFrame,
  EmailShell,
  H1,
  HelpBlock,
  Lead,
  Ltr,
  Pill,
  SectionTitle,
  Text,
  isolateLtr,
} from "./kit/components.js";
import { ItemList } from "./kit/parts.js";
import type { BaseEmailProps, EmailCustomer, EmailLineItem } from "./kit/types.js";

export type CancelledBy = "customer" | "seller" | "system";

export interface OrderCancelledEmailProps extends BaseEmailProps {
  customer: EmailCustomer;
  orderNumber: string;
  cancelledDate: string;
  cancelledBy: CancelledBy;
  reason?: string | null | undefined;
  /**
   * What happens to the money: nothing was charged (COD), or a paid amount is
   * being refunded. `null` shows no money note.
   */
  payment?: { kind: "cod" } | { kind: "refund"; amount: string } | null | undefined;
  items: EmailLineItem[];
  links: { shop: string };
}

/** Customer: order cancelled (Claude Design `Customer - Order Cancelled`). */
export const OrderCancelledEmail = ({
  customer,
  orderNumber,
  cancelledDate,
  cancelledBy,
  reason,
  payment,
  items,
  links,
  locale = "en",
  brand = PLATFORM_BRAND,
}: OrderCancelledEmailProps) => {
  const f = emailFrame(brand, locale);
  const copy = getEmailMessages(locale).orderCancelled;
  const kit = getEmailMessages(locale).kit;
  const lead = { customer: copy.leadCustomer, seller: copy.leadSeller, system: copy.leadSystem }[cancelledBy];

  return (
    <EmailShell
      f={f}
      audience="customer"
      title={interpolate(copy.subject, { orderNumber })}
      preview={interpolate(copy.preview, { orderNumber })}
      headerMeta={
        <>
          {kit.order} <Ltr>#{orderNumber}</Ltr>
        </>
      }
      footer={<CustomerFooter f={f} email={customer.email} />}
    >
      <Block f={f} padding="36px 32px 28px">
        <Pill f={f} tone="danger">
          {copy.pill}
        </Pill>
        <H1 f={f} flush>
          {copy.heading}
        </H1>
        <Lead f={f}>{interpolate(lead, { orderNumber: isolateLtr(`#${orderNumber}`), date: cancelledDate })}</Lead>
        {reason ? (
          <Text f={f} muted pad={6}>
            {interpolate(copy.reason, { reason })}
          </Text>
        ) : null}
        {payment ? (
          <Callout f={f} tone="success">
            {payment.kind === "cod" ? copy.codNote : interpolate(copy.refundNote, { amount: payment.amount })}
          </Callout>
        ) : null}
      </Block>

      <Block f={f} divider padding="0 32px 32px">
        <SectionTitle f={f}>{copy.items}</SectionTitle>
        <ItemList f={f} items={items} />
        <Cta f={f} href={links.shop} label={copy.shopAgain} />
      </Block>

      <Block f={f} divider padding="0 32px 32px" last>
        <HelpBlock f={f} />
      </Block>
    </EmailShell>
  );
};

export default OrderCancelledEmail;
