import {
  Body,
  Button,
  Column,
  Container,
  Head,
  Hr,
  Html,
  Img,
  Link,
  Preview,
  Row,
  Section,
  Text,
} from "@react-email/components";
import React from "react";

const TALLABY_CONTACT_EMAIL = "tallabycommerce@gmail.com";
const TALLABY_SITE_URL = "https://www.tallaby.com";

/**
 * Customer-facing order data for the confirmation email. Everything is
 * pre-formatted by the caller (prices as display strings, dates as localized
 * strings) so the template stays presentation-only and never has to guess at
 * currency or locale rules.
 */
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
}

const previewText = (orderNumber: string, total: string) =>
  `Order ${orderNumber} confirmed — ${total}. We'll email you again when it ships.`;

export const OrderConfirmationEmail = ({
  customer,
  order,
  items = [],
  pricing,
  paymentMethod,
  shippingAddress,
  links,
}: OrderConfirmationEmailProps) => {
  const hasDiscount = Boolean(pricing.discount);

  return (
    <Html>
      <Head />
      <Preview>{previewText(order.orderNumber, pricing.total)}</Preview>
      <Body style={main}>
        <Container style={container}>
          {/* Brand header */}
          <Section style={headerSection}>
            <Img
              src={`${TALLABY_SITE_URL}/favicon.ico?favicon.668f7262.ico`}
              alt="Tallaby"
              width="110"
              style={logo}
            />
          </Section>

          {/* Confirmation hero */}
          <Section style={heroSection}>
            <Text style={heroBadge}>✓ Thank you for your order</Text>
            <Text style={heroHeading}>Order Confirmed</Text>
            <Text style={heroSubheading}>
              Hi {customer.name}, we&apos;ve received your order and are getting
              it ready.
            </Text>
          </Section>

          {/* Order meta */}
          <Section style={metaSection}>
            <Row>
              <Column style={metaColumn}>
                <Text style={metaLabel}>Order number</Text>
                <Text style={metaValue}>#{order.orderNumber}</Text>
              </Column>
              <Column style={metaColumn}>
                <Text style={metaLabel}>Order date</Text>
                <Text style={metaValue}>{order.orderDate}</Text>
              </Column>
            </Row>
          </Section>

          {/* Primary CTA */}
          <Section style={ctaSection}>
            <Button style={primaryButton} href={links.viewOrder}>
              View Your Order
            </Button>
          </Section>

          <Hr style={divider} />

          {/* Items */}
          <Section style={contentSection}>
            <Text style={sectionTitle}>Order summary</Text>

            {items.map((item, index) => (
              <Row key={index} style={index === 0 ? itemRowFirst : itemRow}>
                {item.imageUrl ? (
                  <Column style={itemImageColumn}>
                    <Img
                      src={item.imageUrl}
                      alt={item.productName}
                      width="64"
                      height="64"
                      style={itemImage}
                    />
                  </Column>
                ) : null}
                <Column style={itemDetailsColumn}>
                  <Text style={itemName}>{item.productName}</Text>
                  {item.variantName ? (
                    <Text style={itemMeta}>{item.variantName}</Text>
                  ) : null}
                  {item.sellerName ? (
                    <Text style={itemMeta}>Sold by {item.sellerName}</Text>
                  ) : null}
                  <Text style={itemMeta}>
                    Qty {item.quantity} &times; {item.unitPrice}
                  </Text>
                </Column>
                <Column style={itemPriceColumn}>
                  <Text style={itemPrice}>{item.lineTotal}</Text>
                </Column>
              </Row>
            ))}
          </Section>

          {/* Totals */}
          <Section style={totalsSection}>
            <Row style={totalsRow}>
              <Column style={totalsLabelColumn}>
                <Text style={totalsLabel}>Subtotal</Text>
              </Column>
              <Column style={totalsValueColumn}>
                <Text style={totalsValue}>{pricing.subtotal}</Text>
              </Column>
            </Row>
            <Row style={totalsRow}>
              <Column style={totalsLabelColumn}>
                <Text style={totalsLabel}>Shipping</Text>
              </Column>
              <Column style={totalsValueColumn}>
                <Text style={totalsValue}>{pricing.shipping}</Text>
              </Column>
            </Row>
            {hasDiscount ? (
              <Row style={totalsRow}>
                <Column style={totalsLabelColumn}>
                  <Text style={totalsLabel}>
                    Discount
                    {pricing.couponCode ? ` (${pricing.couponCode})` : ""}
                  </Text>
                </Column>
                <Column style={totalsValueColumn}>
                  <Text style={discountValue}>-{pricing.discount}</Text>
                </Column>
              </Row>
            ) : null}
            <Row>
              <Column style={totalsLabelColumn}>
                <Text style={grandTotalLabel}>Total</Text>
              </Column>
              <Column style={totalsValueColumn}>
                <Text style={grandTotalValue}>{pricing.total}</Text>
              </Column>
            </Row>
          </Section>

          {/* Delivery + payment details */}
          {shippingAddress ? (
            <Section style={contentSection}>
              <Text style={sectionTitle}>Shipping to</Text>
              <Text style={addressText}>
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
            </Section>
          ) : null}

          {order.estimatedDelivery || paymentMethod ? (
            <Section style={detailsBox}>
              {order.estimatedDelivery ? (
                <>
                  <Text style={detailsLabel}>Estimated delivery</Text>
                  <Text style={detailsValue}>{order.estimatedDelivery}</Text>
                </>
              ) : null}
              {paymentMethod ? (
                <>
                  <Text style={detailsLabel}>Payment method</Text>
                  <Text style={detailsValueLast}>{paymentMethod}</Text>
                </>
              ) : null}
            </Section>
          ) : null}

          <Hr style={divider} />

          {/* Support + footer */}
          <Section style={footerSection}>
            <Text style={footerHeading}>Need help with this order?</Text>
            <Text style={footerText}>
              Reply to this email or reach our support team at{" "}
              <Link href={`mailto:${TALLABY_CONTACT_EMAIL}`} style={footerLink}>
                {TALLABY_CONTACT_EMAIL}
              </Link>
              . You can track this order any time from{" "}
              <Link href={links.viewOrder} style={footerLink}>
                your order page
              </Link>
              .
            </Text>
            <Text style={copyright}>
              © 2026 Tallaby. All rights reserved. |{" "}
              <Link href={`${TALLABY_SITE_URL}/privacy`} style={footerLink}>
                Privacy Policy
              </Link>{" "}
              |{" "}
              <Link href={`${TALLABY_SITE_URL}/terms`} style={footerLink}>
                Terms &amp; Conditions
              </Link>
            </Text>
            <Text style={disclaimer}>
              This is a transactional confirmation for order #
              {order.orderNumber}, sent to {customer.email}.
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
};

export default OrderConfirmationEmail;

// Styles — mirrors the Tallaby email design system used by the other templates.
const main = {
  backgroundColor: "#faf9f7",
  fontFamily:
    '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
  color: "#3d3d3d",
};

const container = {
  margin: "0 auto",
  padding: "20px 0",
  maxWidth: "600px",
  width: "100%",
};

const headerSection = {
  padding: "32px 24px 16px",
  textAlign: "center" as const,
};

const logo = {
  width: "110px",
  height: "auto",
  display: "block",
  margin: "0 auto",
};

const heroSection = {
  padding: "32px 24px",
  textAlign: "center" as const,
  backgroundColor: "#f3e8e0",
  borderRadius: "12px",
  margin: "0 16px",
};

const heroBadge = {
  fontSize: "12px",
  fontWeight: "700",
  textTransform: "uppercase" as const,
  letterSpacing: "1px",
  color: "#b8885f",
  margin: "0 0 12px 0",
};

const heroHeading = {
  fontSize: "30px",
  fontWeight: "700",
  margin: "0 0 12px 0",
  color: "#2a2a2a",
  lineHeight: "1.3",
};

const heroSubheading = {
  fontSize: "16px",
  color: "#8b7355",
  margin: "0",
  lineHeight: "1.6",
};

const metaSection = {
  padding: "24px 24px 8px",
};

const metaColumn = {
  width: "50%",
  verticalAlign: "top" as const,
  paddingRight: "8px",
};

const metaLabel = {
  fontSize: "11px",
  fontWeight: "700",
  textTransform: "uppercase" as const,
  letterSpacing: "0.6px",
  color: "#8b7355",
  margin: "0 0 4px 0",
};

const metaValue = {
  fontSize: "15px",
  fontWeight: "600",
  color: "#2a2a2a",
  margin: "0",
};

const ctaSection = {
  padding: "20px 24px 8px",
  textAlign: "center" as const,
};

const primaryButton = {
  backgroundColor: "#2a2a2a",
  color: "#ffffff",
  fontSize: "16px",
  fontWeight: "600",
  textDecoration: "none",
  textAlign: "center" as const,
  display: "block",
  borderRadius: "6px",
  paddingTop: "12px",
  paddingBottom: "12px",
};

const divider = {
  borderTop: "1px solid #e0dbd5",
  margin: "24px",
};

const contentSection = {
  padding: "0 24px",
};

const sectionTitle = {
  fontSize: "16px",
  fontWeight: "700",
  margin: "0 0 16px 0",
  color: "#2a2a2a",
};

const itemRowBase = {
  borderTop: "1px solid #f0ebe5",
};

const itemRowFirst = {
  ...itemRowBase,
  borderTop: "none",
};

const itemRow = itemRowBase;

const itemImageColumn = {
  width: "76px",
  verticalAlign: "top" as const,
  paddingTop: "16px",
  paddingBottom: "16px",
};

const itemImage = {
  width: "64px",
  height: "64px",
  borderRadius: "8px",
  border: "1px solid #f0ebe5",
  objectFit: "cover" as const,
  backgroundColor: "#ffffff",
};

const itemDetailsColumn = {
  verticalAlign: "top" as const,
  paddingTop: "16px",
  paddingBottom: "16px",
  paddingRight: "8px",
};

const itemName = {
  fontSize: "15px",
  fontWeight: "600",
  color: "#2a2a2a",
  margin: "0 0 4px 0",
  lineHeight: "1.4",
};

const itemMeta = {
  fontSize: "13px",
  color: "#8b7355",
  margin: "0 0 2px 0",
  lineHeight: "1.4",
};

const itemPriceColumn = {
  width: "90px",
  verticalAlign: "top" as const,
  textAlign: "right" as const,
  paddingTop: "16px",
  paddingBottom: "16px",
};

const itemPrice = {
  fontSize: "15px",
  fontWeight: "600",
  color: "#2a2a2a",
  margin: "0",
  whiteSpace: "nowrap" as const,
};

const totalsSection = {
  backgroundColor: "#fff5f0",
  border: "1px solid #f0d5cc",
  borderRadius: "12px",
  padding: "20px 24px",
  margin: "24px",
};

const totalsRow = {
  marginBottom: "4px",
};

const totalsLabelColumn = {
  verticalAlign: "top" as const,
};

const totalsValueColumn = {
  verticalAlign: "top" as const,
  textAlign: "right" as const,
  width: "40%",
};

const totalsLabel = {
  fontSize: "14px",
  color: "#8b7355",
  margin: "0 0 8px 0",
};

const totalsValue = {
  fontSize: "14px",
  color: "#3d3d3d",
  margin: "0 0 8px 0",
  whiteSpace: "nowrap" as const,
};

const discountValue = {
  ...totalsValue,
  color: "#2f8f5b",
};

const grandTotalLabel = {
  fontSize: "16px",
  fontWeight: "700",
  color: "#2a2a2a",
  margin: "8px 0 0 0",
  borderTop: "1px solid #f0d5cc",
  paddingTop: "12px",
};

const grandTotalValue = {
  fontSize: "18px",
  fontWeight: "700",
  color: "#d97757",
  margin: "8px 0 0 0",
  borderTop: "1px solid #f0d5cc",
  paddingTop: "12px",
  whiteSpace: "nowrap" as const,
};

const addressText = {
  fontSize: "14px",
  lineHeight: "1.7",
  color: "#555",
  margin: "0",
};

const detailsBox = {
  backgroundColor: "#ffffff",
  border: "1px solid #f0ebe5",
  borderRadius: "12px",
  padding: "20px 24px",
  margin: "24px",
};

const detailsLabel = {
  fontSize: "11px",
  fontWeight: "700",
  textTransform: "uppercase" as const,
  letterSpacing: "0.6px",
  color: "#8b7355",
  margin: "0 0 4px 0",
};

const detailsValue = {
  fontSize: "15px",
  fontWeight: "600",
  color: "#2a2a2a",
  margin: "0 0 16px 0",
};

const detailsValueLast = {
  ...detailsValue,
  margin: "0",
};

const footerSection = {
  padding: "0 24px 32px",
  textAlign: "center" as const,
};

const footerHeading = {
  fontSize: "15px",
  fontWeight: "600",
  color: "#2a2a2a",
  margin: "0 0 8px 0",
};

const footerText = {
  fontSize: "13px",
  color: "#8b7355",
  margin: "0 0 16px 0",
  lineHeight: "1.6",
};

const footerLink = {
  color: "#d97757",
  textDecoration: "none",
};

const copyright = {
  fontSize: "11px",
  color: "#a0a0a0",
  margin: "16px 0 0 0",
};

const disclaimer = {
  fontSize: "11px",
  color: "#b8b8b8",
  margin: "8px 0 0 0",
};
