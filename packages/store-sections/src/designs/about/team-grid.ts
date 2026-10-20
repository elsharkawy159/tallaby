/**
 * Team grid (library Y-c): a card per person, with a large initial on a
 * coloured square tile (brand, shelf, sun), the name and the role. A tile can
 * be swapped for a photo. Two per row on tablet and mobile.
 */
import type { StyleValues } from "../../elements/style";
import { defineDesign } from "../builder";
import { L } from "../_kit";
import { modHead } from "../_modular";

const TEAM = [
  { initial: L("م", "M"), name: L("منى عادل", "Mona Adel"), role: L("المؤسسة", "Founder") },
  { initial: L("ك", "K"), name: L("كريم سامي", "Karim Samy"), role: L("المشتريات", "Buying") },
  { initial: L("ي", "Y"), name: L("ياسمين فؤاد", "Yasmine Fouad"), role: L("خدمة العملاء", "Customer care") },
  { initial: L("ع", "O"), name: L("عمر حسن", "Omar Hassan"), role: L("التوصيل", "Delivery") },
];

const TONES: { tile: StyleValues; ink: string }[] = [
  { tile: { background: "primary" }, ink: "primaryInk" },
  { tile: { background: "secondary" }, ink: "foreground" },
  { tile: { background: "accent" }, ink: "foreground" },
  { tile: { background: "secondary" }, ink: "foreground" },
];

export const teamGrid = defineDesign({
  id: "team-grid",
  version: 1,
  category: "about",
  subcategory: "team",
  name: L("الفريق", "Team grid"),
  description: L("كارت لكل حد في الفريق بالحرف الأول والاسم والدور.", "A card for each person on the team with initial, name and role."),
  keywords: ["about", "team", "people", "staff", "من نحن", "الفريق", "فريق العمل"],
  tree: (t) =>
    t.section({ label: L("الفريق", "Team") }, [
      t.container(
        [
          modHead(t, { label: L("الفريق", "Team"), title: L("الناس اللي ورا المحل", "The people behind the store") }),
          t.grid(
            TEAM.map((p, i) => {
              const tone = TONES[i % TONES.length]!;
              return t.stack(
                [
                  t.stack(
                    [
                      t.text(p.initial, {
                        style: { fontFamily: "heading", fontWeight: "bold", fontSize: "6xl", lineHeight: "tight", color: tone.ink, textAlign: "center" },
                        mobile: { fontSize: "5xl" },
                      }),
                    ],
                    {
                      label: L("الصورة الرمزية", "Avatar"),
                      style: { ...tone.tile, radius: 24, aspectRatio: "square", justifyContent: "center", marginBottom: 12 },
                    },
                  ),
                  t.text(p.name, { role: "title", style: { fontFamily: "heading", fontWeight: "semibold", fontSize: "lg" }, mobile: { fontSize: "md" } }),
                  t.text(p.role, { style: { color: "muted", fontSize: "sm" } }),
                ],
                { label: L("الشخص", "Person"), style: { gap: 4 } },
              );
            }),
            {
              label: L("الفريق", "Team"),
              role: "items",
              columns: { desktop: 4, tablet: 2, mobile: 2 },
              style: { gap: 16 },
              mobile: { gap: 12 },
            },
          ),
        ],
        { label: L("الحاوية", "Container") },
      ),
    ]),
});
