/**
 * Service cards (Services W-a): a hairline-ruled row of service cells, each
 * with an icon on a brand disc, the service name, one line of description and
 * the starting price over an arrow. Every cell is a link the seller points at
 * the service's page or their WhatsApp. Names and prices are typed text.
 */
import { defineDesign } from "../builder";
import { L, sectionHead } from "../_kit";
import { FLUSH, RULED, RULED_CELL } from "../_modular";
import { CONTACT_LINK } from "./_shared";

const SERVICES = [
  {
    icon: "package",
    name: L("تركيب في البيت", "Home installation"),
    text: L(
      "نركّب الشاشة أو الرسيفر ونظبط القنوات.",
      "We mount your TV or box and set up the channels.",
    ),
    price: L("من ٢٥٠ ج.م", "From EGP 250"),
  },
  {
    icon: "wrench",
    name: L("صيانة وإصلاح", "Repair"),
    text: L(
      "تغيير بطارية أو شاشة في نفس اليوم.",
      "Same-day battery and screen replacement.",
    ),
    price: L("من ١٥٠ ج.م", "From EGP 150"),
  },
  {
    icon: "rotate",
    name: L("استبدل القديم", "Trade-in"),
    text: L(
      "جيب جهازك القديم وخد خصم على الجديد.",
      "Bring your old device, get credit on a new one.",
    ),
    price: L("مجانًا", "Free"),
  },
  {
    icon: "shield",
    name: L("مد الضمان", "Extended warranty"),
    text: L(
      "سنة أو سنتين زيادة على ضمان الوكيل.",
      "One or two extra years on top of the brand warranty.",
    ),
    price: L("من ١٩٩ ج.م", "From EGP 199"),
  },
] as const;

export const serviceCards = defineDesign({
  id: "service-cards",
  version: 1,
  category: "services",
  subcategory: "list",
  name: L("كروت الخدمات", "Service cards"),
  description: L(
    "صف خدمات: أيقونة واسم وسطر وصف وسعر يبدأ من.",
    "A row of services: icon, name, one line and a starting price.",
  ),
  keywords: [
    "services",
    "after-sales",
    "repair",
    "installation",
    "خدمات",
    "صيانة",
    "تركيب",
  ],
  tree: (t) =>
    t.section({ label: L("الخدمات", "Services") }, [
      t.container(
        [
          sectionHead(t, {
            eyebrow: L("الخدمات", "Services"),
            title: L("خدمات بعد البيع", "After-sales services"),
            subtitle: L(
              "عشان جهازك يفضل شغال زي الجديد.",
              "To keep your device working like new.",
            ),
          }),
          t.grid(
            SERVICES.map((s) =>
              t.link(
                CONTACT_LINK,
                [
                  t.stack(
                    [
                      t.box(
                        [
                          t.icon(s.icon, {
                            style: { fontSize: "xl", color: "primaryInk" },
                          }),
                        ],
                        {
                          label: L("أيقونة", "Icon"),
                          style: {
                            background: "primary",
                            radius: 999,
                            width: "52px",
                            paddingTop: 13,
                            paddingBottom: 11,
                            textAlign: "center",
                            marginBottom: 12,
                          },
                          mobile: {
                            width: "44px",
                            paddingTop: 10,
                            paddingBottom: 8,
                          },
                        },
                      ),
                      t.heading(s.name, "h3", {
                        style: { fontSize: "xl" },
                        mobile: { fontSize: "md" },
                      }),
                      t.paragraph(s.text, {
                        style: { fontSize: "sm" },
                        mobile: { fontSize: "xs" },
                      }),
                    ],
                    {
                      label: L("المحتوى", "Content"),
                      style: { gap: 10, minHeight: 170 },
                      mobile: { minHeight: 160 },
                    },
                  ),
                  t.divider({ style: { marginTop: 14, marginBottom: 14 } }),
                  t.row(
                    [
                      t.text(s.price, {
                        style: { fontWeight: "semibold", fontSize: "md" },
                        mobile: { fontSize: "sm" },
                      }),
                      t.icon("arrow", {
                        style: { fontSize: "md", color: "primary" },
                      }),
                    ],
                    {
                      label: L("السعر", "Price"),
                      style: { justifyContent: "between", alignItems: "center", gap: 8, wrap: false },
                    },
                  ),
                ],
                {
                  label: L("خدمة", "Service"),
                  style: {
                    ...FLUSH,
                    ...RULED_CELL,
                    color: "foreground",
                    paddingTop: 28,
                    paddingBottom: 28,
                    paddingStart: 28,
                    paddingEnd: 28,
                    hover: { background: "secondary" },
                  },
                  mobile: {
                    paddingTop: 18,
                    paddingBottom: 18,
                    paddingStart: 18,
                    paddingEnd: 18,
                  },
                },
              ),
            ),
            {
              label: L("الخدمات", "Services"),
              role: "items",
              columns: { desktop: 4, mobile: 2 },
              style: { ...RULED, marginTop: 32 },
              mobile: { marginTop: 24 },
            },
          ),
        ],
        { label: L("الحاوية", "Container") },
      ),
    ]),
});
