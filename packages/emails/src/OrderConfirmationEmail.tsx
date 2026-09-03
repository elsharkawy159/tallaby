import {
  Button,
  Column,
  Hr,
  Img,
  Link,
  Row,
  Section,
  Text,
} from "@react-email/components";
import { getEmailMessages, interpolate } from "./i18n/index.js";
import type { EmailLocale } from "./i18n/locale.js";
import { EmailLayout } from "./layout/email-layout.js";
import { EMAIL_CONTACT } from "./theme/tokens.js";

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
  shippingAddress?: OrderConfirmationShippingAddress | null;
  links: {
    /** Absolute URL to the customer's order page. */
    viewOrder: string;
  };
  locale?: EmailLocale;
}

export const OrderConfirmationEmail = ({
  customer,
  order,
  items = [],
  pricing,
  paymentMethod,
  shippingAddress,
  links,
  locale = "en",
}: OrderConfirmationEmailProps) => {
  const copy = getEmailMessages(locale).orderConfirmation;
  const hasDiscount = Boolean(pricing.discount);
  const hasDetails = Boolean(
    shippingAddress || order.estimatedDelivery || paymentMethod,
  );

  return (
    <EmailLayout
      locale={locale}
      preview={interpolate(copy.preview, {
        orderNumber: order.orderNumber,
        total: pricing.total,
      })}
      showContactLine={false}
      footerIntro={
        <>
          <Text className="m-0 mb-1.5 text-[14px] font-semibold text-foreground">
            {copy.needHelp}
          </Text>
          <Text className="m-0 text-[13px] leading-5 text-muted-foreground">
            {copy.helpReply}{" "}
            <Link
              href={`mailto:${EMAIL_CONTACT}`}
              className="text-primary underline"
            >
              {EMAIL_CONTACT}
            </Link>
            . {copy.helpTrack}{" "}
            <Link href={links.viewOrder} className="text-primary underline">
              {copy.orderPage}
            </Link>
            .
          </Text>
          <Text className="mb-0 mt-2 text-[11px] leading-4 text-secondary">
            {interpolate(copy.disclaimer, {
              orderNumber: order.orderNumber,
              email: customer.email,
            })}
          </Text>
        </>
      }
    >
      <Section className="email-pad px-6 pb-2 pt-7">
        <Text className="m-0 mb-2 text-[11px] font-bold uppercase tracking-[0.12em] text-primary">
          {copy.statusEyebrow}
        </Text>
        <Text className="email-hero-title m-0 mb-2 text-[26px] font-bold leading-8 text-foreground">
          {interpolate(copy.heroTitle, { name: customer.name })}
        </Text>
        <Text className="m-0 text-[15px] leading-6 text-muted-foreground">
          {copy.heroCopy}
        </Text>
      </Section>

      <Section className="email-pad px-6 pt-5">
        <Row>
          <Column className="stack-col stack-col-gap w-1/2 align-top pr-3">
            <Text className="m-0 mb-1 text-[11px] font-semibold uppercase tracking-[0.06em] text-secondary">
              {copy.orderNumber}
            </Text>
            <Text className="m-0 text-[15px] font-semibold leading-[22px] text-foreground">
              #{order.orderNumber}
            </Text>
          </Column>
          <Column className="stack-col w-1/2 align-top">
            <Text className="m-0 mb-1 text-[11px] font-semibold uppercase tracking-[0.06em] text-secondary">
              {copy.orderDate}
            </Text>
            <Text className="m-0 text-[15px] font-semibold leading-[22px] text-foreground">
              {order.orderDate}
            </Text>
          </Column>
        </Row>
      </Section>

      <Section className="email-pad px-6 pb-2 pt-6">
        <Button
          className="cta-btn box-border block w-full rounded-lg bg-primary px-6 py-3.5 text-center text-[15px] font-semibold leading-5 text-primary-foreground no-underline"
          href={links.viewOrder}
        >
          {copy.viewOrder}
        </Button>
      </Section>

      <Hr className="mx-6 my-6 border-0 border-t border-solid border-border" />

      <Section className="email-pad px-6">
        <Text className="m-0 mb-3 text-[13px] font-bold uppercase tracking-[0.06em] text-primary">
          {copy.items}
        </Text>

        {items.map((item, index) => (
          <Row
            key={index}
            className={
              index === items.length - 1
                ? ""
                : "border-0 border-b border-solid border-border"
            }
          >
            <Column className="w-[68px] align-top py-3 pr-3">
              {item.imageUrl ? (
                <Img
                  src={item.imageUrl}
                  alt={item.productName}
                  width="56"
                  height="56"
                  className="block h-14 w-14 rounded-lg border border-solid border-border bg-muted object-cover"
                />
              ) : (
                <Section className="h-14 w-14 rounded-lg border border-solid border-border bg-muted" />
              )}
            </Column>
            <Column className="align-top py-3 pr-2">
              <Text className="m-0 mb-1 text-[14px] font-semibold leading-5 text-foreground">
                {item.productName}
              </Text>
              {item.variantName ? (
                <Text className="m-0 mb-0.5 text-[13px] leading-[18px] text-muted-foreground">
                  {item.variantName}
                </Text>
              ) : null}
              {item.sellerName ? (
                <Text className="m-0 mb-0.5 text-[13px] leading-[18px] text-muted-foreground">
                  {interpolate(copy.soldBy, { sellerName: item.sellerName })}
                </Text>
              ) : null}
              <Text className="m-0 text-[13px] leading-[18px] text-muted-foreground">
                {interpolate(copy.qty, {
                  quantity: item.quantity,
                  unitPrice: item.unitPrice,
                })}
              </Text>
            </Column>
            <Column className="item-price-col w-24 align-top py-3 text-right">
              <Text className="m-0 text-[14px] font-semibold leading-5 text-foreground">
                {item.lineTotal}
              </Text>
            </Column>
          </Row>
        ))}
      </Section>

      {/* Outer pad + inner box: email Sections are 100% tables, so mx-* overflows the card. */}
      <Section className="email-pad mt-5 px-6">
        <Section className="w-full rounded-[10px] border border-solid border-border bg-muted px-5 py-4">
          <Row>
            <Column>
              <Text className="m-0 mb-2 text-[14px] leading-5 text-muted-foreground">
                {copy.subtotal}
              </Text>
            </Column>
            <Column className="w-[40%] text-right align-top">
              <Text className="m-0 mb-2 whitespace-nowrap text-[14px] leading-5 text-foreground">
                {pricing.subtotal}
              </Text>
            </Column>
          </Row>
          <Row>
            <Column>
              <Text className="m-0 mb-2 text-[14px] leading-5 text-muted-foreground">
                {copy.shipping}
              </Text>
            </Column>
            <Column className="w-[40%] text-right align-top">
              <Text className="m-0 mb-2 whitespace-nowrap text-[14px] leading-5 text-foreground">
                {pricing.shipping}
              </Text>
            </Column>
          </Row>
          {hasDiscount ? (
            <Row>
              <Column>
                <Text className="m-0 mb-2 text-[14px] leading-5 text-muted-foreground">
                  {pricing.couponCode
                    ? interpolate(copy.discountWithCoupon, {
                        couponCode: pricing.couponCode,
                      })
                    : copy.discount}
                </Text>
              </Column>
              <Column className="w-[40%] text-right align-top">
                <Text className="m-0 mb-2 whitespace-nowrap text-[14px] leading-5 text-success">
                  -{pricing.discount}
                </Text>
              </Column>
            </Row>
          ) : null}
          <Hr className="mb-3 mt-1 border-0 border-t border-solid border-border" />
          <Row>
            <Column>
              <Text className="m-0 text-[15px] font-bold leading-[22px] text-foreground">
                {copy.total}
              </Text>
            </Column>
            <Column className="w-[40%] text-right align-top">
              <Text className="m-0 whitespace-nowrap text-[16px] font-bold leading-[22px] text-primary">
                {pricing.total}
              </Text>
            </Column>
          </Row>
        </Section>
      </Section>

      {hasDetails ? (
        <>
          <Hr className="mx-6 my-6 border-0 border-t border-solid border-border" />
          <Section className="email-pad px-6">
            <Row>
              {shippingAddress ? (
                <Column
                  className={
                    order.estimatedDelivery || paymentMethod
                      ? "stack-col stack-col-gap w-1/2 align-top pr-4"
                      : "stack-col w-full align-top"
                  }
                >
                  <Text className="m-0 mb-3 text-[13px] font-bold uppercase tracking-[0.06em] text-primary">
                    {copy.shippingTo}
                  </Text>
                  <Text className="m-0 text-[14px] leading-[22px] text-foreground">
                    {shippingAddress.fullName}
                    <br />
                    {shippingAddress.addressLine1}
                    {shippingAddress.addressLine2 ? (
                      <>
                        <br />
                        {shippingAddress.addressLine2}
                      </>
                    ) : null}
                    <br />
                    {shippingAddress.city}, {shippingAddress.state}
                    {shippingAddress.postalCode
                      ? ` ${shippingAddress.postalCode}`
                      : ""}
                    <br />
                    {shippingAddress.country}
                    {shippingAddress.phone ? (
                      <>
                        <br />
                        {shippingAddress.phone}
                      </>
                    ) : null}
                  </Text>
                </Column>
              ) : null}

              {order.estimatedDelivery || paymentMethod ? (
                <Column className="stack-col w-1/2 align-top">
                  {order.estimatedDelivery ? (
                    <>
                      <Text className="m-0 mb-3 text-[13px] font-bold uppercase tracking-[0.06em] text-primary">
                        {copy.estimatedDelivery}
                      </Text>
                      <Text className="m-0 text-[14px] leading-[22px] text-foreground">
                        {order.estimatedDelivery}
                      </Text>
                    </>
                  ) : null}
                  {paymentMethod ? (
                    <>
                      <Text
                        className={
                          order.estimatedDelivery
                            ? "mb-3 mt-5 text-[13px] font-bold uppercase tracking-[0.06em] text-primary"
                            : "m-0 mb-3 text-[13px] font-bold uppercase tracking-[0.06em] text-primary"
                        }
                      >
                        {copy.payment}
                      </Text>
                      <Text className="m-0 text-[14px] leading-[22px] text-foreground">
                        {paymentMethod}
                      </Text>
                    </>
                  ) : null}
                </Column>
              ) : null}
            </Row>
          </Section>
        </>
      ) : null}
    </EmailLayout>
  );
};

export default OrderConfirmationEmail;
