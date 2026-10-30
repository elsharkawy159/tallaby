import { getEmailMessages, interpolate } from "./i18n/index.js";
import { PLATFORM_BRAND } from "./kit/brand.js";
import { Block, Callout, Cta, emailFrame, EmailShell, FooterLines, FooterLink, H1, type EmailFrame } from "./kit/components.js";
import { parsePlainText, type InlinePart } from "./kit/plain-text.js";
import type { BaseEmailProps } from "./kit/types.js";

export interface StoreCampaignProduct {
  name: string;
  imageUrl?: string | null | undefined;
  url: string;
}

export interface StoreCampaignEmailProps extends BaseEmailProps {
  storeName: string;
  /** 'campaign' (F-16a) or 'winback' (F-16e): picks the footer reason and default button. */
  kind?: "campaign" | "winback";
  subject: string;
  /** Seller text: paragraphs, line breaks, **bold**, "- " lists. Never HTML. */
  body: string;
  ctaLabel?: string | null | undefined;
  products?: StoreCampaignProduct[];
  links: { shop: string; unsubscribe: string };
  /** Test send to the seller: shows a small banner. */
  test?: boolean;
}

const BODY_COLOR = "#4a4a4a";
const INK = "#171717";

function Inline({ parts }: { parts: InlinePart[] }) {
  return (
    <>
      {parts.map((part, i) =>
        part.bold ? (
          <strong key={i} style={{ color: INK }}>
            {part.text}
          </strong>
        ) : (
          <span key={i}>{part.text}</span>
        ),
      )}
    </>
  );
}

function Body({ f, text }: { f: EmailFrame; text: string }) {
  const style = { textAlign: f.start, fontFamily: f.font, fontSize: 15, lineHeight: "28px", color: BODY_COLOR } as const;
  return (
    <>
      {parsePlainText(text).map((block, i) =>
        block.kind === "list" ? (
          <ul key={i} dir={f.dir} style={{ ...style, margin: "14px 0 0", padding: f.dir === "rtl" ? "0 22px 0 0" : "0 0 0 22px" }}>
            {block.items.map((item, j) => (
              <li key={j}>
                <Inline parts={item} />
              </li>
            ))}
          </ul>
        ) : (
          <div key={i} style={{ ...style, paddingTop: 14 }}>
            {block.lines.map((line, j) => (
              <span key={j}>
                {j > 0 ? <br /> : null}
                <Inline parts={line} />
              </span>
            ))}
          </div>
        ),
      )}
    </>
  );
}

function ProductCard({ f, product, label }: { f: EmailFrame; product: StoreCampaignProduct; label: string }) {
  const pad = f.dir === "rtl" ? "paddingLeft" : "paddingRight";
  return (
    <table role="presentation" width="100%" cellPadding={0} cellSpacing={0} border={0} dir={f.dir} style={{ marginTop: 18 }}>
      <tbody>
        <tr>
          <td width="84" valign="top" style={{ [pad]: 16 }}>
            <a href={product.url}>
              {product.imageUrl ? (
                <img
                  src={product.imageUrl}
                  width={68}
                  height={68}
                  alt={product.name}
                  style={{ display: "block", width: 68, height: 68, border: "1px solid #e5e5e5", borderRadius: 10, objectFit: "cover", background: "#f7f7f7" }}
                />
              ) : (
                <div style={{ width: 68, height: 68, border: "1px solid #e5e5e5", borderRadius: 10, background: "#f7f7f7" }} />
              )}
            </a>
          </td>
          <td valign="middle" style={{ textAlign: f.start, fontFamily: f.font }}>
            <div style={{ fontSize: 14, lineHeight: "24px", fontWeight: 600, color: INK }}>{product.name}</div>
            <a href={product.url} style={{ fontSize: 13, lineHeight: "22px", fontWeight: 700, color: f.brand.primary, textDecoration: "none" }}>
              {label}
            </a>
          </td>
        </tr>
      </tbody>
    </table>
  );
}

/**
 * Customer: a store's marketing email (F-16a) or win-back email (F-16e),
 * under the store's brand. The seller writes the subject and plain text;
 * the only links are the store's own (button, product cards) and the
 * unsubscribe link.
 */
export const StoreCampaignEmail = ({
  storeName,
  kind = "campaign",
  subject,
  body,
  ctaLabel,
  products = [],
  links,
  test = false,
  locale = "en",
  brand = PLATFORM_BRAND,
}: StoreCampaignEmailProps) => {
  const f = emailFrame(brand, locale);
  const messages = getEmailMessages(locale);
  const copy = messages.storeCampaign;
  const reason = kind === "winback" ? messages.winback.reason : copy.reason;
  const button = ctaLabel?.trim() || (kind === "winback" ? messages.winback.shop : copy.shop);
  const firstLine = body.split("\n").find((l) => l.trim())?.replace(/\*\*/g, "").trim() ?? "";

  return (
    <EmailShell
      f={f}
      audience="customer"
      title={subject}
      preview={firstLine.slice(0, 140)}
      footer={
        <FooterLines
          f={f}
          lead={
            <>
              {interpolate(reason, { store: storeName })} <FooterLink href={links.unsubscribe}>{copy.unsubscribe}</FooterLink>
            </>
          }
        />
      }
    >
      <Block f={f} padding="36px 32px 8px">
        {test ? (
          <Callout f={f} tone="warning" marginTop={0}>
            {copy.testBanner}
          </Callout>
        ) : null}
        <H1 f={f}>{subject}</H1>
        <Body f={f} text={body} />
      </Block>

      <Block f={f} padding="0 32px 32px" last>
        {products.map((product, i) => (
          <ProductCard key={i} f={f} product={product} label={copy.viewProduct} />
        ))}
        <Cta f={f} href={links.shop} label={button} />
      </Block>
    </EmailShell>
  );
};

export default StoreCampaignEmail;
