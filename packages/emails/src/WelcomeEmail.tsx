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

const TALLABY_CONTACT_EMAIL = "tallabycommerce@gmail.com";

const EMAIL_SOCIAL_LINKS = [
  {
    label: "Facebook",
    href: "https://www.facebook.com/usetallaby",
    icon: "https://cdn.simpleicons.org/facebook/ffffff",
    backgroundColor: "#1877F2",
  },
  {
    label: "Instagram",
    href: "https://www.instagram.com/usetallaby",
    icon: "https://cdn.simpleicons.org/instagram/ffffff",
    backgroundColor: "#E4405F",
  },
  {
    label: "YouTube",
    href: "https://www.youtube.com/@usetallaby",
    icon: "https://cdn.simpleicons.org/youtube/ffffff",
    backgroundColor: "#FF0000",
  },
  {
    label: "X",
    href: "https://x.com/usetallaby",
    icon: "https://cdn.simpleicons.org/x/ffffff",
    backgroundColor: "#000000",
  },
  {
    label: "Threads",
    href: "https://www.threads.com/@usetallaby",
    icon: "https://cdn.simpleicons.org/threads/ffffff",
    backgroundColor: "#000000",
  },
  {
    label: "TikTok",
    href: "https://www.tiktok.com/@tallaby_",
    icon: "https://cdn.simpleicons.org/tiktok/ffffff",
    backgroundColor: "#000000",
  },
] as const;

const socialLinks = {
  margin: "0 0 24px 0",
  textAlign: "center" as const,
};

const socialIconColumn = {
  width: "48px",
  padding: "0 4px",
};

const socialIconLink = {
  textDecoration: "none",
};

const socialIconBadge = {
  display: "inline-block",
  width: "40px",
  height: "40px",
  borderRadius: "9999px",
  lineHeight: "40px",
  textAlign: "center" as const,
};

const socialIconImage = {
  display: "inline-block",
  margin: "10px auto 0",
};

interface WelcomeEmailProps {
  customerName?: string;
  discountCode?: string;
  discountPercent?: number;
}

export const WelcomeEmail = ({
  customerName = "Friend",
  discountCode = "WELCOME10",
  discountPercent = 10,
}: WelcomeEmailProps) => {
  return (
    <Html>
      <Head />
      <Preview>
        Welcome to Tallaby! Discover curated collections & enjoy free delivery
        on your first order.
      </Preview>
      <Body style={main}>
        <Container style={container}>
          {/* Header Section */}
          <Section style={headerSection}>
            <img
              src="https://www.tallaby.com/favicon.ico?favicon.668f7262.ico"
              alt="Tallaby Logo"
              style={{
                width: "110px",
                height: "auto",
                display: "block",
                margin: "0 auto",
              }}
            />
          </Section>

          {/* Hero Section */}
          <Section style={heroSection}>
            <Text style={heroHeading}>
              Welcome to
              <img
                src="https://www.tallaby.com/logo.white.png"
                alt="Tallaby Logo"
                style={{
                  width: "110px",
                  height: "auto",
                  display: "block",
                  margin: "4px auto",
                }}
              />
            </Text>
            <Text style={heroSubheading}>
              Discover Carefully Curated Collections
            </Text>
          </Section>

          {/* Welcome Message */}
          <Section style={contentSection}>
            <Text style={greeting}>Hi {customerName},</Text>
            <Text style={bodyText}>
              We're thrilled to have you join the Tallaby community! From
              timeless essentials to unique statement pieces, we curate
              collections that celebrate your individual style.
            </Text>
            <Text style={bodyText}>
              Whether you're looking for everyday staples or something special,
              we've got you covered.
            </Text>
          </Section>

          {/* Discount Offer */}
          <Section style={offerSection}>
            <Section style={offerBox}>
              <Text style={offerLabel}>Exclusive First-Time Offer</Text>
              <Text style={discountAmount}>{discountPercent}% OFF</Text>
              <Text style={offerDescription}>Your first purchase</Text>
              <Text style={codeText}>
                Use code: <strong>{discountCode}</strong>
              </Text>
            </Section>
          </Section>

          {/* CTA Buttons */}
          <Section style={ctaSection}>
            <Row>
              <Button style={primaryButton} href="https://www.tallaby.com/">
                Shop Now
              </Button>
            </Row>
          </Section>

          {/* Featured Collections */}

          {/* Benefits Section */}
          <Section>
            <Section style={benefitItem}>
              <Text style={benefitIcon}>🚚</Text>
              <Text style={benefitTitle}>Fast Shipping</Text>
            </Section>
            <Section style={benefitItem}>
              <Text style={benefitIcon}>↩️</Text>
              <Text style={benefitTitle}>Easy Returns</Text>
            </Section>
            <Section style={benefitItem}>
              <Text style={benefitIcon}>🔒</Text>
              <Text style={benefitTitle}>Secure</Text>
            </Section>
          </Section>

          <Hr style={divider} />

          {/* Footer Section */}
          <Section style={footerSection}>
            <Text style={footerTitle}>Connect With Us</Text>
            <Row style={socialLinks}>
              {EMAIL_SOCIAL_LINKS.map((social) => (
                <Column key={social.label} style={socialIconColumn}>
                  <Link href={social.href} style={socialIconLink}>
                    <span
                      style={{
                        ...socialIconBadge,
                        backgroundColor: social.backgroundColor,
                      }}
                    >
                      <Img
                        src={social.icon}
                        alt={social.label}
                        width="20"
                        height="20"
                        style={socialIconImage}
                      />
                    </span>
                  </Link>
                </Column>
              ))}
            </Row>

            <Text style={footerText}>
              Questions? Contact us at{" "}
              <Link href={`mailto:${TALLABY_CONTACT_EMAIL}`} style={footerLink}>
                {TALLABY_CONTACT_EMAIL}
              </Link>
            </Text>

            <Text style={copyright}>
              © 2026 Tallaby. All rights reserved. |{" "}
              <Link href="https://tallaby.com/privacy" style={footerLink}>
                Privacy Policy
              </Link>{" "}
              |{" "}
              <Link href="https://tallaby.com/terms" style={footerLink}>
                Terms & Conditions
              </Link>
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
};

// Styles
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
};

const headerSection = {
  padding: "32px 24px 24px",
  textAlign: "center" as const,
};

const logoText = {
  fontSize: "32px",
  fontWeight: "600",
  margin: "0",
  color: "#2a2a2a",
};

const heroSection = {
  padding: "48px 24px",
  textAlign: "center" as const,
  backgroundColor: "#f3e8e0",
  borderRadius: "12px",
  margin: "0 16px",
};

const heroHeading = {
  fontSize: "30px",
  fontWeight: "700",
  margin: "0 0 12px 0",
  color: "#2a2a2a",
  lineHeight: "1.3",
};

const heroSubheading = {
  fontSize: "18px",
  color: "#8b7355",
  margin: "0",
  fontWeight: "400",
};

const contentSection = {
  padding: "32px 24px",
};

const greeting = {
  fontSize: "20px",
  fontWeight: "600",
  margin: "0 0 16px 0",
  color: "#2a2a2a",
};

const bodyText = {
  fontSize: "16px",
  lineHeight: "1.6",
  margin: "0 0 16px 0",
  color: "#555",
};

const offerSection = {
  padding: "24px 16px",
};

const offerBox = {
  backgroundColor: "#fff5f0",
  padding: "32px 24px",
  borderRadius: "12px",
  textAlign: "center" as const,
  border: "2px solid #f0d5cc",
};

const offerLabel = {
  fontSize: "12px",
  fontWeight: "700",
  textTransform: "uppercase" as const,
  color: "#b8885f",
  margin: "0 0 12px 0",
  letterSpacing: "1px",
};

const discountAmount = {
  fontSize: "48px",
  fontWeight: "700",
  margin: "0",
  color: "#d97757",
  lineHeight: "1.2",
};

const offerDescription = {
  fontSize: "14px",
  color: "#8b7355",
  margin: "8px 0 20px 0",
};

const codeText = {
  fontSize: "14px",
  color: "#3d3d3d",
  margin: "0",
  padding: "12px",
  backgroundColor: "#ffffff",
  borderRadius: "6px",
  fontFamily: "monospace",
};

const ctaSection = {
  padding: "32px 24px",
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

const secondaryButton = {
  backgroundColor: "#f3e8e0",
  color: "#2a2a2a",
  fontSize: "16px",
  fontWeight: "600",
  textDecoration: "none",
  textAlign: "center" as const,
  display: "block",
  borderRadius: "6px",
  paddingTop: "12px",
  paddingBottom: "12px",
};

const collectionsSection = {
  padding: "32px 24px",
};

const sectionTitle = {
  fontSize: "20px",
  fontWeight: "600",
  margin: "0 0 24px 0",
  color: "#2a2a2a",
};

const collectionCard = {
  backgroundColor: "#ffffff",
  padding: "20px 16px",
  borderRadius: "8px",
  textAlign: "center" as const,
  border: "1px solid #f0ebe5",
  width: "46%",
};

const collectionName = {
  fontSize: "16px",
  fontWeight: "600",
  margin: "0 0 8px 0",
  color: "#2a2a2a",
};

const collectionDesc = {
  fontSize: "13px",
  color: "#8b7355",
  margin: "0",
};

const benefitsSection = {
  padding: "32px 24px",
};

const benefitItem = {
  display: "inline",
  textAlign: "center" as const,
  padding: "16px 20px",
};

const benefitIcon = {
  fontSize: "32px",
  display: "block",
  margin: "0 0 8px 0",
};

const benefitTitle = {
  fontSize: "14px",
  fontWeight: "600",
  margin: "0 0 4px 0",
  color: "#2a2a2a",
};

const benefitText = {
  fontSize: "12px",
  color: "#8b7355",
  margin: "0",
};

const divider = {
  borderTop: "1px solid #e0dbd5",
  margin: "32px 24px",
};

const footerSection = {
  padding: "32px 24px",
  textAlign: "center" as const,
};

const footerTitle = {
  fontSize: "16px",
  fontWeight: "600",
  margin: "0 0 16px 0",
  color: "#2a2a2a",
};

const footerText = {
  fontSize: "13px",
  color: "#8b7355",
  margin: "16px 0",
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
