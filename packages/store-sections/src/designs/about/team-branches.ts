/**
 * Our branches (library Y-f): branch cards in a row, each with a map tile and
 * pin, the name, the address, the opening hours with a sun dot, and
 * directions and call buttons. The hours are typed text: a tree cannot tell
 * whether a branch is open right now. Cards stack on mobile.
 */
import { aboutDesign } from "./_rules";
import { L } from "../_kit";
import { modHead, pillButton } from "../_modular";

const MAPS = "https://maps.google.com";
const PHONE = "tel:+201012345678";

const BRANCHES = [
  { name: L("فرع الدقي", "Dokki"), address: L("٢٤ شارع التحرير، الدقي", "24 Tahrir St, Dokki"), hours: L("يوميًا من ١٢ الضهر لـ ١١ م", "Daily, 12 pm – 11 pm") },
  { name: L("فرع مدينة نصر", "Nasr City"), address: L("سيتي ستارز، الدور الأول", "City Stars, level 1"), hours: L("يوميًا من ١٠ ص لـ ١٠ م", "Daily, 10 am – 10 pm") },
  { name: L("فرع المعادي", "Maadi"), address: L("شارع ٩، المعادي", "Road 9, Maadi"), hours: L("السبت – الخميس، ١٢ – ١٠ م", "Sat – Thu, 12 – 10 pm") },
];

export const teamBranches = aboutDesign({
  id: "team-branches",
  version: 2,
  category: "about",
  subcategory: "branches",
  name: L("فروعنا", "Our branches"),
  description: L("كروت الفروع بالعنوان والمواعيد وزرار الاتجاهات والاتصال.", "Branch cards with address, hours, and directions and call buttons."),
  keywords: ["about", "branches", "stores", "locations", "visit", "من نحن", "فروعنا", "زورنا"],
  tree: (t) =>
    t.section({ label: L("الفروع", "Branches") }, [
      t.container(
        [
          modHead(t, { label: L("الفروع", "Branches"), title: L("زورنا", "Visit us") }),
          t.grid(
            BRANCHES.map((b) =>
              t.stack(
                [
                  t.stack([t.icon("map-pin", { style: { fontSize: "4xl", color: "primary" } })], {
                    label: L("الخريطة", "Map tile"),
                    style: { background: "secondary", alignItems: "center", justifyContent: "center", minHeight: 160 },
                    mobile: { minHeight: 120 },
                  }),
                  t.stack(
                    [
                      t.heading(b.name, "h3", { role: "title", style: { fontSize: "xl" } }),
                      t.text(b.address, { style: { color: "muted", fontSize: "sm" } }),
                      t.row(
                        [
                          t.box([], { label: L("النقطة", "Dot"), style: { background: "accent", radius: 999, width: "8px", minHeight: 8 } }),
                          t.text(b.hours, { style: { fontSize: "sm", fontWeight: "medium" } }),
                        ],
                        { label: L("المواعيد", "Hours"), style: { gap: 8 } },
                      ),
                    ],
                    { label: L("البيانات", "Details"), style: { gap: 6, paddingTop: 20, paddingStart: 20, paddingEnd: 20 } },
                  ),
                  t.row(
                    [
                      pillButton(t, L("الاتجاهات", "Directions"), MAPS, { icon: "map-pin", tone: "outline", style: { width: "100%" } }),
                      t.link(PHONE, [t.icon("phone", { style: { fontSize: "lg", color: "foreground" } })], {
                        label: L("اتصل", "Call"),
                        style: {
                          borderWidth: 2,
                          borderColor: "border",
                          radius: 999,
                          paddingTop: 12,
                          paddingBottom: 12,
                          paddingStart: 14,
                          paddingEnd: 14,
                          hover: { borderColor: "primary" },
                        },
                      }),
                    ],
                    { label: L("الأزرار", "Buttons"), style: { gap: 8, wrap: false, paddingTop: 20, paddingBottom: 20, paddingStart: 20, paddingEnd: 20 } },
                  ),
                ],
                {
                  label: L("فرع", "Branch"),
                  style: { gap: 0, borderWidth: 1, borderColor: "border", radius: 24, overflow: "hidden", justifyContent: "between" },
                },
              ),
            ),
            {
              label: L("الفروع", "Branches"),
              role: "items",
              columns: { desktop: 3, tablet: 2, mobile: 1 },
              style: { gap: 16, alignItems: "stretch" },
            },
          ),
        ],
        { label: L("الحاوية", "Container") },
      ),
    ]),
});
