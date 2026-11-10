import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { Money, VisitorPricesProvider } from "./visitor-prices.client";
import { withPrices } from "./with-prices";

const rates = { EGP: 50, USD: 1, SAR: 3.75 };
const table = { locale: "ar", rates, labels: { EGP: "EGP", USD: "USD" } };

describe("withPrices", () => {
  it("fills price tokens from the provider, EGP on an Arabic page's server render", () => {
    const html = renderToStaticMarkup(<VisitorPricesProvider table={table}>{withPrices("{orderFee} per order, {pro} a month")}</VisitorPricesProvider>);
    expect(html).toBe("≈ ⁦1.50⁩ جنيه per order, ≈ ⁦1,450⁩ جنيه a month");
  });

  it("wraps the text around tokens and leaves other braces alone", () => {
    const html = renderToStaticMarkup(
      <VisitorPricesProvider table={table}>{withPrices("a {orderFee} b {other}", (part) => <i>{part}</i>)}</VisitorPricesProvider>,
    );
    expect(html).toBe("<i>a </i>≈ ⁦1.50⁩ جنيه<i> b {other}</i>");
  });

  it("renders USD on an English page's server render", () => {
    const en = { locale: "en", rates, labels: { EGP: "EGP", USD: "USD" } };
    const html = renderToStaticMarkup(<VisitorPricesProvider table={en}>{withPrices("{orderFee} per order, {pro} a month")}</VisitorPricesProvider>);
    expect(html).toBe("0.03 USD per order, 29 USD a month");
    expect(renderToStaticMarkup(<VisitorPricesProvider table={en}><Money cents={1240} /></VisitorPricesProvider>)).toBe("12.4 USD");
  });

  it("is the wrapped text alone without tokens", () => {
    expect(renderToStaticMarkup(<>{withPrices("plain", (part) => <b>{part}</b>)}</>)).toBe("<b>plain</b>");
  });
});
