import { Fragment, type ReactNode } from "react";
import { PRICE_NAMES, fillCopyTokens, type PriceName } from "@/lib/marketing/pricing.lib";
import { Price } from "./visitor-prices.client";

const TOKEN = new RegExp(`[{](${PRICE_NAMES.join("|")})[}]`);

/**
 * A translated string with \`{orderFee}\`-style tokens as page content: each token
 * becomes a \`Price\` in the visitor's currency, the text around it goes through
 * \`wrap\` (e.g. \`BidiText\`). Format the string with \`PRICE_TOKENS\` so the tokens survive \`t()\`.
 */
export function withPrices(raw: string, wrap: (part: string) => ReactNode = (part) => part): ReactNode {
  // Non-price tokens (`{days}`) in strings read with `t.raw`.
  const text = fillCopyTokens(raw);
  const parts = text.split(TOKEN);
  if (parts.length === 1) return wrap(text);
  return parts.map((part, i) => (i % 2 === 1 ? <Price key={i} name={part as PriceName} /> : <Fragment key={i}>{wrap(part)}</Fragment>));
}
