/**
 * Returns (library D-f, reworked): one bordered card with the title, a line
 * on the return window, three numbered steps (send the request, we confirm,
 * hand it back by courier pickup or at a branch) and one of the store's forms
 * at the end. The design's tap-to-pick item tiles and reason chips need the
 * order's items and a script; a returns form (the ready-made "Returns" form
 * fits: order number, return or exchange, reason) asks instead, and the
 * request reaches the seller's inbox. With no form picked the section shows nothing publicly.
 */
import type { ElementIconName } from "../../elements/registry";
import type { NodeTemplate } from "../../elements/tree";
import { defineDesign, type DesignText, type TreeBuilder } from "../builder";
import { L, N } from "../_kit";
import { TRACK_CARD, TRACK_CARD_MOBILE } from "./_shared";

const OPTIONS: {
  icon: ElementIconName;
  title: ReturnType<typeof L>;
  note: ReturnType<typeof L>;
}[] = [
  {
    icon: "truck",
    title: L("المندوب ياخده", "Courier pickup"),
    note: L("من عنوانك خلال يومين", "From your address within 2 days"),
  },
  {
    icon: "store",
    title: L("سلّمه في الفرع", "Drop it at a branch"),
    note: L("في مواعيد العمل", "During opening hours"),
  },
];

function step(
  t: TreeBuilder,
  n: string,
  title: DesignText,
  body: NodeTemplate,
): NodeTemplate {
  return t.stack(
    [
      t.row(
        [
          t.box(
            [
              t.text(N(n), {
                style: {
                  fontWeight: "bold",
                  fontSize: "sm",
                  color: "background",
                  textAlign: "center",
                },
              }),
            ],
            {
              label: L("الرقم", "Number"),
              style: {
                background: "foreground",
                radius: 999,
                width: "28px",
                minHeight: 28,
                paddingTop: 4,
                paddingBottom: 4,
              },
            },
          ),
          t.heading(title, "h3", { style: { fontSize: "lg" } }),
        ],
        {
          label: L("عنوان الخطوة", "Step title"),
          style: { gap: 10, wrap: false, alignItems: "center" },
        },
      ),
      body,
    ],
    {
      label: L("خطوة", "Step"),
      style: { gap: 12, paddingTop: 20, paddingBottom: 20 },
    },
  );
}

export const trackReturns = defineDesign({
  id: "track-returns",
  version: 1,
  category: "tracking",
  subcategory: "returns",
  name: L("طلب استرجاع", "Return request"),
  description: L(
    "خطوات الاسترجاع الثلاثة ونموذج الاسترجاع من نماذج متجرك؛ الطلبات توصلك في صندوق الوارد.",
    "The three return steps and your store's returns form; requests reach your inbox.",
  ),
  keywords: [
    "returns",
    "exchange",
    "refund",
    "order",
    "form",
    "استرجاع",
    "استبدال",
    "مرتجع",
  ],
  tree: (t) =>
    t.section({ label: L("الاسترجاع", "Returns") }, [
      t.container(
        [
          t.stack(
            [
              t.heading(
                L("رجّع أو بدّل منتج", "Return or exchange an item"),
                "h2",
                {
                  role: "title",
                  style: { fontSize: "display-sm", letterSpacing: "tight" },
                },
              ),
              t.paragraph(
                L(
                  "عندك ١٤ يوم من الاستلام ترجّع أو تبدّل أي منتج بحالته.",
                  "You have 14 days from delivery to return or exchange any unused item.",
                ),
                {
                  role: "subtitle",
                  style: { marginBottom: 8 },
                },
              ),
              t.stack(
                [
                  step(
                    t,
                    "1",
                    L("ابعتلنا الطلب", "Send us a request"),
                    t.paragraph(
                      L(
                        "املا النموذج اللي تحت برقم الطلب والسبب.",
                        "Fill in the form below with your order number and the reason.",
                      ),
                    ),
                  ),
                  t.divider(),
                  step(
                    t,
                    "2",
                    L("هنأكد معاك", "We confirm with you"),
                    t.paragraph(
                      L(
                        "هنكلمك خلال يوم عمل نتفق على الاسترجاع أو الاستبدال.",
                        "We contact you within a working day to agree the return or exchange.",
                      ),
                    ),
                  ),
                  t.divider(),
                  step(
                    t,
                    "3",
                    L("إزاي ترجّعه", "How to send it back"),
                    t.grid(
                      OPTIONS.map((o) =>
                        t.row(
                          [
                            t.icon(o.icon, {
                              style: { fontSize: "xl", color: "primary" },
                            }),
                            t.stack(
                              [
                                t.text(o.title, {
                                  style: { fontWeight: "semibold" },
                                }),
                                t.text(o.note, {
                                  style: { fontSize: "sm", color: "muted" },
                                }),
                              ],
                              { label: L("النص", "Copy"), style: { gap: 2 } },
                            ),
                          ],
                          {
                            label: L("طريقة", "Option"),
                            style: {
                              gap: 14,
                              wrap: false,
                              alignItems: "center",
                              background: "secondary",
                              radius: 16,
                              minHeight: 72,
                              paddingTop: 12,
                              paddingBottom: 12,
                              paddingStart: 18,
                              paddingEnd: 18,
                            },
                          },
                        ),
                      ),
                      {
                        label: L("طرق الإرجاع", "Options"),
                        role: "items",
                        columns: { desktop: 2, mobile: 1 },
                        style: { gap: 10 },
                      },
                    ),
                  ),
                ],
                { label: L("الخطوات", "Steps"), style: { gap: 0 } },
              ),
              t.box([t.storeForm()], {
                label: L("بطاقة النموذج", "Form card"),
                style: {
                  background: "secondary",
                  radius: 20,
                  marginTop: 8,
                  paddingTop: 24,
                  paddingBottom: 24,
                  paddingStart: 24,
                  paddingEnd: 24,
                },
                mobile: {
                  paddingTop: 18,
                  paddingBottom: 18,
                  paddingStart: 16,
                  paddingEnd: 16,
                },
              }),
            ],
            {
              label: L("البطاقة", "Card"),
              style: {
                ...TRACK_CARD,
                gap: 8,
                paddingTop: 40,
                paddingBottom: 40,
                paddingStart: 40,
                paddingEnd: 40,
              },
              mobile: TRACK_CARD_MOBILE,
            },
          ),
        ],
        { label: L("الحاوية", "Container"), style: { maxWidth: "820px" } },
      ),
    ]),
});
