import {
  Body,
  Button,
  Container,
  Head,
  Hr,
  Html,
  Link,
  Preview,
  Section,
  Text,
} from "@react-email/components";
import React from "react";

const TALLABY_CONTACT_EMAIL = "tallabycommerce@gmail.com";

interface DigitalDeliveryItem {
  productName: string;
  downloadUrl: string;
  licenseKey?: string | null;
  expiresAt?: string | null;
  maxDownloads?: number | null;
}

interface DigitalDeliveryEmailProps {
  customerName?: string;
  orderNumber?: string;
  items?: DigitalDeliveryItem[];
}

export const DigitalDeliveryEmail = ({
  customerName = "there",
  orderNumber = "",
  items = [],
}: DigitalDeliveryEmailProps) => {
  return (
    <Html>
      <Head />
      <Preview>Your digital order {orderNumber} is ready — access it now</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={headerSection}>
            <img
              src="https://www.tallaby.com/favicon.ico?favicon.668f7262.ico"
              alt="Tallaby Logo"
              style={{ width: "110px", height: "auto", margin: "0 auto", display: "block" }}
            />
          </Section>

          <Section style={contentSection}>
            <Text style={greeting}>Hi {customerName},</Text>
            <Text style={bodyText}>
              Your digital order <strong>#{orderNumber}</strong> is ready. Your download links
              and access details are below.
            </Text>
          </Section>

          {items.map((item, index) => (
            <Section style={itemBox} key={index}>
              <Text style={itemTitle}>{item.productName}</Text>
              {item.licenseKey && (
                <Text style={codeText}>
                  License key: <strong>{item.licenseKey}</strong>
                </Text>
              )}
              <Button style={primaryButton} href={item.downloadUrl}>
                Access / Download
              </Button>
              <Text style={metaText}>
                {item.maxDownloads ? `Up to ${item.maxDownloads} downloads. ` : ""}
                {item.expiresAt
                  ? `Link expires ${new Date(item.expiresAt).toLocaleDateString()}.`
                  : "No expiration."}
              </Text>
            </Section>
          ))}

          <Hr style={divider} />

          <Section style={footerSection}>
            <Text style={footerText}>
              You can always find your purchases under{" "}
              <Link href="https://www.tallaby.com/profile/downloads" style={footerLink}>
                My Digital Products
              </Link>
              .
            </Text>
            <Text style={footerText}>
              Questions? Contact us at{" "}
              <Link href={`mailto:${TALLABY_CONTACT_EMAIL}`} style={footerLink}>
                {TALLABY_CONTACT_EMAIL}
              </Link>
            </Text>
            <Text style={copyright}>© 2026 Tallaby. All rights reserved.</Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
};

const main = {
  backgroundColor: "#faf9f7",
  fontFamily:
    '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
  color: "#3d3d3d",
};

const container = { margin: "0 auto", padding: "20px 0", maxWidth: "600px" };
const headerSection = { padding: "32px 24px 24px", textAlign: "center" as const };
const contentSection = { padding: "8px 24px 16px" };
const greeting = { fontSize: "20px", fontWeight: "600", margin: "0 0 16px 0", color: "#2a2a2a" };
const bodyText = { fontSize: "16px", lineHeight: "1.6", margin: "0 0 16px 0", color: "#555" };
const itemBox = {
  backgroundColor: "#fff5f0",
  padding: "24px",
  borderRadius: "12px",
  border: "2px solid #f0d5cc",
  margin: "0 24px 16px",
  textAlign: "center" as const,
};
const itemTitle = { fontSize: "18px", fontWeight: "700", margin: "0 0 12px 0", color: "#2a2a2a" };
const codeText = {
  fontSize: "14px",
  color: "#3d3d3d",
  margin: "0 0 16px 0",
  padding: "12px",
  backgroundColor: "#ffffff",
  borderRadius: "6px",
  fontFamily: "monospace",
};
const primaryButton = {
  backgroundColor: "#2a2a2a",
  color: "#ffffff",
  fontSize: "15px",
  fontWeight: "600",
  textDecoration: "none",
  textAlign: "center" as const,
  display: "block",
  borderRadius: "6px",
  paddingTop: "12px",
  paddingBottom: "12px",
};
const metaText = { fontSize: "12px", color: "#8b7355", margin: "12px 0 0 0" };
const divider = { borderTop: "1px solid #e0dbd5", margin: "16px 24px" };
const footerSection = { padding: "16px 24px 32px", textAlign: "center" as const };
const footerText = { fontSize: "13px", color: "#8b7355", margin: "8px 0" };
const footerLink = { color: "#d97757", textDecoration: "none" };
const copyright = { fontSize: "11px", color: "#a0a0a0", margin: "16px 0 0 0" };
