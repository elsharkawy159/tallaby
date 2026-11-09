import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { marketingPriceVars } from "@/lib/marketing/pricing.lib";
import { localPriceVars } from "@/lib/marketing/local-currency.lib";
import { VisitorPricesProvider } from "./visitor-prices.client";
import { withPrices } from "./with-prices";

const table = { EGP: marketingPriceVars(50, "en"), SAR: localPriceVars("SAR", 3.75, "en", "SAR") };

describe("withPrices", () => {
  it("fills price tokens from the provider, EGP on the server render", () => {
    const html = renderToStaticMarkup(<VisitorPricesProvider table={table}>{withPrices("{orderFee} per order, {pro} a month")}</VisitorPricesProvider>);
    expect(html).toBe("≈ 1.50 EGP per order, ≈ 1,450 EGP a month");
  });

  it("wraps the text around tokens and leaves other braces alone", () => {
    const html = renderToStaticMarkup(
      <VisitorPricesProvider table={table}>{withPrices("a {orderFee} b {other}", (part) => <i>{part}</i>)}</VisitorPricesProvider>,
    );
    expect(html).toBe("<i>a </i>≈ 1.50 EGP<i> b {other}</i>");
  });

  it("is the wrapped text alone without tokens", () => {
    expect(renderToStaticMarkup(<>{withPrices("plain", (part) => <b>{part}</b>)}</>)).toBe("<b>plain</b>");
  });
});
