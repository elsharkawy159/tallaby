import { getEmailMessages, interpolate } from "./i18n/index.js";
import { PLATFORM_BRAND } from "./kit/brand.js";
import {
  Block,
  Callout,
  Cta,
  CustomerFooter,
  emailFrame,
  EmailShell,
  Eyebrow,
  H1,
  HelpBlock,
  ItemRow,
  Lead,
  Ltr,
  MetaGrid,
  SectionTitle,
  Totals,
  type TotalsRow,
  isolateLtr,
} from "./kit/components.js";
import type { BaseEmailProps, EmailCustomer } from "./kit/types.js";

export type RefundMethod = "wallet" | "original" | "manual";

export interface RefundedItem {
  name: string;
  imageUrl?: string | null | undefined;
  reason?: string | null | undefined;
  /** Pre-formatted refunded value of the line. */
  amount?: string | null | undefined;
}

export interface RefundIssuedEmailProps extends BaseEmailProps {
  customer: EmailCustomer;
  orderNumber: string;
  /** Pre-formatted refund total. */
  amount: string;
  method: RefundMethod;
  date: string;
  items: RefundedItem[];
  /** Optional receipt lines; omitted → only the total is shown. */
  itemsValue?: string | null | undefined;
  /** Pre-formatted refunded shipping, or null when shipping is not refunded. */
  shippingRefunded?: string | null | undefined;
  links: { wallet?: string | null | undefined; order: string };
}

/** Customer: refund issued (Claude Design `Customer - Refund Issued`). */
export const RefundIssuedEmail = ({
  customer,
  orderNumber,
  amount,
  method,
  date,
  items,
  itemsValue,
  shippingRefunded,
  links,
  locale = "en",
  brand = PLATFORM_BRAND,
}: RefundIssuedEmailProps) => {
  const f = emailFrame(brand, locale);
  const copy = getEmailMessages(locale).refundIssued;
  const kit = getEmailMessages(locale).kit;
  const toWallet = method === "wallet" && Boolean(links.wallet);

  const rows: TotalsRow[] = [];
  if (itemsValue) {
    rows.push({ label: copy.itemsValue, value: itemsValue });
    rows.push({ label: copy.shipping, value: shippingRefunded ?? copy.shippingNotRefunded });
  }

  return (
    <EmailShell
      f={f}
      audience="customer"
      title={interpolate(copy.subject, { amount, orderNumber })}
      preview={interpolate(copy.preview, { amount })}
      headerMeta={
        <>
          {kit.order} <Ltr>#{orderNumber}</Ltr>
        </>
      }
      footer={<CustomerFooter f={f} email={customer.email} />}
    >
      <Block f={f} padding="36px 32px 32px">
        <Eyebrow f={f}>{copy.eyebrow}</Eyebrow>
        <H1 f={f}>{interpolate(copy.heading, { amount })}</H1>
        <Lead f={f}>{interpolate(copy.lead, { orderNumber: isolateLtr(`#${orderNumber}`) })}</Lead>
        <MetaGrid
          f={f}
          items={[
            { label: copy.amount, value: amount },
            { label: copy.method, value: copy.methods[method] },
            { label: copy.date, value: date },
          ]}
        />
        {method === "wallet" ? <Callout f={f}>{copy.walletNote}</Callout> : null}
        <Cta f={f} href={toWallet ? links.wallet! : links.order} label={toWallet ? copy.viewWallet : copy.viewOrder} />
      </Block>

      {items.length > 0 ? (
        <Block f={f} divider padding="0 32px 28px">
          <SectionTitle f={f}>{copy.refundedItems}</SectionTitle>
          {items.map((item, i) => (
            <ItemRow
              key={i}
              f={f}
              name={item.name}
              imageUrl={item.imageUrl ?? null}
              details={item.reason ? [interpolate(copy.reason, { reason: item.reason })] : []}
              aside={item.amount ?? null}
            />
          ))}
          <Totals f={f} rows={rows} total={{ label: copy.total, value: amount }} />
        </Block>
      ) : null}

      <Block f={f} divider padding="0 32px 32px" last>
        <HelpBlock f={f} />
      </Block>
    </EmailShell>
  );
};

export default RefundIssuedEmail;
