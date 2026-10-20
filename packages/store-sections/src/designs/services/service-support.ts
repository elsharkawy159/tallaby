/**
 * Support channels (Services W-k): three large bento tiles in a row:
 * WhatsApp in brand colour, phone in sun and a branch visit in shelf, each
 * with a big icon, the channel, its number or detail, the usual reply time and
 * an arrow. Every tile is a link. Mobile stacks the tiles.
 */
import { defineDesign } from "../builder";
import { L, sectionHead } from "../_kit";
import { BRAND_TILE, FLUSH, SUN_TILE, TILE, TILE_MOBILE } from "../_modular";
import { PHONE_LINK, WHATSAPP_LINK } from "./_shared";

const CHANNELS = [
  {
    icon: "chat",
    name: L("واتساب", "WhatsApp"),
    detail: L("٠١٠ ١٢٣٤ ٥٦٧٨", "010 1234 5678"),
    reply: L("بنرد في أقل من ساعة", "Replies within an hour"),
    href: WHATSAPP_LINK,
    tile: BRAND_TILE,
    ink: "primaryInk",
  },
  {
    icon: "phone",
    name: L("اتصل بينا", "Call us"),
    detail: L("١٩١٢٣", "19123"),
    reply: L("من ١٠ ص لـ ١٠ م", "10 am – 10 pm"),
    href: PHONE_LINK,
    tile: SUN_TILE,
    ink: "foreground",
  },
  {
    icon: "map-pin",
    name: L("زور فرع", "Visit a branch"),
    detail: L("٣ فروع في القاهرة", "3 branches in Cairo"),
    reply: L("من غير معاد", "No appointment"),
    href: "/contact",
    tile: TILE,
    ink: "foreground",
  },
] as const;

export const serviceSupport = defineDesign({
  id: "service-support",
  version: 1,
  category: "services",
  subcategory: "support",
  name: L("اتكلم معانا", "Support channels"),
  description: L(
    "ثلاث مربعات كبيرة: واتساب والتليفون وزيارة الفرع، بمواعيد الرد.",
    "Three big tiles: WhatsApp, phone and a branch visit, with reply times.",
  ),
  keywords: [
    "services",
    "support",
    "help",
    "whatsapp",
    "contact",
    "دعم",
    "مساعدة",
    "واتساب",
  ],
  tree: (t) =>
    t.section({ label: L("الدعم", "Support") }, [
      t.container(
        [
          sectionHead(t, {
            eyebrow: L("الدعم", "Support"),
            title: L("محتاج مساعدة؟", "Need a hand?"),
          }),
          t.grid(
            CHANNELS.map((c) =>
              t.link(
                c.href,
                [
                  t.stack(
                    [
                      t.icon(c.icon, {
                        style: { fontSize: "4xl", color: c.ink },
                      }),
                      t.stack(
                        [
                          t.heading(c.name, "h3", {
                            style: { fontSize: "2xl", color: c.ink },
                          }),
                          t.text(c.detail, {
                            style: {
                              fontSize: "lg",
                              fontWeight: "bold",
                              color: c.ink,
                            },
                          }),
                          t.text(c.reply, {
                            style: {
                              fontSize: "sm",
                              color: c.ink,
                              opacity: 80,
                            },
                          }),
                        ],
                        { label: L("المعلومات", "Details"), style: { gap: 6 } },
                      ),
                      t.row(
                        [
                          t.icon("arrow", {
                            style: { fontSize: "xl", color: c.ink },
                          }),
                        ],
                        {
                          label: L("السهم", "Arrow"),
                          style: { justifyContent: "end" },
                        },
                      ),
                    ],
                    {
                      label: L("المحتوى", "Content"),
                      style: {
                        gap: 20,
                        justifyContent: "between",
                        minHeight: 220,
                      },
                      mobile: { minHeight: 0, gap: 14 },
                    },
                  ),
                ],
                {
                  label: c.name,
                  style: {
                    ...FLUSH,
                    ...c.tile,
                    color: c.ink,
                    paddingTop: 32,
                    paddingBottom: 32,
                    paddingStart: 32,
                    paddingEnd: 32,
                    hover: { opacity: 90 },
                  },
                  mobile: TILE_MOBILE,
                },
              ),
            ),
            {
              label: L("القنوات", "Channels"),
              role: "items",
              columns: { desktop: 3, mobile: 1 },
              style: { gap: 12, marginTop: 32 },
              mobile: { marginTop: 24 },
            },
          ),
        ],
        { label: L("الحاوية", "Container") },
      ),
    ]),
});
