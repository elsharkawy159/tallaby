/**
 * Floating panel (Modular set): a rounded ink panel floating inside the page
 * margins, with the logo and the store's sign-up form on top, link columns in
 * the middle and payment methods at the bottom. A premium, contained footer
 * for light pages.
 */
import { defineDesign } from "../builder";
import { L } from "../_kit";
import { STORE_NAME } from "../headers/_shared";
import { COPYRIGHT, HELP_LINKS, SHOP_LINKS, linkColumn } from "./_shared";

const PAYMENTS = [L("فيزا", "VISA"), L("ماستركارد", "Mastercard"), L("ميزة", "Meeza"), L("الدفع عند الاستلام", "Cash on delivery")];

export const footerPanel = defineDesign({
  id: "footer-panel",
  version: 1,
  category: "footers",
  subcategory: "newsletter",
  name: L("لوحة عائمة", "Floating panel"),
  description: L("فوتر في لوحة داكنة فيها الاشتراك والروابط والدفع.", "A footer in a dark floating panel with sign-up, links and payments."),
  keywords: ["footer", "panel", "dark", "newsletter", "premium", "فوتر", "نشرة"],
  tree: (t) =>
    t.section(
      {
        label: L("الفوتر", "Footer"),
        style: { paddingTop: 24, paddingBottom: 24 },
      },
      [
        t.container(
          [
            t.stack(
              [
                t.grid(
                  [
                    t.stack(
                      [
                        t.text(STORE_NAME, {
                          role: "storeName",
                          style: {
                            fontWeight: "extrabold",
                            fontSize: "2xl",
                            color: "background",
                          },
                        }),
                        t.text(L("اشترك وخد العروض قبل أي حد.", "Subscribe for offers before anyone else."), { style: { color: "background", opacity: 75 } }),
                      ],
                      { label: L("المتجر", "Store"), style: { gap: 6 } },
                    ),
                    t.box([t.storeForm()], {
                      label: L("النموذج", "Form box"),
                      style: {
                        background: "background",
                        radius: 18,
                        paddingTop: 14,
                        paddingBottom: 14,
                        paddingStart: 14,
                        paddingEnd: 14,
                      },
                    }),
                  ],
                  {
                    label: L("الأعلى", "Top"),
                    columns: { desktop: 2, mobile: 1 },
                    style: { gap: 24, alignItems: "center" },
                  },
                ),
                t.divider({
                  style: {
                    marginTop: 36,
                    marginBottom: 32,
                    borderColor: "background",
                    opacity: 20,
                  },
                }),
                t.grid([linkColumn(t, L("تسوق", "Shop"), SHOP_LINKS, "background"), linkColumn(t, L("المساعدة", "Help"), HELP_LINKS, "background")], {
                  label: L("الأعمدة", "Columns"),
                  columns: { desktop: 4, mobile: 2 },
                  style: { gap: 32, color: "background" },
                  mobile: { gap: 20 },
                }),
                t.row(
                  [
                    t.text(COPYRIGHT, {
                      style: {
                        color: "background",
                        opacity: 70,
                        fontSize: "sm",
                      },
                    }),
                    t.row(
                      PAYMENTS.map((p) =>
                        t.badge(p, {
                          style: {
                            background: "transparent",
                            borderWidth: 1,
                            borderColor: "background",
                            color: "background",
                          },
                        }),
                      ),
                      {
                        label: L("طرق الدفع", "Payment methods"),
                        role: "payments",
                        style: { gap: 6 },
                      },
                    ),
                  ],
                  {
                    label: L("السطر الأخير", "Bottom bar"),
                    style: {
                      justifyContent: "between",
                      gap: 16,
                      marginTop: 36,
                    },
                    mobile: { direction: "column", alignItems: "start" },
                  },
                ),
              ],
              {
                label: L("اللوحة", "Panel"),
                style: {
                  background: "foreground",
                  color: "background",
                  radius: 28,
                  paddingTop: 48,
                  paddingBottom: 32,
                  paddingStart: 48,
                  paddingEnd: 48,
                },
                mobile: {
                  paddingTop: 28,
                  paddingBottom: 24,
                  paddingStart: 20,
                  paddingEnd: 20,
                },
              },
            ),
          ],
          { label: L("الحاوية", "Container") },
        ),
      ],
    ),
});
