import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import type { Product } from "./product-page.types";

const cartItems: { productId: string; quantity: number; savedForLater?: boolean; variant: { id: string } | null }[] = [];

vi.mock("@/providers/cart-provider", () => ({ useCart: () => ({ cartItems }) }));
vi.mock("next-intl", () => ({ useLocale: () => "en" }));
vi.mock("./variant-deep-link.client", () => ({ VariantDeepLink: () => null }));

const { createVariantStore } = await import("./product-page.lib");
const { ProductPageProvider, useProductPage } = await import("./product-page-provider.client");

const variants = [
  { id: "v-red", title: "Red", option1: "Color: Red", isDefault: true, stock: 3 },
  { id: "v-blue", title: "Blue", option1: "Color: Blue", stock: 5 },
] as unknown as NonNullable<Product["productVariants"]>;

const product = { id: "p-1", slug: "shirt", productVariants: variants } as unknown as Product;

describe("variant store", () => {
  it("selecting variant updates every subscriber", () => {
    const store = createVariantStore("v-red");
    const seen: (string | null)[][] = [[], []];
    store.subscribe(() => seen[0]!.push(store.getSnapshot()));
    store.subscribe(() => seen[1]!.push(store.getSnapshot()));

    store.pick("v-blue");

    expect(store.getSnapshot()).toBe("v-blue");
    expect(seen).toEqual([["v-blue"], ["v-blue"]]);
  });

  it("?variant= deep link selects on mount", () => {
    const store = createVariantStore("v-red");
    // What VariantDeepLink hands over after hydration: a colour slug or a variant id.
    store.applyToken("blue", variants, "en");
    expect(store.getSnapshot()).toBe("v-blue");
    store.applyToken("v-red", variants, "en");
    expect(store.getSnapshot()).toBe("v-red");
    store.applyToken("no-such-variant", variants, "en");
    expect(store.getSnapshot()).toBe("v-red");
  });

  it("stops following the deep link once the shopper picks", () => {
    const store = createVariantStore("v-red");
    store.pick("v-blue");
    store.applyToken("red", variants, "en");
    expect(store.getSnapshot()).toBe("v-blue");
  });
});

function Probe({ name }: { name: string }) {
  const { variant, inCart, cartQuantity } = useProductPage();
  return (
    <i>
      {name}:{variant?.id ?? "none"}:{String(inCart)}:{cartQuantity}
    </i>
  );
}

describe("ProductPageProvider", () => {
  it("gives every part the default variant and its cart status", () => {
    cartItems.splice(0, cartItems.length, { productId: "p-1", quantity: 2, variant: { id: "v-red" } });
    const html = renderToStaticMarkup(
      <ProductPageProvider product={product}>
        <Probe name="price" />
        <Probe name="buy" />
      </ProductPageProvider>,
    );
    expect(html).toContain("price:v-red:true:2");
    expect(html).toContain("buy:v-red:true:2");
  });

  it("a product without variants has no variant and checks the base item", () => {
    cartItems.splice(0, cartItems.length, { productId: "p-1", quantity: 1, variant: { id: "v-red" } });
    const html = renderToStaticMarkup(
      <ProductPageProvider product={{ ...product, productVariants: [] }}>
        <Probe name="buy" />
      </ProductPageProvider>,
    );
    expect(html).toContain("buy:none:false:0");
  });
});
