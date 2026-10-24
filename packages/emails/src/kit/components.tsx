import type { CSSProperties, ReactNode } from "react";
import { Body, Head, Html, Preview } from "@react-email/components";
import { getEmailMessages, interpolate } from "../i18n/index.js";
import type { EmailLocale } from "../i18n/locale.js";
import { isRtlLocale } from "../i18n/locale.js";
import { EMAIL_SITE_URL, EMAIL_WHATSAPP_URL } from "../theme/tokens.js";
import type { EmailBrand } from "./brand.js";

/*
 * Table-based building blocks for the Claude Design email library
 * (`Emails/*.html`). Everything is inline-styled tables so Gmail, Outlook and
 * Apple Mail render the same; colours come from the `EmailBrand`, so the same
 * markup serves Tallaby's mail and a store's own customer mail.
 */

// `bgcolor` on cells is what Outlook honours when it drops CSS backgrounds.
declare module "react" {
  interface TdHTMLAttributes<T> {
    bgcolor?: string | undefined;
  }
}

const INK = "#171717";
const BODY = "#4a4a4a";
const SOFT = "#6b7280";
const FAINT = "#808080";
const TEXT = "#333333";

const ARABIC_STACK = "'Noto Kufi Arabic',Tahoma,Arial,sans-serif";
const LATIN_STACK = "Montserrat,Arial,Helvetica,sans-serif";

export const TONES = {
  success: { bg: "#dcfce7", fg: "#15803d", panel: "#f0fdf4", border: "#bbf7d0" },
  danger: { bg: "#fef2f2", fg: "#b91c1c", panel: "#fef2f2", border: "#fecaca" },
  warning: { bg: "#fff7e6", fg: "#b45309", panel: "#fff7e6", border: "#ffd166" },
} as const;

export type Tone = keyof typeof TONES;

/** Direction-aware values shared by every block. */
export interface EmailFrame {
  brand: EmailBrand;
  locale: EmailLocale;
  dir: "rtl" | "ltr";
  /** Leading edge ("right" in Arabic). */
  start: "left" | "right";
  /** Trailing edge. */
  end: "left" | "right";
  font: string;
}

function sanitizeFontName(name: string): string {
  return name.replace(/[^\p{L}\p{N} \-]/gu, "").trim();
}

export function emailFrame(brand: EmailBrand, locale: EmailLocale): EmailFrame {
  const rtl = isRtlLocale(locale);
  const fallback = rtl ? ARABIC_STACK : LATIN_STACK;
  const custom = brand.fontFamily ? sanitizeFontName(brand.fontFamily) : "";
  return {
    brand,
    locale,
    dir: rtl ? "rtl" : "ltr",
    start: rtl ? "right" : "left",
    end: rtl ? "left" : "right",
    font: custom ? `'${custom}',${fallback}` : fallback,
  };
}

const tableProps = {
  role: "presentation",
  cellPadding: 0,
  cellSpacing: 0,
  border: 0,
} as const;

function Table({
  f,
  children,
  style,
  bg,
  full = true,
}: {
  f: EmailFrame;
  children: ReactNode;
  style?: CSSProperties;
  bg?: string;
  full?: boolean;
}) {
  return (
    <table
      {...tableProps}
      dir={f.dir}
      width={full ? "100%" : undefined}
      bgcolor={bg}
      style={{ ...(bg ? { backgroundColor: bg } : {}), ...style }}
    >
      <tbody>{children}</tbody>
    </table>
  );
}

const mobileCss = `
a{text-decoration:none}
@media (max-width:620px){
  .px{padding-left:20px!important;padding-right:20px!important}
  .col{display:block!important;width:100%!important}
  .col2{padding-top:20px!important}
  .h1{font-size:24px!important;line-height:36px!important}
  .big{font-size:30px!important;line-height:44px!important}
}`;

export interface EmailShellProps {
  f: EmailFrame;
  preview: string;
  title: string;
  audience: "customer" | "seller";
  /** Far side of the header, e.g. "Order #123" or the store name. */
  headerMeta?: ReactNode;
  footer: ReactNode;
  children: ReactNode;
}

export function EmailShell({ f, preview, title, audience, headerMeta, footer, children }: EmailShellProps) {
  const { brand } = f;
  const copy = getEmailMessages(f.locale).kit;

  return (
    <Html lang={f.locale} dir={f.dir}>
      <Head>
        <meta name="viewport" content="width=device-width,initial-scale=1" />
        <meta name="color-scheme" content="light" />
        <meta name="supported-color-schemes" content="light" />
        <title>{title}</title>
        {brand.fontUrl ? <link href={brand.fontUrl} rel="stylesheet" /> : null}
        <style>{`${mobileCss}\na{color:${brand.primary}}`}</style>
      </Head>
      <Preview>{preview}</Preview>
      <Body dir={f.dir} style={{ margin: 0, padding: 0, backgroundColor: brand.canvas, WebkitTextSizeAdjust: "100%" }}>
        <Table f={f} bg={brand.canvas}>
          <tr>
            <td align="center" style={{ padding: "32px 12px" }}>
              <table {...tableProps} dir={f.dir} width="600" style={{ width: "100%", maxWidth: 600 }}>
                <tbody>
                  <tr>
                    <td
                      className="px"
                      bgcolor={brand.primary}
                      style={{ backgroundColor: brand.primary, borderRadius: "12px 12px 0 0", padding: "22px 32px" }}
                    >
                      <Table f={f}>
                        <tr>
                          <td align={f.start} style={{ textAlign: f.start }}>
                            <BrandMark f={f} />
                            {audience === "seller" && brand.isPlatform ? (
                              <span
                                style={{
                                  fontFamily: f.font,
                                  fontSize: 13,
                                  fontWeight: 600,
                                  color: mixMuted(brand),
                                  paddingInlineStart: 6,
                                }}
                              >
                                {" "}
                                {copy.forSellers}
                              </span>
                            ) : null}
                          </td>
                          <td
                            align={f.end}
                            style={{
                              textAlign: f.end,
                              fontFamily: f.font,
                              fontSize: 13,
                              lineHeight: "20px",
                              color: brand.onPrimaryMuted,
                            }}
                          >
                            {headerMeta}
                          </td>
                        </tr>
                      </Table>
                    </td>
                  </tr>
                  <tr>
                    <td
                      bgcolor={brand.accent}
                      style={{ backgroundColor: brand.accent, height: 4, lineHeight: "4px", fontSize: 0 }}
                    >
                      &nbsp;
                    </td>
                  </tr>
                  {children}
                  <tr>
                    <td
                      align="center"
                      className="px"
                      style={{ padding: "24px 32px 0", fontFamily: f.font, fontSize: 12, lineHeight: "22px", color: FAINT }}
                    >
                      {footer}
                    </td>
                  </tr>
                </tbody>
              </table>
            </td>
          </tr>
        </Table>
      </Body>
    </Html>
  );
}

function mixMuted(brand: EmailBrand): string {
  return brand.isPlatform ? "#89a8b1" : brand.onPrimaryMuted;
}

function BrandMark({ f }: { f: EmailFrame }) {
  const { brand } = f;
  if (brand.logoUrl) {
    return (
      <a href={brand.homeUrl} style={{ textDecoration: "none" }}>
        <img
          src={brand.logoUrl}
          alt={brand.name}
          height={36}
          style={{ display: "inline-block", height: 36, maxWidth: 180, border: 0, verticalAlign: "middle" }}
        />
      </a>
    );
  }
  if (brand.isPlatform) {
    return (
      <a
        href={brand.homeUrl}
        dir="ltr"
        style={{
          fontFamily: LATIN_STACK,
          fontSize: 26,
          lineHeight: "30px",
          fontWeight: 800,
          letterSpacing: "-0.5px",
          color: brand.onPrimary,
          textDecoration: "none",
        }}
      >
        <span style={{ color: brand.accent }}>t</span>allaby
      </a>
    );
  }
  return (
    <a
      href={brand.homeUrl}
      style={{ fontFamily: f.font, fontSize: 22, lineHeight: "30px", fontWeight: 700, color: brand.onPrimary, textDecoration: "none" }}
    >
      {brand.name}
    </a>
  );
}

/** One white slab of the card. `last` closes the card with the bottom border and radius. */
export function Block({
  f,
  children,
  padding = "28px 32px 0",
  divider = false,
  last = false,
}: {
  f: EmailFrame;
  children: ReactNode;
  padding?: string;
  /** Draws the hairline that separates this slab from the one above. */
  divider?: boolean;
  last?: boolean;
}) {
  const border = `1px solid ${f.brand.border}`;
  return (
    <tr>
      <td
        className="px"
        bgcolor="#ffffff"
        style={{
          backgroundColor: "#ffffff",
          borderLeft: border,
          borderRight: border,
          ...(last ? { borderBottom: border, borderRadius: "0 0 12px 12px" } : {}),
          padding,
          textAlign: f.start,
        }}
      >
        {divider ? (
          <Table f={f} style={{ borderTop: border }}>
            <tr>
              <td style={{ height: 28, lineHeight: "28px", fontSize: 0 }}>&nbsp;</td>
            </tr>
          </Table>
        ) : null}
        {children}
      </td>
    </tr>
  );
}

export function Eyebrow({ f, children }: { f: EmailFrame; children: ReactNode }) {
  return (
    <div style={{ textAlign: f.start, fontFamily: f.font, fontSize: 13, lineHeight: "20px", fontWeight: 700, color: f.brand.primary }}>
      {children}
    </div>
  );
}

export function Pill({ f, tone, children }: { f: EmailFrame; tone: Tone; children: ReactNode }) {
  const t = TONES[tone];
  return (
    <Table f={f}>
      <tr>
        <td align={f.start} style={{ paddingBottom: 14 }}>
          <table {...tableProps} dir={f.dir}>
      <tbody>
        <tr>
          <td
            bgcolor={t.bg}
            style={{
              backgroundColor: t.bg,
              borderRadius: 9999,
              padding: "4px 14px",
              whiteSpace: "nowrap",
              fontFamily: f.font,
              fontSize: 12,
              lineHeight: "20px",
              fontWeight: 700,
              color: t.fg,
            }}
          >
            {children}
          </td>
        </tr>
      </tbody>
          </table>
        </td>
      </tr>
    </Table>
  );
}

export function H1({ f, children, flush = false }: { f: EmailFrame; children: ReactNode; flush?: boolean }) {
  return (
    <div
      className="h1"
      style={{
        textAlign: f.start,
        paddingTop: flush ? 0 : 10,
        fontFamily: f.font,
        fontSize: 28,
        lineHeight: "42px",
        fontWeight: 700,
        color: INK,
      }}
    >
      {children}
    </div>
  );
}

export function Lead({ f, children }: { f: EmailFrame; children: ReactNode }) {
  return (
    <div style={{ textAlign: f.start, paddingTop: 10, fontFamily: f.font, fontSize: 15, lineHeight: "28px", color: BODY }}>
      {children}
    </div>
  );
}

export function Text({ f, children, muted = false, size = 14, center = false, pad = 0 }: {
  f: EmailFrame;
  children: ReactNode;
  muted?: boolean;
  size?: number;
  center?: boolean;
  pad?: number;
}) {
  return (
    <div
      style={{
        textAlign: center ? "center" : f.start,
        paddingTop: pad,
        fontFamily: f.font,
        fontSize: size,
        lineHeight: size >= 14 ? "26px" : "22px",
        color: muted ? SOFT : BODY,
      }}
    >
      {children}
    </div>
  );
}

export function BigAmount({ f, children }: { f: EmailFrame; children: ReactNode }) {
  return (
    <div
      className="big"
      style={{ textAlign: f.start, paddingTop: 4, fontFamily: f.font, fontSize: 36, lineHeight: "52px", fontWeight: 700, color: f.brand.primary }}
    >
      {children}
    </div>
  );
}

export function SectionTitle({ f, children, count }: { f: EmailFrame; children: ReactNode; count?: number }) {
  return (
    <div style={{ textAlign: f.start, fontFamily: f.font, fontSize: 18, lineHeight: "28px", fontWeight: 700, color: f.brand.primary }}>
      {children}
      {count !== undefined ? (
        <span style={{ fontSize: 14, fontWeight: 400, color: FAINT }}> ({count})</span>
      ) : null}
    </div>
  );
}

/** Four-step order tracker. `step` is 0 (confirmed) … 3 (delivered). */
export function Progress({ f, step }: { f: EmailFrame; step: 0 | 1 | 2 | 3 }) {
  const labels = getEmailMessages(f.locale).kit.progress;
  const done = f.brand.primary;
  return (
    <Table f={f} style={{ marginTop: 28 }}>
      <tr>
        {labels.map((_, i) => (
          <td key={i} width="25%" style={{ padding: "0 4px" }}>
            <Table f={f}>
              <tr>
                <td
                  bgcolor={i <= step ? done : "#e5e5e5"}
                  style={{ backgroundColor: i <= step ? done : "#e5e5e5", height: 6, lineHeight: "6px", fontSize: 0, borderRadius: 3 }}
                >
                  &nbsp;
                </td>
              </tr>
            </Table>
          </td>
        ))}
      </tr>
      <tr>
        {labels.map((label, i) => (
          <td
            key={i}
            style={{
              textAlign: f.start,
              padding: "8px 4px 0",
              fontFamily: f.font,
              fontSize: 12,
              lineHeight: "18px",
              fontWeight: i === step ? 700 : 400,
              color: i === step ? done : i < step ? f.brand.tintLabel : FAINT,
            }}
          >
            {label}
          </td>
        ))}
      </tr>
    </Table>
  );
}

export interface MetaItem {
  label: ReactNode;
  value: ReactNode;
  /** Codes, numbers and card masks read left-to-right even in Arabic. */
  ltr?: boolean;
}

/** Tinted row of label/value cells (order number, dates, carrier…). */
export function MetaGrid({ f, items, marginTop = 28 }: { f: EmailFrame; items: MetaItem[]; marginTop?: number }) {
  const width = `${Math.floor(100 / Math.max(items.length, 1))}%`;
  return (
    <Table f={f} bg={f.brand.tint} style={{ marginTop, borderRadius: 10 }}>
      <tr>
        {items.map((item, i) => (
          <td key={i} className="col" width={width} valign="top" style={{ textAlign: f.start, padding: "16px 18px", fontFamily: f.font }}>
            <div style={{ fontSize: 12, lineHeight: "18px", fontWeight: 600, color: f.brand.tintLabel }}>{item.label}</div>
            <div
              dir={item.ltr ? "ltr" : undefined}
              style={{
                textAlign: f.start,
                paddingTop: 6,
                fontFamily: item.ltr ? LATIN_STACK : f.font,
                fontSize: 14,
                lineHeight: "22px",
                fontWeight: 600,
                color: INK,
              }}
            >
              {item.value}
            </div>
          </td>
        ))}
      </tr>
    </Table>
  );
}

/** Highlighted note. `info` uses the brand tint; the others are status colours. */
export function Callout({ f, tone = "info", children, marginTop = 24 }: {
  f: EmailFrame;
  tone?: Tone | "info";
  children: ReactNode;
  marginTop?: number;
}) {
  const bg = tone === "info" ? f.brand.tint : TONES[tone].panel;
  const border = tone === "info" ? f.brand.tintBorder : TONES[tone].border;
  return (
    <Table f={f} bg={bg} style={{ marginTop, border: `1px solid ${border}`, borderRadius: 10 }}>
      <tr>
        <td style={{ textAlign: f.start, padding: "14px 18px", fontFamily: f.font, fontSize: 14, lineHeight: "25px", color: TEXT }}>
          {children}
        </td>
      </tr>
    </Table>
  );
}

/** Dark balance panel (seller wallet top-up). */
export function BalancePanel({ f, label, value, sideLabel, sideValue }: {
  f: EmailFrame;
  label: ReactNode;
  value: ReactNode;
  sideLabel?: ReactNode;
  sideValue?: ReactNode;
}) {
  return (
    <Table f={f} bg={f.brand.primary} style={{ marginTop: 28, borderRadius: 12 }}>
      <tr>
        <td style={{ textAlign: f.start, padding: "20px 22px", fontFamily: f.font }}>
          <div style={{ fontSize: 13, lineHeight: "20px", color: f.brand.onPrimaryMuted }}>{label}</div>
          <div style={{ paddingTop: 4, fontSize: 32, lineHeight: "48px", fontWeight: 700, color: f.brand.accent }}>{value}</div>
        </td>
        {sideLabel ? (
          <td
            align={f.end}
            valign="bottom"
            style={{ textAlign: f.end, padding: "20px 22px", fontFamily: f.font, fontSize: 13, lineHeight: "22px", color: f.brand.onPrimaryMuted }}
          >
            {sideLabel}
            <br />
            <span style={{ fontSize: 15, fontWeight: 600, color: f.brand.onPrimary }}>{sideValue}</span>
          </td>
        ) : null}
      </tr>
    </Table>
  );
}

export function CodeBox({ f, children }: { f: EmailFrame; children: ReactNode }) {
  return (
    <Table f={f} bg={f.brand.tint} style={{ marginTop: 24, border: `1px dashed ${f.brand.tintLabel}`, borderRadius: 12 }}>
      <tr>
        <td
          align="center"
          dir="ltr"
          style={{
            padding: 20,
            fontFamily: LATIN_STACK,
            fontSize: 34,
            lineHeight: "40px",
            fontWeight: 700,
            letterSpacing: 10,
            color: f.brand.primary,
          }}
        >
          {children}
        </td>
      </tr>
    </Table>
  );
}

export interface SecondaryLink {
  href: string;
  label: ReactNode;
}

export function Cta({ f, href, label, links = [] }: { f: EmailFrame; href: string; label: ReactNode; links?: SecondaryLink[] }) {
  const { brand } = f;
  return (
    <Table f={f} style={{ marginTop: 24 }}>
      <tr>
        <td align="center" bgcolor={brand.accent} style={{ backgroundColor: brand.accent, borderRadius: 16 }}>
          <a
            href={href}
            style={{
              display: "block",
              padding: "14px 24px",
              fontFamily: f.font,
              fontSize: 16,
              lineHeight: "24px",
              fontWeight: 700,
              color: brand.onAccent,
              textDecoration: "none",
              borderRadius: 16,
            }}
          >
            {label}
          </a>
        </td>
      </tr>
      {links.length > 0 ? (
        <tr>
          <td align="center" dir={f.dir} style={{ paddingTop: 14, fontFamily: f.font, fontSize: 14, lineHeight: "22px" }}>
            {links.map((link, i) => (
              <span key={i}>
                {i > 0 ? <span style={{ color: "#bfbfbf" }}>&nbsp;|&nbsp;</span> : null}
                <a href={link.href} style={{ color: brand.primary, fontWeight: 600, textDecoration: "none" }}>
                  {link.label}
                </a>
              </span>
            ))}
          </td>
        </tr>
      ) : null}
    </Table>
  );
}

export interface ItemRowProps {
  f: EmailFrame;
  name: string;
  imageUrl?: string | null;
  /** Grey lines under the name (variant · qty, seller, SKU, reason…). */
  details?: ReactNode[];
  /** Trailing column, e.g. the price. */
  aside?: ReactNode;
  asideSub?: ReactNode;
}

export function ItemRow({ f, name, imageUrl, details = [], aside, asideSub }: ItemRowProps) {
  return (
    <Table f={f} style={{ marginTop: 18 }}>
      <tr>
        <td width="84" valign="top" style={{ [f.dir === "rtl" ? "paddingLeft" : "paddingRight"]: 16 }}>
          {imageUrl ? (
            <img
              src={imageUrl}
              width={68}
              height={68}
              alt={name}
              style={{ display: "block", width: 68, height: 68, border: "1px solid #e5e5e5", borderRadius: 10, objectFit: "cover", background: "#f7f7f7" }}
            />
          ) : (
            <div style={{ width: 68, height: 68, border: "1px solid #e5e5e5", borderRadius: 10, background: "#f7f7f7" }} />
          )}
        </td>
        <td valign="top" style={{ textAlign: f.start, fontFamily: f.font }}>
          <div style={{ fontSize: 14, lineHeight: "24px", fontWeight: 600, color: INK }}>{name}</div>
          {details.map((line, i) => (
            <div key={i} style={{ paddingTop: i === 0 ? 4 : 0, fontSize: 13, lineHeight: "22px", color: SOFT }}>
              {line}
            </div>
          ))}
        </td>
        <td
          width="96"
          valign="top"
          align={f.end}
          style={{
            textAlign: f.end,
            [f.dir === "rtl" ? "paddingRight" : "paddingLeft"]: 12,
            fontFamily: f.font,
            whiteSpace: "nowrap",
          }}
        >
          {aside ? <div style={{ fontSize: 15, lineHeight: "24px", fontWeight: 600, color: INK }}>{aside}</div> : null}
          {asideSub ? <div style={{ fontSize: 13, lineHeight: "22px", color: SOFT }}>{asideSub}</div> : null}
        </td>
      </tr>
    </Table>
  );
}

export interface TotalsRow {
  label: ReactNode;
  value: ReactNode;
  positive?: boolean;
}

/** Receipt box: line rows and a bold total under a hairline. */
export function Totals({ f, rows, total, marginTop = 24 }: {
  f: EmailFrame;
  rows: TotalsRow[];
  total: { label: ReactNode; value: ReactNode };
  marginTop?: number;
}) {
  const hair = `1px solid ${f.brand.border}`;
  return (
    <Table f={f} bg={f.brand.canvas} style={{ marginTop, border: "1px solid #e5e5e5", borderRadius: 12 }}>
      <tr>
        <td style={{ padding: "18px 20px 0" }}>
          <Table f={f} style={{ fontFamily: f.font, fontSize: 14, lineHeight: "22px", color: BODY }}>
            {rows.map((row, i) => {
              const pad = i === rows.length - 1 ? 16 : 8;
              return (
                <tr key={i}>
                  <td style={{ textAlign: f.start, paddingBottom: pad }}>{row.label}</td>
                  <td align={f.end} style={{ textAlign: f.end, paddingBottom: pad, whiteSpace: "nowrap" }}>
                    {row.positive ? <span style={{ color: TONES.success.fg }}>{row.value}</span> : row.value}
                  </td>
                </tr>
              );
            })}
            <tr>
              <td style={{ textAlign: f.start, padding: "14px 0 18px", borderTop: hair, fontSize: 16, fontWeight: 700, color: INK }}>
                {total.label}
              </td>
              <td
                align={f.end}
                style={{ textAlign: f.end, padding: "14px 0 18px", borderTop: hair, fontSize: 20, fontWeight: 700, color: f.brand.primary, whiteSpace: "nowrap" }}
              >
                {total.value}
              </td>
            </tr>
          </Table>
        </td>
      </tr>
    </Table>
  );
}

export interface InfoColumn {
  title: ReactNode;
  body: ReactNode;
}

/** Two columns that stack on mobile (address + payment). Each column may hold several titled entries. */
export function TwoColumns({ f, first, second }: { f: EmailFrame; first: InfoColumn[]; second: InfoColumn[] }) {
  const renderColumn = (entries: InfoColumn[]) =>
    entries.map((entry, i) => (
      <div key={i}>
        <div style={{ paddingTop: i === 0 ? 0 : 18, fontSize: 13, lineHeight: "20px", fontWeight: 700, color: f.brand.primary }}>
          {entry.title}
        </div>
        <div style={{ paddingTop: 10, fontSize: 14, lineHeight: "24px", color: TEXT }}>{entry.body}</div>
      </div>
    ));
  return (
    <Table f={f}>
      <tr>
        {first.length > 0 ? (
          <td
            className="col"
            width={second.length > 0 ? "55%" : "100%"}
            valign="top"
            style={{ textAlign: f.start, [f.dir === "rtl" ? "paddingLeft" : "paddingRight"]: 16, fontFamily: f.font }}
          >
            {renderColumn(first)}
          </td>
        ) : null}
        {second.length > 0 ? (
          <td className={first.length > 0 ? "col col2" : "col"} width={first.length > 0 ? "45%" : "100%"} valign="top" style={{ textAlign: f.start, fontFamily: f.font }}>
            {renderColumn(second)}
          </td>
        ) : null}
      </tr>
    </Table>
  );
}

export function Strong({ children }: { children: ReactNode }) {
  return <strong style={{ color: INK }}>{children}</strong>;
}

export function Ltr({ children }: { children: ReactNode }) {
  return <span dir="ltr">{children}</span>;
}

export function InlineLink({ f, href, children }: { f: EmailFrame; href: string; children: ReactNode }) {
  return (
    <a href={href} style={{ color: f.brand.primary, fontWeight: 600, textDecoration: "underline" }}>
      {children}
    </a>
  );
}

export function MailLink({ f, email }: { f: EmailFrame; email: string }) {
  return (
    <a href={`mailto:${email}`} dir="ltr" style={{ color: f.brand.primary, fontWeight: 600, textDecoration: "underline" }}>
      {email}
    </a>
  );
}

/** "Need help?" closer with the brand's support address. */
export function HelpBlock({ f, title, children }: { f: EmailFrame; title?: ReactNode; children?: ReactNode }) {
  const copy = getEmailMessages(f.locale).kit;
  return (
    <>
      {title !== null ? (
        <div style={{ textAlign: f.start, fontFamily: f.font, fontSize: 15, lineHeight: "24px", fontWeight: 700, color: INK }}>
          {title ?? copy.needHelp}
        </div>
      ) : null}
      <div style={{ textAlign: f.start, paddingTop: 6, fontFamily: f.font, fontSize: 14, lineHeight: "26px", color: BODY }}>
        {children ?? (
          <>
            {copy.replyOrWrite} <MailLink f={f} email={f.brand.supportEmail} />.
          </>
        )}
      </div>
    </>
  );
}

/**
 * Footer lines. Store mail names the store and notes it runs on Tallaby; the
 * legal links stay Tallaby's because Tallaby sends the mail.
 */
export function FooterLines({ f, lead }: { f: EmailFrame; lead?: ReactNode }) {
  const copy = getEmailMessages(f.locale).kit;
  const common = getEmailMessages(f.locale).common;
  const year = new Date().getFullYear();
  const link = { color: SOFT };
  return (
    <>
      {lead ? (
        <>
          {lead}
          <br />
        </>
      ) : null}
      {f.brand.isPlatform ? (
        interpolate(common.copyright, { year })
      ) : (
        <>
          © {year} {f.brand.name} · {copy.poweredBy}
        </>
      )}{" "}
      &middot;{" "}
      <a href={`${EMAIL_SITE_URL}/privacy`} style={link}>
        {common.privacy}
      </a>{" "}
      &middot;{" "}
      <a href={`${EMAIL_SITE_URL}/terms`} style={link}>
        {common.terms}
      </a>
    </>
  );
}

export function SentTo({ email }: { email: string }) {
  return (
    <a href={`mailto:${email}`} dir="ltr" style={{ color: SOFT }}>
      {email}
    </a>
  );
}

/** "This email was sent to x." + legal line. */
export function CustomerFooter({ f, email }: { f: EmailFrame; email: string }) {
  const copy = getEmailMessages(f.locale).kit;
  return (
    <FooterLines
      f={f}
      lead={
        <>
          {copy.sentTo} <SentTo email={email} />.
        </>
      }
    />
  );
}

/** Tallaby's WhatsApp, as an inline link. */
export function WhatsAppLink({ f }: { f: EmailFrame }) {
  const copy = getEmailMessages(f.locale).kit;
  return (
    <a href={EMAIL_WHATSAPP_URL} style={{ color: f.brand.primary, fontWeight: 600, textDecoration: "underline" }}>
      {copy.whatsapp}
    </a>
  );
}

/** "Need help? Email x or message us on WhatsApp." — closes every seller email. */
export function SellerHelpLine({ f }: { f: EmailFrame }) {
  const copy = getEmailMessages(f.locale).kit;
  return (
    <div style={{ textAlign: "center", padding: "0 0 12px", fontFamily: f.font, fontSize: 14, lineHeight: "24px", color: BODY }}>
      {copy.sellerHelp} <MailLink f={f} email={f.brand.supportEmail} /> {copy.orWhatsApp} <WhatsAppLink f={f} />.
    </div>
  );
}

/** Seller mail: help line (email + WhatsApp), why it arrives, notification settings, legal line. */
export function SellerFooter({ f, settingsUrl }: { f: EmailFrame; settingsUrl: string }) {
  const copy = getEmailMessages(f.locale).kit;
  return (
    <>
      <SellerHelpLine f={f} />
      <FooterLines
        f={f}
        lead={
          <>
            {copy.sellerReason} <FooterLink href={settingsUrl}>{copy.notificationSettings}</FooterLink>
          </>
        }
      />
    </>
  );
}

export function FooterLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <a href={href} style={{ color: SOFT }}>
      {children}
    </a>
  );
}

/** Wraps a code/number in Unicode LTR isolates so it keeps its order inside Arabic sentences. */
export function isolateLtr(value: string): string {
  return `⁦${value}⁩`;
}
