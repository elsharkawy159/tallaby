import type { ReactNode } from "react";
import { getEmailMessages, interpolate } from "../i18n/index.js";
import { ItemRow, Ltr, Strong, type EmailFrame } from "./components.js";
import type { EmailAddress, EmailLineItem } from "./types.js";

export interface ItemDetailOptions {
  quantity?: boolean;
  seller?: boolean;
  sku?: boolean;
}

/** Grey detail lines under an item name: "variant · Qty n", seller, SKU. */
export function itemDetails(f: EmailFrame, item: EmailLineItem, options: ItemDetailOptions = {}): ReactNode[] {
  const copy = getEmailMessages(f.locale).kit;
  const { quantity = true, seller = false, sku = false } = options;
  const first = [item.variant, quantity ? interpolate(copy.qty, { quantity: item.quantity }) : null]
    .filter(Boolean)
    .join(" · ");
  const lines: ReactNode[] = [];
  if (first) lines.push(first);
  if (seller && item.sellerName) lines.push(interpolate(copy.seller, { name: item.sellerName }));
  if (sku && item.sku) {
    lines.push(
      <>
        {interpolate(copy.sku, { sku: "" }).trim()} <Ltr>{item.sku}</Ltr>
      </>,
    );
  }
  return lines;
}

export function ItemList({
  f,
  items,
  options,
}: {
  f: EmailFrame;
  items: EmailLineItem[];
  options?: ItemDetailOptions;
}) {
  return (
    <>
      {items.map((item, i) => (
        <ItemRow
          key={i}
          f={f}
          name={item.name}
          imageUrl={item.imageUrl ?? null}
          details={itemDetails(f, item, options)}
          aside={item.price ?? null}
        />
      ))}
    </>
  );
}

export function AddressBody({ address, phoneLink = false }: { address: EmailAddress; phoneLink?: boolean }) {
  return (
    <>
      <Strong>{address.fullName}</Strong>
      {address.lines.map((line, i) => (
        <span key={i}>
          <br />
          {line}
        </span>
      ))}
      {address.phone ? (
        <>
          <br />
          {phoneLink ? (
            <a href={`tel:${address.phone.replace(/[^\d+]/g, "")}`} dir="ltr" style={{ fontWeight: 600, textDecoration: "none" }}>
              {address.phone}
            </a>
          ) : (
            <span dir="ltr" style={{ color: "#6b7280" }}>
              {address.phone}
            </span>
          )}
        </>
      ) : null}
    </>
  );
}
