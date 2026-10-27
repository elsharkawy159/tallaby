/**
 * Tallaby Classic header and footer. The store name is text with role
 * `storeName` (and its first letter `storeInitial`); "Use template" and a new
 * store's starting site fill in the store's real name.
 */
import type { NodeTemplate } from "../../elements/tree";
import type { ElementIconName } from "../../elements/registry";
import { defineDesign, type DesignText, type TreeBuilder } from "../../designs/builder";
import { L } from "../../designs/_kit";
import { CARD, FLUSH, LINKS } from "./_shared";

export const CLASSIC_STORE_NAME = L("كلاسيك ستور", "Classic Store");

const MENU = [
  { text: L("الرئيسية", "Home"), href: LINKS.home },
  { text: L("المتجر", "Shop"), href: LINKS.shop },
  { text: L("وصل حديثًا", "New arrivals"), href: LINKS.newest },
  { text: L("المدونة", "Blog"), href: LINKS.blog },
  { text: L("من نحن", "About"), href: LINKS.about },
  { text: L("تواصل معنا", "Contact"), href: LINKS.contact },
];

/** The rounded brand mark (first letter, amber dot) and the store name. */
export function classicLogo(t: TreeBuilder, size: "lg" | "xl" = "xl"): NodeTemplate {
  return t.link(
    LINKS.home,
    [
      t.row(
        [
          t.box(
            [
              t.text(L("ك", "C"), { role: "storeInitial", style: { fontWeight: "extrabold", color: "primaryInk", textAlign: "center", fontSize: "lg" } }),
              t.box([], {
                label: L("النقطة", "Dot"),
                style: {
                  position: "absolute",
                  insetBottom: "-3px",
                  insetEnd: "-3px",
                  width: "12px",
                  minHeight: 12,
                  radius: 999,
                  background: "accent",
                  borderWidth: 2,
                  borderColor: "background",
                },
              }),
            ],
            {
              label: L("العلامة", "Mark"),
              style: { position: "relative", background: "primary", radius: 10, width: "36px", paddingTop: 5, paddingBottom: 5 },
            },
          ),
          t.text(CLASSIC_STORE_NAME, { role: "storeName", style: { fontWeight: "extrabold", fontSize: size, color: "foreground", lineHeight: "tight" }, mobile: { fontSize: "lg" } }),
        ],
        { label: L("الشعار", "Logo"), style: { gap: 10, wrap: false, alignItems: "center" } },
      ),
    ],
    { label: L("رابط الرئيسية", "Home link"), role: "logo", style: FLUSH },
  );
}

function menu(t: TreeBuilder, opts: Parameters<TreeBuilder["row"]>[1] = {}): NodeTemplate {
  return t.row(
    MENU.map((item, i) =>
      t.link(item.href, [t.text(item.text, { style: { fontWeight: "semibold", fontSize: "sm" } })], {
        label: L("رابط", "Menu link"),
        style: {
          paddingTop: 8,
          paddingBottom: 8,
          paddingStart: 14,
          paddingEnd: 14,
          radius: 999,
          ...(i === 0 ? { background: "secondary", color: "primary" } : { color: "foreground", hover: { background: "secondary" } }),
        },
      }),
    ),
    { label: L("القائمة", "Menu"), role: "menu", ...opts, style: { gap: 2, alignItems: "center", ...opts?.style } },
  );
}

function iconLink(t: TreeBuilder, icon: ElementIconName, href: string, label: DesignText, opts: Parameters<TreeBuilder["link"]>[2] = {}): NodeTemplate {
  return t.link(href, [t.icon(icon, { style: { fontSize: "lg", color: "foreground" } })], {
    label,
    ...opts,
    style: { width: "44px", paddingTop: 11, paddingBottom: 9, paddingStart: 0, paddingEnd: 0, radius: 999, textAlign: "center", hover: { background: "secondary" }, ...opts?.style },
  });
}

export const classicHeader = defineDesign({
  id: "tallaby-header",
  version: 2,
  category: "headers",
  subcategory: "commerce",
  name: L("كلاسيك: الهيدر", "Classic: header"),
  description: L(
    "شريط إعلان، ثم الشعار والقائمة ومربع البحث والحساب والمفضلة والسلة.",
    "An announcement bar, then the logo, menu, search box, account, wishlist and cart.",
  ),
  keywords: ["header", "classic", "tallaby", "menu", "هيدر", "كلاسيك"],
  tree: (t) =>
    t.section({ label: L("الهيدر", "Header"), style: { paddingTop: 0, paddingBottom: 0, background: "surface" }, mobile: { paddingTop: 0, paddingBottom: 0 } }, [
      t.box(
        [
          t.text(L("توصيل لكل المحافظات، والدفع عند الاستلام", "Delivery to every governorate, with cash on delivery"), {
            role: "announcement",
            style: { color: "background", fontSize: "sm", fontWeight: "medium", textAlign: "center" },
          }),
        ],
        { label: L("شريط الإعلان", "Announcement bar"), style: { background: "foreground", paddingTop: 8, paddingBottom: 8, paddingStart: 16, paddingEnd: 16 } },
      ),
      t.container(
        [
          t.row(
            [
              classicLogo(t),
              menu(t, { tablet: { hidden: true }, mobile: { hidden: true } }),
              t.row(
                [
                  t.link(
                    LINKS.shop,
                    [
                      t.row([t.icon("search", { style: { color: "muted" } }), t.text(L("ابحث عن منتج", "Search products"), { style: { color: "muted", fontSize: "sm" } })], {
                        label: L("المحتوى", "Content"),
                        style: { gap: 8, wrap: false, alignItems: "center" },
                      }),
                    ],
                    {
                      label: L("البحث", "Search"),
                      style: { background: "secondary", radius: 999, paddingTop: 10, paddingBottom: 10, paddingStart: 14, paddingEnd: 22 },
                      tablet: { hidden: true },
                      mobile: { hidden: true },
                    },
                  ),
                  iconLink(t, "search", LINKS.shop, L("بحث", "Search"), { style: { hidden: true }, tablet: { hidden: false }, mobile: { hidden: false } }),
                  iconLink(t, "user", LINKS.account, L("حسابي", "Account")),
                  iconLink(t, "heart", LINKS.wishlist, L("المفضلة", "Wishlist"), { mobile: { hidden: true } }),
                  iconLink(t, "shopping-bag", LINKS.cart, L("السلة", "Cart")),
                ],
                { label: L("الأدوات", "Actions"), style: { gap: 2, wrap: false, alignItems: "center" } },
              ),
            ],
            {
              label: L("الشريط", "Bar"),
              style: { justifyContent: "between", alignItems: "center", gap: 12, wrap: false, paddingTop: 14, paddingBottom: 14 },
              mobile: { paddingTop: 10, paddingBottom: 10, gap: 6 },
            },
          ),
          menu(t, {
            label: L("قائمة الجوال", "Mobile menu"),
            style: { hidden: true, wrap: true, paddingBottom: 10 },
            tablet: { hidden: false },
            mobile: { hidden: false },
          }),
        ],
        { label: L("الحاوية", "Container"), style: { paddingTop: 0, paddingBottom: 0 } },
      ),
      t.divider({ label: L("خط سفلي", "Bottom rule"), style: { marginTop: 0, marginBottom: 0 } }),
    ]),
});

// The three link columns of template rules §4.3.
const SHOP_LINKS = [
  { text: L("كل المنتجات", "All products"), href: LINKS.shop },
  { text: L("وصل حديثًا", "New arrivals"), href: LINKS.newest },
  { text: L("الأكثر مبيعًا", "Best sellers"), href: LINKS.bestSellers },
  { text: L("المدونة", "Blog"), href: LINKS.blog },
];
const HELP_LINKS = [
  { text: L("تواصل معنا", "Contact us"), href: LINKS.contact },
  { text: L("الأسئلة الشائعة", "FAQs"), href: LINKS.faq },
  { text: L("الشحن والتوصيل", "Shipping & delivery"), href: LINKS.shipping },
  { text: L("الاسترجاع والاستبدال", "Returns & refunds"), href: LINKS.returns },
  { text: L("تتبّع طلبي", "Track my order"), href: LINKS.orders },
];
const POLICY_LINKS = [
  { text: L("من نحن", "About us"), href: LINKS.about },
  { text: L("سياسة الخصوصية", "Privacy policy"), href: LINKS.privacy },
  { text: L("الشروط والأحكام", "Terms & conditions"), href: LINKS.terms },
];
/** The platform credit (template rules §4.3); the storefront draws its own in every footer and drops this one. */
export const TALLABY_URL = "https://tallaby.com";
const SOCIAL: { icon: ElementIconName; href: string; label: DesignText }[] = [
  { icon: "facebook", href: "https://www.facebook.com/", label: L("فيسبوك", "Facebook") },
  { icon: "instagram", href: "https://www.instagram.com/", label: L("إنستجرام", "Instagram") },
  { icon: "chat", href: "https://wa.me/", label: L("واتساب", "WhatsApp") },
];
const PAYMENTS: DesignText[] = ["VISA", "Mastercard", "Meeza", "InstaPay", L("الدفع عند الاستلام", "Cash on delivery")];

function column(t: TreeBuilder, title: DesignText, links: { text: DesignText; href: string }[]): NodeTemplate {
  return t.stack(
    [
      t.heading(title, "h4", { style: { fontSize: "md", fontWeight: "bold" } }),
      ...links.map((l) =>
        t.link(l.href, [t.text(l.text, { style: { fontSize: "sm" } })], {
          label: L("رابط", "Link"),
          style: { ...FLUSH, paddingTop: 4, paddingBottom: 4, color: "muted", hover: { color: "primary" } },
        }),
      ),
    ],
    { label: title, role: "menu", style: { gap: 6 } },
  );
}

export const classicFooter = defineDesign({
  id: "tallaby-footer",
  version: 2,
  category: "footers",
  subcategory: "payment-trust",
  name: L("كلاسيك: الفوتر", "Classic: footer"),
  description: L(
    "الشعار والنبذة والسوشيال، وأعمدة التسوق والمساعدة والسياسات، وطرق الدفع وسطر «مدعوم من طلبي».",
    "Logo, tagline and social links, Shop, Help and Policies columns, payment methods and a Powered by Tallaby line.",
  ),
  keywords: ["footer", "classic", "tallaby", "فوتر", "كلاسيك"],
  tree: (t) =>
    t.section({ label: L("الفوتر", "Footer"), style: { paddingTop: 56, paddingBottom: 28, background: "surface", marginTop: 72 }, mobile: { paddingTop: 40, marginTop: 48 } }, [
      t.container(
        [
          t.grid(
            [
              t.stack(
                [
                  classicLogo(t),
                  t.paragraph(L("أساسيات كل يوم، مختارة بعناية.", "Everyday essentials, picked with care."), {
                    role: "tagline",
                    style: { color: "muted", maxWidth: "320px" },
                  }),
                  t.row(
                    SOCIAL.map((s) =>
                      t.link(s.href, [t.icon(s.icon, { style: { fontSize: "md", color: "foreground" } })], {
                        label: s.label,
                        style: { width: "40px", paddingTop: 10, paddingBottom: 8, paddingStart: 0, paddingEnd: 0, radius: 999, background: "secondary", textAlign: "center", hover: { background: "accent" } },
                      }),
                    ),
                    { label: L("التواصل الاجتماعي", "Social links"), role: "social", style: { gap: 8 } },
                  ),
                ],
                { label: L("المتجر", "Brand"), style: { gap: 14, alignItems: "start" } },
              ),
              column(t, L("تسوّق", "Shop"), SHOP_LINKS),
              column(t, L("المساعدة", "Help"), HELP_LINKS),
              column(t, L("السياسات", "Policies"), POLICY_LINKS),
            ],
            {
              label: L("الأعمدة", "Columns"),
              columns: { desktop: 4, tablet: 2, mobile: 1 },
              style: { gap: 32 },
              mobile: { gap: 28 },
            },
          ),
          t.divider({ style: { marginTop: 36, marginBottom: 20 } }),
          t.row(
            [
              t.row(
                [
                  t.text(L("© ٢٠٢٦ كلاسيك ستور. كل الحقوق محفوظة.", "© 2026 Classic Store. All rights reserved."), {
                    role: "copyright",
                    style: { color: "muted", fontSize: "xs" },
                  }),
                  t.link(TALLABY_URL, [t.text(L("مدعوم من طلبي", "Powered by Tallaby"), { style: { fontSize: "xs", fontWeight: "semibold" } })], {
                    label: L("مدعوم من طلبي", "Powered by Tallaby"),
                    role: "poweredBy",
                    style: { ...FLUSH, color: "muted", hover: { color: "primary" } },
                  }),
                ],
                { label: L("الحقوق", "Legal"), style: { gap: 14, alignItems: "center" } },
              ),
              t.row(
                PAYMENTS.map((p) =>
                  t.text(p, {
                    style: { ...CARD, radius: 8, fontSize: "xs", fontWeight: "bold", color: "muted", paddingTop: 4, paddingBottom: 4, paddingStart: 10, paddingEnd: 10 },
                  }),
                ),
                { label: L("طرق الدفع", "Payment methods"), role: "payments", style: { gap: 6 } },
              ),
            ],
            { label: L("السطر السفلي", "Bottom row"), style: { justifyContent: "between", alignItems: "center", gap: 16 } },
          ),
        ],
        { label: L("الحاوية", "Container") },
      ),
    ]),
});
