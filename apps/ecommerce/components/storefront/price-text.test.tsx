import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { formatPriceMarked, PRICE_SYMBOL_MARK, SAUDI_RIYAL_LABEL } from "@workspace/lib";
import { PriceText } from "./price-text";

describe("PriceText", () => {
  it("draws the symbol in place of the mark, in a sentence too", () => {
    const amount = formatPriceMarked(50, "ar", SAUDI_RIYAL_LABEL);
    const html = renderToStaticMarkup(<PriceText locale="ar">{`وفّر ${amount} الآن`}</PriceText>);
    expect(html).toContain("وفّر 50 <span><svg");
    expect(html).toContain("</svg></span> الآن");
    expect(html).toContain('aria-label="ريال سعودي"');
    expect(html).not.toContain(PRICE_SYMBOL_MARK);
    expect(html).not.toContain(SAUDI_RIYAL_LABEL);
  });

  it("leaves other labels as plain text and escapes the sentence", () => {
    expect(renderToStaticMarkup(<PriceText locale="en">{formatPriceMarked(300, "en", "SAR")}</PriceText>)).toBe("300 SAR");
    expect(renderToStaticMarkup(<PriceText locale="en">{"<b>gift</b>"}</PriceText>)).toBe("&lt;b&gt;gift&lt;/b&gt;");
  });
});
