import type { ReactNode } from "react";
import {
  Body,
  Container,
  Head,
  Hr,
  Html,
  Link,
  Preview,
  Section,
  Tailwind,
  Text,
} from "@react-email/components";
import { getEmailMessages, interpolate } from "../i18n/index.js";
import type { EmailLocale } from "../i18n/locale.js";
import { isRtlLocale } from "../i18n/locale.js";
import { emailTailwind } from "../theme/tailwind.js";
import { EMAIL_CONTACT, EMAIL_SITE_URL, emailFont } from "../theme/tokens.js";

export interface EmailLayoutProps {
  locale?: EmailLocale;
  preview: string;
  children: ReactNode;
  footerIntro?: ReactNode;
  /** Default contact line. Disable when the template already includes support copy. */
  showContactLine?: boolean;
}

const mobileCss = `
  :root { color-scheme: light; }
  @media only screen and (max-width: 600px) {
    .email-body {
      padding: 0 !important;
      background-color: #ffffff !important;
    }
    .email-shell {
      width: 100% !important;
      max-width: 100% !important;
      padding: 0 !important;
    }
    .email-card {
      border-radius: 0 !important;
      border-left: none !important;
      border-right: none !important;
    }
    .email-pad {
      padding-left: 16px !important;
      padding-right: 16px !important;
    }
    .stack-col {
      display: block !important;
      width: 100% !important;
      max-width: 100% !important;
    }
    .stack-col-gap {
      padding-bottom: 16px !important;
      padding-right: 0 !important;
      padding-left: 0 !important;
    }
    .item-price-col {
      display: block !important;
      width: 100% !important;
      text-align: start !important;
      padding-top: 0 !important;
    }
    .cta-btn {
      display: block !important;
      width: 100% !important;
      box-sizing: border-box !important;
    }
  }
`;

export function EmailLayout({
  locale = "en",
  preview,
  children,
  footerIntro,
  showContactLine = true,
}: EmailLayoutProps) {
  const dir = isRtlLocale(locale) ? "rtl" : "ltr";
  const copy = getEmailMessages(locale).common;
  const year = new Date().getFullYear();

  return (
    <Html lang={locale} dir={dir}>
      <Tailwind config={emailTailwind}>
        <Head>
          <meta name="viewport" content="width=device-width, initial-scale=1" />
          <meta name="color-scheme" content="light" />
          <meta name="supported-color-schemes" content="light" />
          <style>{mobileCss}</style>
        </Head>
        <Preview>{preview}</Preview>
        <Body
          className="email-body m-0 bg-background px-3 py-6 text-foreground"
          style={{
            fontFamily: isRtlLocale(locale) ? emailFont.arabic : emailFont.sans,
          }}
        >
          <Container className="email-shell mx-auto w-full max-w-[560px]">
            <Section className="email-card overflow-hidden rounded-[10px] border border-solid border-border bg-card">
              <Section className="bg-primary px-6 py-[18px] text-center">
                <Text className="m-0 text-[20px] font-bold uppercase leading-6 tracking-[0.08em] text-primary-foreground">
                  Tallaby
                </Text>
              </Section>
              <Section className="bg-accent leading-[4px]">
                <Text className="m-0 text-[4px] leading-[4px] text-accent">
                  &nbsp;
                </Text>
              </Section>

              {children}

              <Hr className="mx-6 my-6 border-0 border-t border-solid border-border" />

              <Section className="email-pad px-6 pb-7">
                {footerIntro}
                <Text className="mb-2 mt-4 text-[12px] leading-[18px] text-muted-foreground">
                  {interpolate(copy.copyright, { year })}
                  {" · "}
                  <Link
                    href={`${EMAIL_SITE_URL}/privacy`}
                    className="text-primary underline"
                  >
                    {copy.privacy}
                  </Link>
                  {" · "}
                  <Link
                    href={`${EMAIL_SITE_URL}/terms`}
                    className="text-primary underline"
                  >
                    {copy.terms}
                  </Link>
                </Text>
                {showContactLine ? (
                  <Text className="m-0 text-[13px] leading-5 text-muted-foreground">
                    {copy.contactPrefix}{" "}
                    <Link
                      href={`mailto:${EMAIL_CONTACT}`}
                      className="text-primary underline"
                    >
                      {EMAIL_CONTACT}
                    </Link>
                  </Text>
                ) : null}
              </Section>
            </Section>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
}
