import { getEmailMessages, interpolate } from "./i18n/index.js";
import type { EmailLocale } from "./i18n/locale.js";
import { PLATFORM_BRAND } from "./kit/brand.js";
import {
  Block,
  Cta,
  emailFrame,
  EmailShell,
  FooterLines,
  FooterLink,
  H1,
  Lead,
  Pill,
  SectionTitle,
  SellerHelpLine,
  type EmailFrame,
} from "./kit/components.js";

/*
 * Store setup reminders (ROADMAP.md F-94): `day1` 24 hours after a seller
 * signs up and `day7` after a week, while their store isn't set up. Tallaby's
 * own seller identity, same kit as "Your store is ready" (SellerStoreCreatedEmail).
 * Arabic by default (owner, 2026-11-13); English copy exists for the preview.
 */

export type SetupReminderStepKey = "product" | "design" | "payments" | "shipping";

export interface SellerSetupReminderEmailProps {
  kind: "day1" | "day7";
  locale?: EmailLocale | undefined;
  sellerName: string;
  storeName: string;
  /** The dashboard home, where the setup cards are (absolute). */
  setupUrl: string;
  /** The four home steps for the seller's store, in order, with absolute links. Empty: no store yet. */
  steps: { key: SetupReminderStepKey; href: string; done: boolean }[];
  /** One-click "stop these reminders" link (absolute). */
  optOutUrl: string;
  /** day7: the free plan's per-order fee in EGP, already formatted; without it no amount is named. */
  orderFeeEgp?: string | null | undefined;
}

export function sellerSetupReminderSubject(kind: "day1" | "day7", locale: EmailLocale = "ar"): string {
  return getEmailMessages(locale).sellerSetupReminder[kind].subject;
}

function stepsLeftPhrase(locale: EmailLocale, count: number): string {
  const copy = getEmailMessages(locale).sellerSetupReminder.stepsLeft;
  if (count === 1) return copy.one;
  if (count === 2) return copy.two;
  return interpolate(copy.many, { n: count });
}

const INK = "#171717";
const SOFT = "#6b7280";

function Badge({ f, index, done }: { f: EmailFrame; index: number; done: boolean }) {
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

/** A numbered list: title (a link when given) over a grey line. */
function List({ f, rows }: { f: EmailFrame; rows: { title: string; body: string; href?: string; done?: boolean; doneLabel?: string }[] }) {
  return (
    <table role="presentation" cellPadding={0} cellSpacing={0} border={0} width="100%" dir={f.dir} style={{ marginTop: 20 }}>
      <tbody>
        {rows.map((row, i) => (
          <tr key={i}>
            <td width={40} valign="top" style={{ padding: f.dir === "rtl" ? "0 0 18px 12px" : "0 12px 18px 0" }}>
              <Badge f={f} index={i} done={Boolean(row.done)} />
            </td>
            <td valign="top" style={{ textAlign: f.start, paddingBottom: 18, fontFamily: f.font }}>
              <div style={{ fontSize: 15, lineHeight: "26px", fontWeight: 700, color: row.done ? SOFT : INK }}>
                {row.href && !row.done ? (
                  <a href={row.href} style={{ color: f.brand.primary, textDecoration: "underline" }}>
                    {row.title}
                  </a>
                ) : (
                  row.title
                )}
              </div>
              <div style={{ fontSize: 13, lineHeight: "22px", color: SOFT }}>{row.done ? row.doneLabel : row.body}</div>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export const SellerSetupReminderEmail = ({
  kind,
  locale = "ar",
  sellerName,
  storeName,
  setupUrl,
  steps,
  optOutUrl,
  orderFeeEgp,
}: SellerSetupReminderEmailProps) => {
  const f = emailFrame(PLATFORM_BRAND, locale);
  const copy = getEmailMessages(locale).sellerSetupReminder;
  const text = copy[kind];
  const missing = steps.filter((step) => !step.done);
  // No store yet (or nothing computed): the four steps are all still ahead.
  const left = stepsLeftPhrase(locale, missing.length || 4);
  const name = sellerName.trim() || storeName;
  const vars = { name, storeName, steps: left };

  const footer = (
    <>
      <SellerHelpLine f={f} />
      <FooterLines
        f={f}
        lead={
          <>
            {copy.footerReason} <FooterLink href={optOutUrl}>{copy.optOut}</FooterLink>
          </>
        }
      />
    </>
  );

  return (
    <EmailShell
      f={f}
      audience="seller"
      title={text.subject}
      preview={interpolate(text.preview, vars)}
      headerMeta={storeName}
      footer={footer}
    >
      <Block f={f} padding="36px 32px 8px">
        <Pill f={f} tone="warning">
          {text.pill}
        </Pill>
        <H1 f={f} flush>
          {text.heading}
        </H1>
        <Lead f={f}>{interpolate(text.lead, vars)}</Lead>
      </Block>

      {kind === "day1" ? (
        <Block f={f} divider padding="0 32px 32px" last>
          <SectionTitle f={f}>{copy.stepsTitle}</SectionTitle>
          <List
            f={f}
            rows={(steps.length ? steps : (["product", "design", "payments", "shipping"] as const).map((key) => ({ key, href: setupUrl, done: false }))).map(
              (step) => ({
                title: copy.steps[step.key][0],
                body: copy.steps[step.key][1],
                href: step.href,
                done: step.done,
                doneLabel: copy.done,
              }),
            )}
          />
          <Cta f={f} href={setupUrl} label={text.cta} />
        </Block>
      ) : (
        <Block f={f} divider padding="0 32px 32px" last>
          <SectionTitle f={f}>{copy.reasonsTitle}</SectionTitle>
          <List
            f={f}
            rows={[
              { title: copy.reasons.templates[0], body: copy.reasons.templates[1] },
              { title: copy.reasons.ai[0], body: copy.reasons.ai[1] },
              {
                title: copy.reasons.free[0],
                body: orderFeeEgp ? interpolate(copy.freeWithFee, { fee: orderFeeEgp }) : copy.reasons.free[1],
              },
            ]}
          />
          <Cta f={f} href={setupUrl} label={text.cta} />
        </Block>
      )}

    </EmailShell>
  );
};

export default SellerSetupReminderEmail;
