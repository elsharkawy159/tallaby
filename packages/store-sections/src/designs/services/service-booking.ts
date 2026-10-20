/**
 * Book a visit (Services W-c): the service and how long it takes, the
 * technician's visit windows as a 3-column grid, the visiting days with a
 * WhatsApp link, and the store's booking form (preferred date and time). The
 * design picks a date and a free slot and strikes out taken ones, which needs
 * a booking system the store does not have; here the windows are information
 * the seller types and the request goes through the form, so nothing looks
 * like a live slot picker.
 */
import { defineDesign } from "../builder";
import { L, arrowLink } from "../_kit";
import { WHATSAPP_LINK } from "./_shared";

const WINDOWS = [
  L("١٠ ص", "10 am"),
  L("١٢ الضهر", "12 pm"),
  L("٢ م", "2 pm"),
  L("٤ م", "4 pm"),
  L("٦ م", "6 pm"),
  L("٨ م", "8 pm"),
];

export const serviceBooking = defineDesign({
  id: "service-booking",
  version: 1,
  category: "services",
  subcategory: "requests",
  name: L("احجز معاد", "Book a visit"),
  description: L(
    "مواعيد زيارة الفني، وتحتها نموذج طلب الحجز.",
    "The technician’s visit times over a booking request form.",
  ),
  keywords: [
    "services",
    "booking",
    "appointment",
    "visit",
    "technician",
    "حجز",
    "معاد",
    "فني",
  ],
  tree: (t) =>
    t.section({ label: L("احجز معاد", "Book a visit") }, [
      t.container(
        [
          t.stack(
            [
              t.stack(
                [
                  t.heading(L("احجز معاد الفني", "Book a technician"), "h2", {
                    role: "title",
                    style: { fontSize: "4xl", letterSpacing: "tight" },
                    mobile: { fontSize: "3xl" },
                  }),
                  t.paragraph(
                    L(
                      "تركيب شاشة · حوالي ساعة",
                      "TV mounting · about one hour",
                    ),
                    { role: "subtitle" },
                  ),
                  t.text(L("مواعيد الزيارات", "Visit windows"), {
                    style: {
                      fontSize: "sm",
                      fontWeight: "semibold",
                      color: "muted",
                      marginTop: 8,
                    },
                  }),
                  t.grid(
                    WINDOWS.map((w) =>
                      t.stack(
                        [
                          t.text(w, {
                            style: {
                              fontWeight: "semibold",
                              textAlign: "center",
                            },
                          }),
                        ],
                        {
                          label: L("معاد", "Window"),
                          style: {
                            background: "secondary",
                            radius: 12,
                            justifyContent: "center",
                            minHeight: 52,
                          },
                        },
                      ),
                    ),
                    {
                      label: L("المواعيد", "Windows"),
                      role: "items",
                      columns: { desktop: 3 },
                      style: { gap: 8 },
                    },
                  ),
                  t.row(
                    [
                      t.row(
                        [
                          t.icon("clock", {
                            style: { fontSize: "lg", color: "muted" },
                          }),
                          t.text(L("من السبت للخميس", "Saturday to Thursday"), {
                            style: { fontWeight: "semibold" },
                          }),
                        ],
                        {
                          label: L("الأيام", "Days"),
                          style: { gap: 10, wrap: false },
                        },
                      ),
                      arrowLink(
                        t,
                        L("أو احجز على واتساب", "Or book on WhatsApp"),
                        WHATSAPP_LINK,
                      ),
                    ],
                    {
                      label: L("الأيام", "Days bar"),
                      style: {
                        justifyContent: "between",
                        alignItems: "center",
                        gap: 16,
                      },
                    },
                  ),
                  t.divider({ style: { marginTop: 8, marginBottom: 8 } }),
                  t.storeForm({ formTemplate: "booking" }),
                ],
                {
                  label: L("الحجز", "Booking"),
                  style: { width: "100%", maxWidth: "760px", gap: 18 },
                },
              ),
            ],
            { label: L("التوسيط", "Centre"), style: { alignItems: "center" } },
          ),
        ],
        { label: L("الحاوية", "Container") },
      ),
    ]),
});
