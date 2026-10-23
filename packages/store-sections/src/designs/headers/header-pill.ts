/**
 * Floating pill (library H-e): a detached dark capsule floating inside the
 * page margin, with the logo, a short centred menu and a filled cart pill.
 * For small catalogues and social-first brands. The menu hides on mobile.
 */
import { defineDesign } from "../builder";
import { L } from "../_kit";
import { MENU, STORE_NAME, nav } from "./_shared";

export const headerPill = defineDesign({
  id: "header-pill",
  version: 1,
  category: "headers",
  subcategory: "floating",
  name: L("شريط عائم", "Floating pill"),
  description: L("كبسولة داكنة عائمة بالشعار وقائمة قصيرة وزر السلة.", "A floating dark capsule with the logo, a short menu and the cart."),
  keywords: ["header", "floating", "pill", "app", "هيدر", "عائم"],
  tree: (t) =>
    t.section({ label: L("الهيدر", "Header"), style: { paddingTop: 16, paddingBottom: 16 }, mobile: { paddingTop: 0, paddingBottom: 0 } }, [
      t.container(
        [
          t.row(
            [
              t.link("/", [t.text(STORE_NAME, { role: "storeName", style: { fontWeight: "extrabold", fontSize: "lg" } })], {
                label: L("الشعار", "Logo"),
                role: "logo",
                style: { color: "background", paddingTop: 6, paddingBottom: 6, paddingStart: 10, paddingEnd: 10 },
              }),
              nav(t, MENU.slice(0, 4), { color: "background", style: { gap: 24 }, mobile: { hidden: true } }),
              t.link(
                "/cart",
                [
                  t.row([t.icon("shopping-bag", { style: { fontSize: "md" } }), t.text(L("السلة", "Cart"), { style: { fontWeight: "bold" } })], {
                    label: L("المحتوى", "Content"),
                    style: { gap: 8, wrap: false },
                  }),
                ],
                {
                  label: L("السلة", "Cart"),
                  style: { background: "accent", color: "foreground", radius: 999, paddingTop: 10, paddingBottom: 10, paddingStart: 18, paddingEnd: 18 },
                },
              ),
            ],
            {
              label: L("الكبسولة", "Capsule"),
              style: {
                justifyContent: "between",
                gap: 16,
                wrap: false,
                background: "foreground",
                color: "background",
                radius: 999,
                paddingTop: 8,
                paddingBottom: 8,
                paddingStart: 18,
                paddingEnd: 8,
                shadow: "lg",
              },
            },
          ),
        ],
        { label: L("الحاوية", "Container"), style: { paddingTop: 0, paddingBottom: 0 } },
      ),
    ]),
});
