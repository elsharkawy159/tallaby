import type { ReactNode } from "react";
import { getEmailMessages, interpolate } from "./i18n/index.js";
import type { EmailLocale } from "./i18n/locale.js";
import { PLATFORM_BRAND } from "./kit/brand.js";
import {
  BalancePanel,
  BigAmount,
  Block,
  Callout,
  Cta,
  emailFrame,
  EmailShell,
  Eyebrow,
  H1,
  HelpBlock,
  InlineLink,
  ItemRow,
  Lead,
  Ltr,
  MailLink,
  MetaGrid,
  Pill,
  SectionTitle,
  SellerFooter,
  Strong,
  Text,
  Totals,
  TwoColumns,
  type EmailFrame,
  type InfoColumn,
  type SecondaryLink,
  type TotalsRow,
  isolateLtr,
} from "./kit/components.js";
import { AddressBody, ItemList, itemDetails } from "./kit/parts.js";
import type { EmailAddress, EmailLineItem } from "./kit/types.js";

/*
 * Seller lifecycle mail (Claude Design `Seller - *`). Always Tallaby's own
 * identity with the "for sellers" tag; the store the email is about is named
 * in the header.
 */

interface SellerEmailProps {
  locale?: EmailLocale | undefined;
  storeName: string;
  /** Seller notification settings page. */
  settingsUrl: string;
}

function SellerShell({
  f,
  storeName,
  settingsUrl,
  title,
  preview,
  children,
}: {
  f: EmailFrame;
  storeName: string;
  settingsUrl: string;
  title: string;
  preview: string;
  children: ReactNode;
}) {
  return (
    <EmailShell
      f={f}
      audience="seller"
      title={title}
      preview={preview}
      headerMeta={storeName}
      footer={<SellerFooter f={f} settingsUrl={settingsUrl} />}
    >
      {children}
    </EmailShell>
  );
}

/* ----------------------------------------------------------------------- */

export interface SellerNewOrderEmailProps extends SellerEmailProps {
  customerName: string;
  orderNumber: string;
  /** Pre-formatted date and time the order was placed. */
  placedAt: string;
  /** Pre-formatted total of this seller's part of the order. */
  total: string;
  subtotal: string;
  shipping: string;
  paymentMethod: string;
  isCashOnDelivery: boolean;
  shipBy?: string | null | undefined;
  promisedBy?: string | null | undefined;
  items: EmailLineItem[];
  shippingAddress?: EmailAddress | null | undefined;
  links: { order: string; invoice?: string | null | undefined };
  supportEmail?: string | undefined;
}

export const SellerNewOrderEmail = ({
  locale = "en",
  storeName,
  settingsUrl,
  customerName,
  orderNumber,
  placedAt,
  total,
  subtotal,
  shipping,
  paymentMethod,
  isCashOnDelivery,
  shipBy,
  promisedBy,
  items,
  shippingAddress,
  links,
  supportEmail = PLATFORM_BRAND.supportEmail,
}: SellerNewOrderEmailProps) => {
  const f = emailFrame(PLATFORM_BRAND, locale);
  const copy = getEmailMessages(locale).sellerNewOrder;
  const count = items.reduce((sum, item) => sum + item.quantity, 0);
  const itemsLabel = count === 1 ? copy.oneItem : interpolate(copy.items, { count });
  const secondary: SecondaryLink[] = links.invoice ? [{ href: links.invoice, label: copy.invoice }] : [];

  const rows: TotalsRow[] = [
    { label: copy.subtotal, value: subtotal },
    { label: copy.shipping, value: shipping },
  ];

  return (
    <SellerShell
      f={f}
      storeName={storeName}
      settingsUrl={settingsUrl}
      title={interpolate(copy.subject, { orderNumber, total })}
      preview={interpolate(copy.preview, { orderNumber, total, payment: paymentMethod })}
    >
      <Block f={f} padding="36px 32px 8px">
        <Pill f={f} tone="success">
          {copy.pill}
        </Pill>
        <Text f={f}>
          {copy.from} <Strong>{customerName}</Strong>
        </Text>
        <BigAmount f={f}>{total}</BigAmount>
        <Text f={f} muted pad={2}>
          {copy.orderLabel} <Ltr>#{orderNumber}</Ltr> · {interpolate(copy.meta, { date: placedAt, items: itemsLabel })}
        </Text>
        {shipBy ? (
          <Callout f={f} tone="warning">
            <Strong>{interpolate(copy.shipBy, { date: shipBy })}</Strong> {copy.shipByNote}
            {promisedBy ? ` ${interpolate(copy.promised, { date: promisedBy })}` : null}
          </Callout>
        ) : null}
        <Cta f={f} href={links.order} label={copy.prepare} links={secondary} />
      </Block>

      <Block f={f} divider>
        <SectionTitle f={f}>{copy.toPack}</SectionTitle>
        {items.map((item, i) => (
          <ItemRow
            key={i}
            f={f}
            name={item.name}
            imageUrl={item.imageUrl ?? null}
            details={itemDetails(f, item, { quantity: false, sku: true })}
            aside={<>&times; {item.quantity}</>}
            asideSub={item.price ?? null}
          />
        ))}
        <Totals f={f} rows={rows} total={{ label: isCashOnDelivery ? copy.toCollect : copy.orderTotal, value: total }} />
      </Block>

      <Block f={f} divider padding="28px 32px 28px">
        <TwoColumns
          f={f}
          first={shippingAddress ? [{ title: copy.shipTo, body: <AddressBody address={shippingAddress} phoneLink /> }] : []}
          second={[{ title: copy.payment, body: paymentMethod }]}
        />
      </Block>

      <Block f={f} divider padding="0 32px 32px" last>
        <HelpBlock f={f} title={null}>
          {copy.help}{" "}
          <InlineLink f={f} href={links.order}>
            {copy.helpCancel}
          </InlineLink>{" "}
          {copy.helpQuestions} <MailLink f={f} email={supportEmail} />.
        </HelpBlock>
      </Block>
    </SellerShell>
  );
};

/* ----------------------------------------------------------------------- */

export interface SellerOrderCancelledEmailProps extends SellerEmailProps {
  orderNumber: string;
  cancelledAt: string;
  byCustomer: boolean;
  reason?: string | null | undefined;
  value: string;
  stockRestored: boolean;
  items: EmailLineItem[];
  links: { order: string };
}

export const SellerOrderCancelledEmail = ({
  locale = "en",
  storeName,
  settingsUrl,
  orderNumber,
  cancelledAt,
  byCustomer,
  reason,
  value,
  stockRestored,
  items,
  links,
}: SellerOrderCancelledEmailProps) => {
  const f = emailFrame(PLATFORM_BRAND, locale);
  const copy = getEmailMessages(locale).sellerOrderCancelled;
  const meta = [
    ...(reason ? [{ label: copy.reason, value: reason }] : []),
    { label: copy.value, value },
    { label: copy.stock, value: stockRestored ? copy.stockRestored : copy.stockUnchanged },
  ];

  return (
    <SellerShell
      f={f}
      storeName={storeName}
      settingsUrl={settingsUrl}
      title={interpolate(copy.subject, { orderNumber })}
      preview={interpolate(copy.preview, { orderNumber })}
    >
      <Block f={f} padding="36px 32px 8px">
        <Pill f={f} tone="danger">
          {copy.pill}
        </Pill>
        <H1 f={f} flush>
          {byCustomer ? copy.headingCustomer : copy.headingOther}
        </H1>
        <Lead f={f}>{interpolate(copy.lead, { orderNumber: isolateLtr(`#${orderNumber}`), date: cancelledAt })}</Lead>
        <Callout f={f} tone="danger">
          <strong>{copy.dontShip}</strong> {copy.dontShipNote}
        </Callout>
        <MetaGrid f={f} items={meta} />
      </Block>

      <Block f={f} divider padding="0 32px 32px" last>
        <SectionTitle f={f}>{copy.items}</SectionTitle>
        <ItemList f={f} items={items} />
        <Cta f={f} href={links.order} label={copy.viewOrder} />
      </Block>
    </SellerShell>
  );
};

/* ----------------------------------------------------------------------- */

export type TopUpMethod = "card" | "wallet" | "instapay" | "bank_transfer" | "manual";

export interface SellerWalletTopUpEmailProps extends SellerEmailProps {
  amount: string;
  balance: string;
  previousBalance?: string | null | undefined;
  reference: string;
  method: TopUpMethod;
  /** Card mask or wallet number shown after the method label, e.g. "•••• 8832". */
  methodDetail?: string | null | undefined;
  date: string;
  fee?: string | null | undefined;
  paid?: string | null | undefined;
  links: { wallet: string; topUp: string };
  supportEmail?: string | undefined;
}

export const SellerWalletTopUpEmail = ({
  locale = "en",
  storeName,
  settingsUrl,
  amount,
  balance,
  previousBalance,
  reference,
  method,
  methodDetail,
  date,
  fee,
  paid,
  links,
  supportEmail = PLATFORM_BRAND.supportEmail,
}: SellerWalletTopUpEmailProps) => {
  const f = emailFrame(PLATFORM_BRAND, locale);
  const copy = getEmailMessages(locale).sellerWalletTopUp;
  const methodLabel = methodDetail ? `${copy.methods[method]} ${methodDetail}` : copy.methods[method];
  const rows: TotalsRow[] = [{ label: copy.amount, value: amount }];
  if (fee) rows.push({ label: copy.fee, value: fee });

  return (
    <SellerShell
      f={f}
      storeName={storeName}
      settingsUrl={settingsUrl}
      title={interpolate(copy.subject, { amount })}
      preview={interpolate(copy.preview, { amount, balance })}
    >
      <Block f={f} padding="36px 32px 8px">
        <Pill f={f} tone="success">
          {copy.pill}
        </Pill>
        <H1 f={f} flush>
          {interpolate(copy.heading, { amount })}
        </H1>
        <Lead f={f}>{copy.lead}</Lead>
        <BalancePanel
          f={f}
          label={copy.balance}
          value={balance}
          sideLabel={previousBalance ? copy.previous : undefined}
          sideValue={previousBalance ?? undefined}
        />
        <MetaGrid
          f={f}
          marginTop={16}
          items={[
            { label: copy.reference, value: reference, ltr: true },
            { label: copy.method, value: methodLabel },
            { label: copy.date, value: date },
          ]}
        />
      </Block>

      <Block f={f} divider padding="0 32px 32px">
        <SectionTitle f={f}>{copy.details}</SectionTitle>
        <Totals f={f} marginTop={18} rows={rows} total={{ label: copy.paid, value: paid ?? amount }} />
        <Cta f={f} href={links.wallet} label={copy.viewWallet} links={[{ href: links.topUp, label: copy.topUpAgain }]} />
      </Block>

      <Block f={f} divider padding="0 32px 32px" last>
        <HelpBlock f={f} title={null}>
          {copy.notYou}{" "}
          <InlineLink f={f} href={`mailto:${supportEmail}`}>
            {copy.contactUs}
          </InlineLink>{" "}
          <Ltr>{supportEmail}</Ltr>.
        </HelpBlock>
      </Block>
    </SellerShell>
  );
};

/* ----------------------------------------------------------------------- */

export interface SellerPayoutEmailProps extends SellerEmailProps {
  amount: string;
  reference: string;
  account?: string | null | undefined;
  date: string;
  period?: string | null | undefined;
  /** Receipt lines (gross sales, fees, returns…), pre-formatted. */
  rows: TotalsRow[];
  links: { statement: string; bankSettings: string };
}

/**
 * Payout sent. Seller payouts are not built yet (docs/wallet.md §8): the
 * template is ready for when they are, and nothing sends it today.
 */
export const SellerPayoutEmail = ({
  locale = "en",
  storeName,
  settingsUrl,
  amount,
  reference,
  account,
  date,
  period,
  rows,
  links,
}: SellerPayoutEmailProps) => {
  const f = emailFrame(PLATFORM_BRAND, locale);
  const copy = getEmailMessages(locale).sellerPayout;
  return (
    <SellerShell f={f} storeName={storeName} settingsUrl={settingsUrl} title={interpolate(copy.subject, { amount })} preview={copy.preview}>
      <Block f={f} padding="36px 32px 8px">
        <Eyebrow f={f}>{copy.eyebrow}</Eyebrow>
        <H1 f={f}>{interpolate(copy.heading, { amount })}</H1>
        <Lead f={f}>{period ? interpolate(copy.leadPeriod, { period }) : copy.lead}</Lead>
        <MetaGrid
          f={f}
          items={[
            { label: copy.reference, value: reference, ltr: true },
            ...(account ? [{ label: copy.account, value: account, ltr: true }] : []),
            { label: copy.date, value: date },
          ]}
        />
      </Block>
      <Block f={f} divider padding="0 32px 32px">
        <SectionTitle f={f}>{copy.details}</SectionTitle>
        <Totals f={f} rows={rows} total={{ label: copy.net, value: amount }} />
        <Cta f={f} href={links.statement} label={copy.statement} />
      </Block>
      <Block f={f} divider padding="0 32px 32px" last>
        <HelpBlock f={f} title={null}>
          {copy.bankNote}{" "}
          <InlineLink f={f} href={links.bankSettings}>
            {copy.bankLink}
          </InlineLink>
          .
        </HelpBlock>
      </Block>
    </SellerShell>
  );
};

/* ----------------------------------------------------------------------- */

export interface LowStockItem {
  name: string;
  variant?: string | null | undefined;
  sku?: string | null | undefined;
  imageUrl?: string | null | undefined;
  remaining: number;
  soldThisWeek?: number | null | undefined;
}

export interface SellerLowStockEmailProps extends SellerEmailProps {
  items: LowStockItem[];
  links: { products: string };
}

export const SellerLowStockEmail = ({ locale = "en", storeName, settingsUrl, items, links }: SellerLowStockEmailProps) => {
  const f = emailFrame(PLATFORM_BRAND, locale);
  const copy = getEmailMessages(locale).sellerLowStock;
  const count = items.length;
  const one = count === 1;
  return (
    <SellerShell
      f={f}
      storeName={storeName}
      settingsUrl={settingsUrl}
      title={one ? copy.subjectOne : interpolate(copy.subject, { count })}
      preview={interpolate(copy.preview, { count })}
    >
      <Block f={f} padding="36px 32px 8px">
        <Pill f={f} tone="warning">
          {copy.pill}
        </Pill>
        <H1 f={f} flush>
          {one ? copy.headingOne : interpolate(copy.heading, { count })}
        </H1>
        <Lead f={f}>{copy.lead}</Lead>
      </Block>
      <Block f={f} padding="0 32px 32px">
        {items.map((item, i) => (
          <ItemRow
            key={i}
            f={f}
            name={item.name}
            imageUrl={item.imageUrl ?? null}
            details={
              item.variant || item.sku
                ? [
                    <>
                      {item.variant}
                      {item.variant && item.sku ? " · " : null}
                      {item.sku ? <Ltr>{item.sku}</Ltr> : null}
                    </>,
                  ]
                : []
            }
            aside={
              <span style={{ color: item.remaining <= 2 ? "#b91c1c" : "#b45309" }}>
                {item.remaining <= 0 ? copy.outOfStock : interpolate(copy.remaining, { count: item.remaining })}
              </span>
            }
            asideSub={item.soldThisWeek ? interpolate(copy.sold, { count: item.soldThisWeek }) : null}
          />
        ))}
        <Cta f={f} href={links.products} label={copy.update} />
      </Block>
      <Block f={f} divider padding="0 32px 32px" last>
        <HelpBlock f={f} title={null}>
          {copy.note}
        </HelpBlock>
      </Block>
    </SellerShell>
  );
};

/* ----------------------------------------------------------------------- */

export interface SellerStoreCreatedEmailProps extends SellerEmailProps {
  /** Public storefront URL. */
  storeUrl: string;
  /** Hostname for display, e.g. "faster.tallaby.com". */
  storeHost: string;
  links: { addProduct: string; design: string; help: string };
}

function StepBadge({ f, index, done }: { f: EmailFrame; index: number; done: boolean }) {
  const { primary } = f.brand;
  return (
    <table role="presentation" cellPadding={0} cellSpacing={0} border={0}>
      <tbody>
        <tr>
          <td
            width={28}
            height={28}
            align="center"
            bgcolor={done ? primary : "#ffffff"}
            style={{
              width: 28,
              height: 28,
              backgroundColor: done ? primary : "#ffffff",
              border: `2px solid ${primary}`,
              borderRadius: 14,
              fontFamily: "Montserrat,Arial,Helvetica,sans-serif",
              fontSize: 13,
              lineHeight: "24px",
              fontWeight: 700,
              color: done ? "#ffffff" : primary,
            }}
          >
            {done ? <>&#10003;</> : index + 1}
          </td>
        </tr>
      </tbody>
    </table>
  );
}

export const SellerStoreCreatedEmail = ({ locale = "en", storeName, settingsUrl, storeUrl, storeHost, links }: SellerStoreCreatedEmailProps) => {
  const f = emailFrame(PLATFORM_BRAND, locale);
  const copy = getEmailMessages(locale).sellerStoreCreated;
  const kit = getEmailMessages(locale).kit;
  const steps: InfoColumn[] = copy.steps.map(([title, body]) => ({ title, body }));

  return (
    <SellerShell f={f} storeName={storeName} settingsUrl={settingsUrl} title={copy.subject} preview={copy.preview}>
      <Block f={f} padding="36px 32px 8px">
        <Pill f={f} tone="success">
          {copy.pill}
        </Pill>
        <H1 f={f} flush>
          {copy.heading}
        </H1>
        <Lead f={f}>{interpolate(copy.lead, { storeName })}</Lead>
        <MetaGrid
          f={f}
          items={[
            { label: copy.storeName, value: storeName },
            {
              label: copy.storeLink,
              value: (
                <a href={storeUrl} style={{ color: "#171717", textDecoration: "none" }}>
                  {storeHost}
                </a>
              ),
              ltr: true,
            },
          ]}
        />
      </Block>
      <Block f={f} divider padding="0 32px 32px">
        <SectionTitle f={f}>{copy.stepsTitle}</SectionTitle>
        <table role="presentation" cellPadding={0} cellSpacing={0} border={0} width="100%" dir={f.dir} style={{ marginTop: 20 }}>
          <tbody>
            {steps.map((step, i) => (
              <tr key={i}>
                <td width={40} valign="top" style={{ padding: f.dir === "rtl" ? "0 0 18px 12px" : "0 12px 18px 0" }}>
                  <StepBadge f={f} index={i} done={i === 0} />
                </td>
                <td valign="top" style={{ textAlign: f.start, paddingBottom: 18, fontFamily: f.font }}>
                  <div style={{ fontSize: 15, lineHeight: "26px", fontWeight: 700, color: "#171717" }}>{step.title}</div>
                  <div style={{ fontSize: 13, lineHeight: "22px", color: "#6b7280" }}>{step.body}</div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <Cta
          f={f}
          href={links.addProduct}
          label={copy.addProduct}
          links={[
            { href: links.design, label: copy.design },
            { href: links.help, label: copy.helpCenter },
          ]}
        />
      </Block>
      <Block f={f} divider padding="0 32px 32px" last>
        <HelpBlock f={f}>
          {kit.replyOrWrite} <MailLink f={f} email={f.brand.supportEmail} />.
        </HelpBlock>
      </Block>
    </SellerShell>
  );
};
