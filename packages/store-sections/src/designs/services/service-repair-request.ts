/**
 * Repair request (Services W-i): on the start side a large title and a short
 * promise; on the end side one of the store's forms in a paper card. The
 * design's device chips and problem box are fields the seller adds to that
 * form (a choice and a long text field); its photo drop zone is left out, as
 * store forms have no file field. Requests arrive in the dashboard. Mobile
 * stacks the title above the form.
 */
import { defineDesign } from "../builder";
import { L, PAPER_CARD } from "../_kit";
import { dotLabel } from "../_modular";

export const serviceRepairRequest = defineDesign({
  id: "service-repair-request",
  version: 1,
  category: "services",
  subcategory: "requests",
  name: L("طلب صيانة", "Repair request"),
  description: L(
    "عنوان كبير ووعد بالرد، وجنبه نموذج طلب الصيانة.",
    "A big title and a reply promise beside the repair request form.",
  ),
  keywords: [
    "services",
    "repair",
    "request",
    "form",
    "support",
    "صيانة",
    "طلب",
    "نموذج",
  ],
  tree: (t) =>
    t.section({ label: L("طلب صيانة", "Repair request") }, [
      t.container(
        [
          t.grid(
            [
              t.stack(
                [
                  dotLabel(t, L("صيانة", "Repair")),
                  t.heading(
                    L("قولنا إيه المشكلة", "Tell us what is wrong"),
                    "h2",
                    {
                      role: "title",
                      style: {
                        fontSize: "display-md",
                        letterSpacing: "tight",
                        lineHeight: "tight",
                      },
                    },
                  ),
                  t.paragraph(
                    L(
                      "هنرد عليك بالسعر والمعاد في أقل من ساعة.",
                      "We reply with a price and a time within an hour.",
                    ),
                    { role: "subtitle", style: { maxWidth: "40ch" } },
                  ),
                ],
                {
                  label: L("العنوان", "Heading"),
                  role: "intro",
                  style: { gap: 14 },
                },
              ),
              t.stack([t.storeForm()], {
                label: L("النموذج", "Form card"),
                style: {
                  ...PAPER_CARD,
                  radius: 24,
                  paddingTop: 32,
                  paddingBottom: 32,
                  paddingStart: 32,
                  paddingEnd: 32,
                },
                mobile: {
                  paddingTop: 22,
                  paddingBottom: 22,
                  paddingStart: 22,
                  paddingEnd: 22,
                },
              }),
            ],
            {
              label: L("التخطيط", "Layout"),
              columns: { desktop: 2, mobile: 1 },
              style: { gap: 56, alignItems: "start" },
              mobile: { gap: 24 },
            },
          ),
        ],
        { label: L("الحاوية", "Container") },
      ),
    ]),
});
