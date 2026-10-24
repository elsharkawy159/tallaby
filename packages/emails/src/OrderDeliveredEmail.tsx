import { getEmailMessages, interpolate } from "./i18n/index.js";
import { PLATFORM_BRAND } from "./kit/brand.js";
import {
  Block,
  Cta,
  CustomerFooter,
  emailFrame,
  EmailShell,
  H1,
  HelpBlock,
  InlineLink,
  ItemRow,
  Lead,
  Ltr,
  Pill,
  Progress,
  SectionTitle,
  Text,
  type EmailFrame,
} from "./kit/components.js";
import type { BaseEmailProps, EmailCustomer } from "./kit/types.js";

export interface DeliveredItem {
  name: string;
  imageUrl?: string | null | undefined;
  sellerName?: string | null | undefined;
  /** Product page anchor where the review form lives. Items without one get no stars. */
  reviewUrl?: string | null | undefined;
}

export interface OrderDeliveredEmailProps extends BaseEmailProps {
  customer: EmailCustomer;
  orderNumber: string;
  deliveredDate: string;
  items: DeliveredItem[];
  /** Days a return can still be requested; omit to drop the sentence's number. */
  returnWindowDays?: number | null | undefined;
  links: { order: string; returns?: string | null | undefined };
}

const MAX_REVIEW_ITEMS = 3;

function withRating(url: string, rating: number): string {
  const [base, hash] = url.split("#");
  const sep = base!.includes("?") ? "&" : "?";
  return `${base}${sep}rating=${rating}${hash ? `#${hash}` : ""}`;
}

function Stars({ f, url }: { f: EmailFrame; url: string }) {
  return (
    <table role="presentation" cellPadding={0} cellSpacing={0} border={0} dir={f.dir} style={{ marginTop: 16 }}>
      <tbody>
        <tr>
          {[1, 2, 3, 4, 5].map((rating) => (
            <td key={rating} style={{ [f.dir === "rtl" ? "paddingLeft" : "paddingRight"]: 8 }}>
              <a
                href={withRating(url, rating)}
                aria-label={String(rating)}
                style={{
                  display: "block",
                  width: 44,
                  height: 44,
                  lineHeight: "44px",
                  textAlign: "center",
                  border: `1px solid ${f.brand.border}`,
                  borderRadius: 10,
                  fontSize: 22,
                  color: "#fdad28",
                  textDecoration: "none",
                }}
              >
                &#9733;
              </a>
            </td>
          ))}
        </tr>
      </tbody>
    </table>
  );
}

/** Customer: delivered + review request (Claude Design `Customer - Delivered - Review`). */
export const OrderDeliveredEmail = ({
  customer,
  orderNumber,
  deliveredDate,
  items,
  returnWindowDays,
  links,
  locale = "en",
  brand = PLATFORM_BRAND,
}: OrderDeliveredEmailProps) => {
  const f = emailFrame(brand, locale);
  const copy = getEmailMessages(locale).orderDelivered;
  const kit = getEmailMessages(locale).kit;
  const reviewable = items.filter((item) => item.reviewUrl).slice(0, MAX_REVIEW_ITEMS);
  const firstReview = reviewable[0]?.reviewUrl ?? links.order;
  const returnDays =
    returnWindowDays && returnWindowDays > 0 ? ` ${interpolate(copy.returnWithin, { days: returnWindowDays })}` : "";

  return (
    <EmailShell
      f={f}
      audience="customer"
      title={interpolate(copy.subject, { orderNumber })}
      preview={interpolate(copy.preview, { orderNumber })}
      headerMeta={
        <>
          {kit.order} <Ltr>#{orderNumber}</Ltr>
        </>
      }
      footer={<CustomerFooter f={f} email={customer.email} />}
    >
      <Block f={f} padding="36px 32px 8px">
        <Pill f={f} tone="success">
          {copy.pill}
        </Pill>
        <H1 f={f} flush>
          {copy.heading}
        </H1>
        <Lead f={f}>{interpolate(copy.lead, { date: deliveredDate })}</Lead>
        <Progress f={f} step={3} />
      </Block>

      <Block f={f} divider padding="28px 32px 32px">
        <SectionTitle f={f}>{copy.question}</SectionTitle>
        {(reviewable.length > 0 ? reviewable : items.slice(0, MAX_REVIEW_ITEMS)).map((item, i) => (
          <div key={i}>
            <ItemRow
              f={f}
              name={item.name}
              imageUrl={item.imageUrl ?? null}
              details={item.sellerName ? [interpolate(kit.seller, { name: item.sellerName })] : []}
            />
            {item.reviewUrl ? <Stars f={f} url={item.reviewUrl} /> : null}
          </div>
        ))}
        {reviewable.length > 0 ? (
          <Text f={f} muted size={13} pad={8}>
            {copy.tapStars}
          </Text>
        ) : null}
        <Cta f={f} href={firstReview} label={copy.writeReview} />
      </Block>

      <Block f={f} divider padding="0 32px 32px" last>
        <HelpBlock f={f} title={null}>
          {links.returns ? (
            <>
              {copy.returnNote}{" "}
              <InlineLink f={f} href={links.returns}>
                {copy.returnLink}
              </InlineLink>
              {returnDays}.
            </>
          ) : (
            copy.returnNoteNoLink
          )}
        </HelpBlock>
      </Block>
    </EmailShell>
  );
};

export default OrderDeliveredEmail;
