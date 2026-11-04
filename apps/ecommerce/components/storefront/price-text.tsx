import { Fragment } from "react";
import { PRICE_SYMBOL_MARK, saudiRiyalSvg } from "@workspace/lib";

/**
 * Draws text holding `formatPriceMarked` prices (a price alone, or a translated
 * sentence around one) with the currency icon in place of each mark. Everything
 * else stays escaped text; the SVG is a fixed string. Server or client.
 */
export function PriceText({ children, locale }: { children: string; locale: string }) {
  const parts = children.split(PRICE_SYMBOL_MARK);
  return (
    <>
      {parts.map((part, index) => (
        <Fragment key={index}>
          {index > 0 && <span dangerouslySetInnerHTML={{ __html: saudiRiyalSvg(locale) }} />}
          {part}
        </Fragment>
      ))}
    </>
  );
}
