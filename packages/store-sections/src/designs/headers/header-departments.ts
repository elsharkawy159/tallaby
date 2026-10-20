/**
 * Department tabs (Modular set): the logo, a segmented control of two or
 * three departments in the centre and icons at the end; a quiet second row
 * lists the links of the first department, the current one underlined in sun.
 * On mobile the segments move under the logo.
 */
import { defineDesign } from "../builder";
import { L } from "../_kit";
import { FLUSH } from "../_modular";
import { cartLink, logo, searchLink } from "./_shared";

const DEPARTMENTS = [L("نساء", "Women"), L("رجال", "Men"), L("أطفال", "Kids")];
const LINKS = [L("وصل حديثًا", "New in"), L("ملابس", "Clothing"), L("أحذية", "Shoes"), L("شنط", "Bags"), L("العروض", "Offers")];

export const headerDepartments = defineDesign({
  id: "header-departments",
  version: 1,
  category: "headers",
  subcategory: "mega-menu",
  name: L("أقسام رئيسية", "Department tabs"),
  description: L("أزرار للأقسام الرئيسية في المنتصف وتحتها روابط القسم.", "Department segments in the centre with that department's links below."),
  keywords: ["header", "departments", "tabs", "editorial", "هيدر", "أقسام", "تبويبات"],
  tree: (t) =>
    t.section(
      {
        label: L("الهيدر", "Header"),
        style: { paddingTop: 0, paddingBottom: 0, background: "background" },
        mobile: { paddingTop: 0, paddingBottom: 0 },
      },
      [
        t.container(
          [
            t.grid(
              [
                logo(t),
                t.row(
                  DEPARTMENTS.map((d, i) =>
                    t.link(
                      "/products",
                      [
                        t.text(d, {
                          style: {
                            fontWeight: "semibold",
                            fontSize: "sm",
                            textAlign: "center",
                            color: i === 0 ? "foreground" : "muted",
                          },
                        }),
                      ],
                      {
                        label: L("قسم رئيسي", "Department"),
                        style: {
                          ...FLUSH,
                          paddingTop: 10,
                          paddingBottom: 10,
                          paddingStart: 22,
                          paddingEnd: 22,
                          radius: 999,
                          ...(i === 0 ? { background: "background", shadow: "sm" } : { hover: { color: "foreground" } }),
                        },
                      },
                    ),
                  ),
                  {
                    label: L("الأقسام الرئيسية", "Departments"),
                    role: "menu",
                    style: {
                      background: "secondary",
                      radius: 999,
                      paddingTop: 4,
                      paddingBottom: 4,
                      paddingStart: 4,
                      paddingEnd: 4,
                      gap: 0,
                      wrap: false,
                      justifyContent: "center",
                    },
                    mobile: { colSpan: 2, order: 3, justifyContent: "between" },
                  },
                ),
                t.row([searchLink(t), cartLink(t)], {
                  label: L("الأيقونات", "Icons"),
                  style: { justifyContent: "end", gap: 2, wrap: false },
                }),
              ],
              {
                label: L("الصف العلوي", "Top row"),
                columns: { desktop: 3, mobile: 2 },
                style: {
                  gap: 16,
                  alignItems: "center",
                  paddingTop: 14,
                  paddingBottom: 14,
                },
                mobile: { gap: 10, paddingTop: 10, paddingBottom: 10 },
              },
            ),
            t.row(
              LINKS.map((link, i) =>
                t.link(
                  "/products",
                  [
                    t.stack(
                      [
                        t.text(link, {
                          style: {
                            fontSize: "sm",
                            color: i === 0 ? "foreground" : "muted",
                            ...(i === 0 && { fontWeight: "semibold" }),
                          },
                        }),
                        t.box([], {
                          label: L("الخط", "Underline"),
                          style: {
                            background: i === 0 ? "accent" : "transparent",
                            radius: 999,
                            minHeight: 2,
                          },
                        }),
                      ],
                      { label: L("المحتوى", "Content"), style: { gap: 8 } },
                    ),
                  ],
                  {
                    label: L("رابط", "Menu link"),
                    style: { ...FLUSH, paddingTop: 10, hover: { opacity: 75 } },
                  },
                ),
              ),
              {
                label: L("روابط القسم", "Department links"),
                style: { justifyContent: "center", gap: 28 },
                mobile: { justifyContent: "start", gap: 18 },
              },
            ),
          ],
          {
            label: L("الحاوية", "Container"),
            style: { paddingTop: 0, paddingBottom: 0 },
          },
        ),
        t.divider({ style: { marginTop: 0, marginBottom: 0 } }),
      ],
    ),
});
