/**
 * Installments (U-b): a shelf tile with one product (photo, name, price),
 * the month terms and the providers, beside a brand tile with the longest
 * term in very large figures and a buy button. The design's live monthly
 * amount needs maths on the product price that a tree cannot do (and a typed
 * figure would be wrong for any other product), so the brand tile states the
 * term instead; the month chips are a still list. Mobile stacks the tiles.
 */
import { defineDesign } from "../builder";
import { L, N, ON_BRAND, ON_BRAND_BODY } from "../_kit";
import { BRAND_TILE, FLUSH, TILE, TILE_MOBILE } from "../_modular";
import { SHOP_LINK, priceRow } from "../products/_shared";
import { INSTALLMENT_PROVIDERS, namePill } from "./_shared";

const TERMS = ["3", "6", "12", "24"];

export const payInstallments = defineDesign({
  id: "pay-installments",
  version: 1,
  category: "payment",
  subcategory: "installments",
  name: L("حاسبة التقسيط", "Installments"),
  description: L("منتج واحد ومدد التقسيط والشركات، وجنبهم أطول مدة بأرقام كبيرة.", "One product with the installment terms and providers, beside the longest term in large figures."),
  keywords: ["payment", "installments", "monthly", "valU", "تقسيط", "قسط", "شهور"],
  tree: (t) =>
    t.section({ label: L("التقسيط", "Installments") }, [
      t.container(
        [
          t.productList(
            [
              t.grid(
                [
                  t.stack(
                    [
                      t.text(L("قسّطها", "Split it"), { role: "eyebrow", style: { fontSize: "sm", fontWeight: "semibold", color: "muted" } }),
                      t.link(
                        SHOP_LINK,
                        [
                          t.row(
                            [
                              t.image("", L("اسم المنتج", "Product name"), {
                                bind: "image",
                                style: { width: "80px", aspectRatio: "square", objectFit: "cover", radius: 10, background: "secondary" },
                              }),
                              t.stack(
                                [t.text(L("اسم المنتج", "Product name"), { bind: "title", style: { fontWeight: "medium", lineHeight: "snug" } }), priceRow(t)],
                                { label: L("التفاصيل", "Details"), style: { gap: 4 } },
                              ),
                            ],
                            { label: L("المحتوى", "Content"), style: { gap: 16, wrap: false } },
                          ),
                        ],
                        {
                          label: L("المنتج", "Product"),
                          bind: "href",
                          style: { ...FLUSH, paddingTop: 12, paddingBottom: 12, paddingStart: 12, paddingEnd: 12, background: "background", radius: 12, color: "foreground" },
                        },
                      ),
                      t.heading(L("على كام شهر؟", "Over how many months?"), "h3", { style: { fontSize: "lg" } }),
                      t.grid(
                        TERMS.map((m, i) => {
                          const on = i === 2;
                          return t.stack(
                            [
                              t.text(N(m), { style: { fontSize: "2xl", fontWeight: "bold", lineHeight: "tight", textAlign: "center", color: on ? "background" : "foreground" } }),
                              t.text(L("شهر", "months"), { style: { fontSize: "xs", textAlign: "center", color: on ? "background" : "muted" } }),
                            ],
                            {
                              label: L("مدة", "Term"),
                              style: {
                                gap: 0,
                                justifyContent: "center",
                                minHeight: 72,
                                radius: 12,
                                background: on ? "foreground" : "background",
                                borderWidth: on ? 0 : 1,
                                borderColor: "border",
                              },
                            },
                          );
                        }),
                        { label: L("المدد", "Terms"), role: "items", columns: { desktop: 4, mobile: 4 }, style: { gap: 8 } },
                      ),
                      t.row(
                        INSTALLMENT_PROVIDERS.map((p) => namePill(t, p, "outline")),
                        { label: L("الشركات", "Providers"), style: { gap: 8 } },
                      ),
                    ],
                    { label: L("المنتج والمدد", "Product and terms"), style: { ...TILE, gap: 18, paddingTop: 36, paddingBottom: 36, paddingStart: 36, paddingEnd: 36 }, mobile: TILE_MOBILE },
                  ),
                  t.stack(
                    [
                      t.text(L("قسّطها لحد", "Split it over up to"), { style: { fontSize: "md", ...ON_BRAND } }),
                      t.text(L("٢٤ شهر", "24 months"), {
                        role: "value",
                        style: { fontSize: "6xl", fontWeight: "bold", letterSpacing: "tight", lineHeight: "tight", ...ON_BRAND },
                        mobile: { fontSize: "5xl" },
                      }),
                      t.paragraph(L("من غير فوايد ولا مقدم مع شركات التقسيط.", "No interest and no down payment with our installment partners."), {
                        style: { ...ON_BRAND_BODY, marginBottom: 12 },
                      }),
                      t.addToCart({ label: L("اشتري بالتقسيط", "Buy in installments") }),
                    ],
                    {
                      label: L("بطاقة التقسيط", "Installment tile"),
                      style: { ...BRAND_TILE, gap: 12, justifyContent: "end", alignItems: "start", paddingTop: 40, paddingBottom: 40, paddingStart: 40, paddingEnd: 40 },
                      mobile: { ...TILE_MOBILE, paddingTop: 26, paddingBottom: 26, paddingStart: 26, paddingEnd: 26 },
                    },
                  ),
                ],
                { label: L("المربعات", "Tiles"), columns: { desktop: 2, mobile: 1 }, style: { gap: 12, alignItems: "stretch" } },
              ),
            ],
            { label: L("المنتج", "Product"), source: "newest", limit: 1, columns: { desktop: 1 } },
          ),
        ],
        { label: L("الحاوية", "Container") },
      ),
    ]),
});
