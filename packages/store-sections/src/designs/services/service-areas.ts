/**
 * Service areas (Services W-h): on the start side the title, a legend and a
 * WhatsApp link for areas not listed; on the end side a two-column list of
 * areas, each with a dot (filled for available, outlined for coming soon) and
 * its status in words, so status never rests on colour alone. Areas are
 * typed by the seller.
 */
import type { NodeTemplate } from "../../elements/tree";
import { defineDesign, type DesignText, type TreeBuilder } from "../builder";
import { L, arrowLink } from "../_kit";
import { RULED, RULED_CELL } from "../_modular";
import { WHATSAPP_LINK } from "./_shared";

const AREAS = [
  { name: L("الدقي", "Dokki"), on: true },
  { name: L("المهندسين", "Mohandessin"), on: true },
  { name: L("مدينة نصر", "Nasr City"), on: true },
  { name: L("المعادي", "Maadi"), on: true },
  { name: L("التجمع الخامس", "New Cairo"), on: true },
  { name: L("٦ أكتوبر", "6th of October"), on: true },
  { name: L("الشيخ زايد", "Sheikh Zayed"), on: false },
  { name: L("العبور", "Obour"), on: false },
];

function dot(t: TreeBuilder, on: boolean): NodeTemplate {
  return t.box([], {
    label: L("النقطة", "Dot"),
    style: {
      radius: 999,
      width: "12px",
      minHeight: 12,
      borderWidth: 2,
      borderColor: "primary",
      background: on ? "primary" : "transparent",
    },
  });
}

function legend(t: TreeBuilder, on: boolean, text: DesignText): NodeTemplate {
  return t.row([dot(t, on), t.text(text, { style: { fontSize: "sm" } })], {
    label: L("مفتاح", "Key"),
    style: { gap: 8, wrap: false, alignItems: "center" },
  });
}

export const serviceAreas = defineDesign({
  id: "service-areas",
  version: 1,
  category: "services",
  subcategory: "process",
  name: L("مناطق الخدمة", "Service areas"),
  description: L(
    "المناطق اللي بنزورها، المتاح منها واللي قريبًا.",
    "The areas you visit, available now or coming soon.",
  ),
  keywords: [
    "services",
    "areas",
    "coverage",
    "home visit",
    "مناطق",
    "تغطية",
    "زيارة",
  ],
  tree: (t) =>
    t.section({ label: L("مناطق الخدمة", "Service areas") }, [
      t.container(
        [
          t.grid(
            [
              t.stack(
                [
                  t.heading(L("بنوصلك فين؟", "Where do we visit?"), "h2", {
                    role: "title",
                    style: { fontSize: "display-sm", letterSpacing: "tight" },
                  }),
                  t.row(
                    [
                      legend(t, true, L("متاح", "Available")),
                      legend(t, false, L("قريبًا", "Coming soon")),
                    ],
                    {
                      label: L("المفتاح", "Legend"),
                      style: { gap: 20 },
                    },
                  ),
                  arrowLink(
                    t,
                    L("منطقتك مش موجودة؟ كلمنا", "Area not listed? Message us"),
                    WHATSAPP_LINK,
                    { style: { marginTop: 8 } },
                  ),
                ],
                {
                  label: L("العنوان", "Heading"),
                  role: "intro",
                  style: { gap: 16 },
                },
              ),
              t.grid(
                AREAS.map((a) =>
                  t.row(
                    [
                      t.row(
                        [
                          dot(t, a.on),
                          t.text(a.name, { style: { fontWeight: "medium" } }),
                        ],
                        {
                          label: L("الاسم", "Name"),
                          style: { gap: 12, wrap: false, alignItems: "center" },
                        },
                      ),
                      t.text(
                        a.on ? L("متاح", "Available") : L("قريبًا", "Soon"),
                        { style: { fontSize: "xs", color: "muted" } },
                      ),
                    ],
                    {
                      label: L("منطقة", "Area"),
                      style: {
                        ...RULED_CELL,
                        gap: 12,
                        wrap: false,
                        alignItems: "center",
                        justifyContent: "between",
                        paddingTop: 14,
                        paddingBottom: 14,
                        paddingStart: 18,
                        paddingEnd: 18,
                      },
                    },
                  ),
                ),
                {
                  label: L("المناطق", "Areas"),
                  role: "items",
                  columns: { desktop: 2, mobile: 1 },
                  style: { ...RULED, radius: 18 },
                },
              ),
            ],
            {
              label: L("التخطيط", "Layout"),
              columns: { desktop: 2, mobile: 1 },
              style: { gap: 48, alignItems: "start" },
              mobile: { gap: 24 },
            },
          ),
        ],
        { label: L("الحاوية", "Container") },
      ),
    ]),
});
