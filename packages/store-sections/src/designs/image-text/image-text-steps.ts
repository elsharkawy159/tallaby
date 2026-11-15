/**
 * Story in steps (motion v2, 2026-11-11, docs/motion-v2-plan.md §5.5, §6): a
 * heading, then three short steps (number, title, one line) beside a photo
 * column that stays in view while they scroll past. On wide screens the
 * column crossfades to the step being read, the other steps dim, and a thin
 * bar under the photo fills as the visitor goes through them. The page
 * scrolls normally (the column is plain CSS sticky).
 *
 * On phones, with reduced motion or with Theme › Animations off, the column
 * is hidden and each step shows its own photo under its text, so the section
 * reads as three stacked steps. Without the script every step is fully
 * visible with the first photo.
 *
 * Roles (`elements/scroll-plan.ts`): `steps` on the grid, `step` on each
 * text block, `steps-media` on the column (its direct photos are the step
 * photos, in order) and `progress` on the bar.
 */
import { defineDesign, type TreeBuilder } from "../builder";
import { L, N, sectionHead } from "../_kit";

const STEPS = [
  {
    no: N("01"),
    title: L("نختار الخامة", "We choose the material"),
    text: L("نختار كل خامة بعناية قبل أن تصل إلى المتجر.", "We choose every material with care before it reaches the shop."),
    photo: 4,
    alt: L("خامات مختارة", "Chosen materials"),
  },
  {
    no: N("02"),
    title: L("نجهّز طلبك بعناية", "We prepare your order with care"),
    text: L("نراجع كل طلب ونجهّزه بعناية.", "We check every order and prepare it with care."),
    photo: 5,
    alt: L("طلب جاهز", "A prepared order"),
  },
  {
    no: N("03"),
    title: L("نشحن طلبك", "We ship your order"),
    text: L("تظهر تكلفة الشحن ومدته عند إتمام الطلب.", "Shipping cost and time are shown at checkout."),
    photo: 6,
    alt: L("طلب جاهز للشحن", "An order ready to ship"),
  },
] as const;

const PHOTO = { aspectRatio: "square", objectFit: "cover", width: "100%", radius: 20 } as const;

function step(t: TreeBuilder, s: (typeof STEPS)[number]) {
  return t.stack(
    [
      t.text(s.no, { style: { fontSize: "sm", fontWeight: "semibold", color: "primary", letterSpacing: "wide" } }),
      t.heading(s.title, "h3", { style: { fontSize: "2xl", lineHeight: "tight" }, mobile: { fontSize: "xl" } }),
      t.paragraph(s.text, { style: { fontSize: "lg", lineHeight: "relaxed", maxWidth: "440px" }, mobile: { fontSize: "md" } }),
      // Shown only where the photo column is not (phones, reduced motion, Animations off).
      t.photo(s.photo, s.alt, { style: { ...PHOTO, marginTop: 8 }, mobile: { radius: 16 } }),
    ],
    {
      label: L("خطوة", "Step"),
      role: "step",
      style: { gap: 12, justifyContent: "center", minHeight: 420, paddingTop: 24, paddingBottom: 24 },
      tablet: { minHeight: 360 },
      mobile: { minHeight: 0, gap: 10, paddingTop: 0, paddingBottom: 0 },
    },
  );
}

export const imageTextSteps = defineDesign({
  id: "image-text-steps",
  version: 1,
  category: "image-text",
  subcategory: "story",
  name: L("قصة بخطوات", "Story in steps"),
  description: L(
    "ثلاث خطوات قصيرة جنب صورة ثابتة بتتغيّر مع كل خطوة وأنت بتنزل، وعلى الموبايل كل خطوة بصورتها.",
    "Three short steps beside a photo that stays in view and changes with each step as you scroll; on phones each step shows its own photo.",
  ),
  keywords: ["image with text", "steps", "story", "how it works", "scroll", "sticky", "صورة ونص", "خطوات", "قصة", "إزاي بنشتغل"],
  tree: (t) =>
    t.section({ label: L("قصة بخطوات", "Story in steps") }, [
      t.container(
        [
          sectionHead(t, {
            eyebrow: L("كيف نعمل", "How we work"),
            title: L("من الخامة إلى طلبك", "From the material to your order"),
            titleMotion: { reveal: "words" },
          }),
          t.grid(
            [
              t.stack(STEPS.map((s) => step(t, s)), {
                label: L("الخطوات", "Steps"),
                // Not one block: each step's title, line and (phone) photo reveal as they arrive.
                motion: { reveal: "none" },
                style: { gap: 0 },
                mobile: { gap: 36 },
              }),
              t.box(
                [
                  ...STEPS.map((s) => t.photo(s.photo, s.alt, { style: PHOTO })),
                  t.box([t.box([], { label: L("التقدم", "Progress"), role: "progress", style: { position: "absolute", insetTop: "0px", insetBottom: "0px", insetStart: "0px", insetEnd: "0px", background: "primary" } })], {
                    label: L("شريط التقدم", "Progress bar"),
                    style: { position: "relative", minHeight: 4, radius: 999, background: "border", overflow: "hidden" },
                  }),
                ],
                { label: L("صور الخطوات", "Step photos"), role: "steps-media", style: { gap: 16 } },
              ),
            ],
            {
              label: L("الخطوات والصور", "Steps and photos"),
              role: "steps",
              columns: { desktop: 2, tablet: 2, mobile: 1 },
              style: { gap: 72, alignItems: "start", marginTop: 16 },
              tablet: { gap: 40 },
              mobile: { gap: 0, marginTop: 8 },
            },
          ),
        ],
        { label: L("الحاوية", "Container") },
      ),
    ]),
});
