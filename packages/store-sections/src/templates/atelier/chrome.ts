/**
 * Atelier header and footer: the library's Centered crest (H-b) and Centered
 * links (footer) dressed for a fashion house. The store name is plain text
 * with role `storeName`; "Use template" fills in the store's real name.
 */
import type { NodeTemplate } from "../../elements/tree";
import { defineDesign, type DesignText, type TreeBuilder } from "../../designs/builder";
import { L } from "../../designs/_kit";
import { FLUSH, LINKS } from "./_shared";

export const ATELIER_STORE_NAME = L("ميزون نور", "Maison Nour");

const MENU_START = [
  { text: L("الجديد", "New in"), href: LINKS.newIn },
  { text: L("المتجر", "Shop"), href: LINKS.shop },
  { text: L("عن الدار", "The house"), href: LINKS.about },
];
const MENU_END = [
  { text: L("الأسئلة", "FAQ"), href: LINKS.faq },
  { text: L("تواصل", "Contact"), href: LINKS.contact },
];

function menu(t: TreeBuilder, items: { text: DesignText; href: string }[], opts: Parameters<TreeBuilder["row"]>[1] = {}): NodeTemplate {
  return t.row(
    items.map((item) =>
      t.link(item.href, [t.text(item.text, { style: { fontSize: "xs", fontWeight: "medium", letterSpacing: "wider", textTransform: "uppercase" } })], {
        label: L("رابط", "Menu link"),
        style: { ...FLUSH, paddingTop: 6, paddingBottom: 6, color: "foreground", hover: { opacity: 60 } },
      }),
    ),
    { label: L("القائمة", "Menu"), role: "menu", ...opts, style: { gap: 28, alignItems: "center", ...opts?.style } },
  );
}

function iconLink(t: TreeBuilder, icon: "search" | "heart" | "user" | "shopping-bag", href: string, label: DesignText): NodeTemplate {
  return t.link(href, [t.icon(icon, { style: { fontSize: "lg", color: "foreground" } })], {
    label,
    style: { width: "40px", paddingTop: 9, paddingBottom: 7, paddingStart: 0, paddingEnd: 0, textAlign: "center", hover: { opacity: 60 } },
  });
}

export const atelierHeader = defineDesign({
  id: "atelier-header",
  version: 1,
  category: "headers",
  subcategory: "centered-logo",
  name: L("أتيليه: شعار في المنتصف", "Atelier: centered crest"),
  description: L(
    "شريط إعلان، والقائمة على جانبي اسم المتجر، والبحث والمفضلة والحساب والسلة.",
    "An announcement bar, the menu on both sides of the store name, then search, wishlist, account and cart.",
  ),
  keywords: ["header", "atelier", "fashion", "centered", "هيدر", "موضة"],
  tree: (t) =>
    t.section({ label: L("الهيدر", "Header"), style: { paddingTop: 0, paddingBottom: 0, background: "background" }, mobile: { paddingTop: 0, paddingBottom: 0 } }, [
      t.box(
        [
          t.text(L("وصلت قطع الخريف الجديدة · توصيل لكل محافظات مصر", "The autumn pieces are in · Delivery across Egypt"), {
            role: "announcement",
            style: { color: "background", fontSize: "xs", letterSpacing: "wide", textAlign: "center" },
          }),
        ],
        { label: L("شريط الإعلان", "Announcement bar"), style: { background: "foreground", paddingTop: 9, paddingBottom: 9, paddingStart: 16, paddingEnd: 16 } },
      ),
      t.box([], { label: L("خط ذهبي", "Gold rule"), style: { background: "accent", minHeight: 1 } }),
      t.container(
        [
          t.grid(
            [
              menu(t, MENU_START, { tablet: { hidden: true }, mobile: { hidden: true } }),
              t.link(
                "/",
                [
                  t.stack(
                    [
                      t.text(ATELIER_STORE_NAME, {
                        role: "storeName",
                        style: { fontFamily: "heading", fontWeight: "bold", fontSize: "3xl", letterSpacing: "wide", textAlign: "center", lineHeight: "tight" },
                        mobile: { fontSize: "xl" },
                      }),
                      t.text(L("قطع هادئة، مفصّلة في القاهرة", "Quiet pieces, cut in Cairo"), {
                        role: "tagline",
                        style: { color: "muted", fontSize: "xs", textAlign: "center", letterSpacing: "wide" },
                        mobile: { hidden: true },
                      }),
                    ],
                    { label: L("الشعار", "Crest"), style: { gap: 4, alignItems: "center" } },
                  ),
                ],
                { label: L("رابط الرئيسية", "Home link"), role: "logo", style: FLUSH },
              ),
              t.row(
                [
                  menu(t, MENU_END, { tablet: { hidden: true }, mobile: { hidden: true } }),
                  t.row(
                    [
                      iconLink(t, "search", LINKS.shop, L("بحث", "Search")),
                      iconLink(t, "heart", LINKS.wishlist, L("المفضلة", "Wishlist")),
                      iconLink(t, "user", LINKS.account, L("حسابي", "Account")),
                      iconLink(t, "shopping-bag", LINKS.cart, L("السلة", "Cart")),
                    ],
                    { label: L("الأيقونات", "Icons"), style: { gap: 2, wrap: false }, mobile: { gap: 0 } },
                  ),
                ],
                { label: L("النهاية", "End"), style: { gap: 24, justifyContent: "end", wrap: false } },
              ),
            ],
            {
              label: L("الشريط", "Bar"),
              columns: { desktop: 3, tablet: 2, mobile: 2 },
              style: { gap: 16, alignItems: "center", paddingTop: 22, paddingBottom: 22 },
              mobile: { paddingTop: 14, paddingBottom: 10, gap: 8 },
            },
          ),
          menu(t, [...MENU_START, ...MENU_END], {
            label: L("قائمة الجوال", "Mobile menu"),
            style: { hidden: true, justifyContent: "center", gap: 20, paddingBottom: 12, wrap: true },
            mobile: { gap: 14, justifyContent: "start" },
          }),
        ],
        { label: L("الحاوية", "Container"), style: { paddingTop: 0, paddingBottom: 0 } },
      ),
      t.divider({ label: L("خط سفلي", "Bottom rule"), style: { marginTop: 0, marginBottom: 0 } }),
    ]),
});

const FOOTER_LINKS = [
  { text: L("الجديد", "New in"), href: LINKS.newIn },
  { text: L("المتجر", "Shop"), href: LINKS.shop },
  { text: L("عن الدار", "The house"), href: LINKS.about },
  { text: L("المدوّنة", "Journal"), href: LINKS.journal },
  { text: L("تواصل", "Contact"), href: LINKS.contact },
];
const HELP_LINKS = [
  { text: L("طلباتي", "My orders"), href: LINKS.orders },
  { text: L("الشحن", "Shipping"), href: LINKS.shipping },
  { text: L("الاسترجاع", "Returns"), href: LINKS.returns },
  { text: L("الأسئلة الشائعة", "FAQs"), href: LINKS.faq },
  { text: L("الخصوصية", "Privacy"), href: LINKS.privacy },
  { text: L("الشروط", "Terms"), href: LINKS.terms },
];

const SOCIAL = [
  { icon: "instagram" as const, href: "https://www.instagram.com/", label: L("إنستجرام", "Instagram") },
  { icon: "facebook" as const, href: "https://www.facebook.com/", label: L("فيسبوك", "Facebook") },
  { icon: "chat" as const, href: "https://wa.me/", label: L("واتساب", "WhatsApp") },
];

function linkRow(t: TreeBuilder, links: { text: DesignText; href: string }[], label: DesignText, muted: boolean): NodeTemplate {
  return t.row(
    links.map((l) =>
      t.link(l.href, [t.text(l.text, { style: { fontSize: muted ? "xs" : "sm", letterSpacing: muted ? "normal" : "wide", ...(muted ? {} : { textTransform: "uppercase" }) } })], {
        label: L("رابط", "Link"),
        style: { ...FLUSH, paddingTop: 4, paddingBottom: 4, color: muted ? "muted" : "foreground", hover: { opacity: 60 } },
      }),
    ),
    { label, role: "menu", style: { gap: 28, justifyContent: "center", wrap: true }, mobile: { gap: 16 } },
  );
}

export const atelierFooter = defineDesign({
  id: "atelier-footer",
  version: 1,
  category: "footers",
  subcategory: "payment-trust",
  name: L("أتيليه: روابط في النص", "Atelier: centered links"),
  description: L("اسم المتجر بخط كبير، وصفّا روابط، والسوشيال وحقوق النشر في المنتصف.", "The store name in large serif, two rows of links, social and copyright, centred."),
  keywords: ["footer", "atelier", "centered", "فوتر", "موضة"],
  tree: (t) =>
    t.section({ label: L("الفوتر", "Footer"), style: { paddingTop: 0, paddingBottom: 40, background: "secondary" } }, [
      t.box([], { label: L("خط ذهبي", "Gold rule"), style: { background: "accent", minHeight: 1 } }),
      t.container(
        [
          t.stack(
            [
              t.link(
                "/",
                [
                  t.text(ATELIER_STORE_NAME, {
                    role: "storeName",
                    style: { fontFamily: "heading", fontWeight: "bold", fontSize: "4xl", letterSpacing: "wide", textAlign: "center" },
                    mobile: { fontSize: "2xl" },
                  }),
                ],
                { label: L("رابط الرئيسية", "Home link"), role: "logo", style: FLUSH },
              ),
              t.text(L("قطع هادئة من خامات طبيعية، مفصّلة في القاهرة.", "Quiet pieces in natural fabrics, cut in Cairo."), {
                role: "tagline",
                style: { color: "muted", fontSize: "sm", textAlign: "center" },
              }),
              linkRow(t, FOOTER_LINKS, L("روابط المتجر", "Store links"), false),
              linkRow(t, HELP_LINKS, L("روابط المساعدة", "Help links"), true),
              t.row(
                SOCIAL.map((s) =>
                  t.link(s.href, [t.icon(s.icon, { style: { fontSize: "md", color: "foreground" } })], {
                    label: s.label,
                    style: {
                      width: "40px",
                      paddingTop: 11,
                      paddingBottom: 8,
                      paddingStart: 0,
                      paddingEnd: 0,
                      borderWidth: 1,
                      borderColor: "border",
                      textAlign: "center",
                      hover: { borderColor: "foreground" },
                    },
                  }),
                ),
                { label: L("التواصل الاجتماعي", "Social links"), role: "social", style: { gap: 8, justifyContent: "center" } },
              ),
              t.divider({ style: { marginTop: 8, marginBottom: 0, width: "100%" } }),
              t.text(L("© ٢٠٢٦ ميزون نور. كل الحقوق محفوظة.", "© 2026 Maison Nour. All rights reserved."), {
                role: "copyright",
                style: { color: "muted", fontSize: "xs", textAlign: "center" },
              }),
            ],
            { label: L("المحتوى", "Content"), style: { gap: 22, alignItems: "center", paddingTop: 64 }, mobile: { paddingTop: 44, gap: 18 } },
          ),
        ],
        { label: L("الحاوية", "Container") },
      ),
    ]),
});
