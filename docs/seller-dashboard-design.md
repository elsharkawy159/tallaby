# Seller dashboard design system

The look from `Seller Dashboard/` (Claude Design, v3), as code. Page agents read this instead of the foundation code.

```tsx
import { PageContainer, PageHeader, SectionCard, SellerButton } from "@/components/seller-ui";
```

Live reference: the dashboard home, `apps/dashboard/app/(main)/page.tsx` and `_components/*`.

## How it switches on

`.seller-shell` sits on the root of `app/(main)/layout.tsx`. Every rule in `app/globals.css` that restyles anything is scoped to it (`:root:has(.seller-shell)`, which also reaches portals). `(builder)`, the store preview, `/login`, `/signup` and `/roadmap` are untouched.

Unconverted pages already get: colours, the page wash, fonts, a bigger `--radius`, 24px `Card`s, pill `Tabs`, dark ink on amber `Button`s, table head colours, softer menus, 28px dialogs that become bottom sheets at 480px, and white pill toasts. Converting a page means replacing its layout with the primitives below.

## Tokens

Use semantic tokens with Tailwind's variable syntax: `text-(--s-ink)`, `bg-(--s-surface)`, `border-(--s-line)`, `hover:bg-(--s-hover)`. They have dark values. **Never hard-code a design hex in a page.**

| Token | Light | Use |
|---|---|---|
| `--s-ink` | `#0d3743` | Headings, big numbers |
| `--s-text` | `#26393e` | Strong body text, row titles, inputs |
| `--s-body` | `#33464b` | Body text |
| `--s-muted` | `#5f7277` | Descriptions |
| `--s-subtle` | `#7b8f94` | Captions, units, icons |
| `--s-faint` | `#8a9ca1` | Section labels, hints |
| `--s-line` / `--s-line-soft` | `#e6eef0` / `#edf1f2` | Card borders / dividers inside cards |
| `--s-field` / `--s-field-strong` | `#e3ebed` / `#cfdde1` | Input and pill borders / radios, dashed zones |
| `--s-surface` / `--s-surface-2` | `#fff` / `#f8fafa` | Solid surface / table head |
| `--s-glass` | white 92% | Card background over the wash |
| `--s-tint` / `--s-fill` / `--s-hover` | `#f6fafb` / `#f1f5f6` / teal-50 | Row hover, notes / tracks, neutral chips / nav and icon-button hover |
| `--s-primary` / `--s-link` | teal-700 | Focus borders, bars, checked states / links |
| `--s-solid` / `--s-solid-hover` / `--s-solid-fg` | teal-900 / `#0a2c36` / white | Active pills, solid buttons |
| `--s-info` / `--s-info-soft` | `#1d5fa8` / `#e8f1fb` | Blue tone |
| `--s-focus-soft` | teal 8% | Focus glow behind an input |
| `--s-shadow-card` / `-hover` / `-menu` / `-pop` / `-bar` | | Card, card hover, menus, dialogs, save bar |

shadcn utilities are mapped to the design too and are fine to use: `bg-accent text-accent-foreground` (amber), `bg-primary`, `bg-primary-soft text-primary-ink`, `bg-accent-soft text-accent-ink`, `bg-success-soft text-success`, `bg-destructive-soft text-destructive`.

Raw scales `--tallaby-teal-{50,100,300,500,700,900}` and `--tallaby-amber-{50,100,600,700}` exist but **do not change in dark mode**. Use them only for text sitting on amber or on a teal surface.

Motion: `--t-fast` (.15s), `--t-base` (.25s), `--t-slow` (.35s). `.sui-rise` is the section entrance; stagger with `[animation-delay:.1s]`. Reduced motion is handled globally.

Type: Noto Kufi Arabic and Montserrat are on `body`. Numbers, money, hosts and codes use `font-montserrat tabular-nums`; wrap LTR content in `<bdi dir="ltr">`.

Sizes: page title 22–28px, card title 15.5px, section card title 16.5px, body 13–14px, captions 12–12.5px. Weights are 600 or 700. Radii: page card 24 (20 at ≤600), row list 20, option card 16, input 14, tile 12, icon button 11, everything clickable-and-small a full pill.

## Primitives

All from `@/components/seller-ui`.

| Part | Usage |
|---|---|
| `PageContainer` | `<PageContainer>` wraps every page: padding, 1360px max, section gaps. `narrow` is the 960px form column. |
| `PageHeader` | `<PageHeader title="…" description="…" actions={<SellerButton…/>} />` holds the page's `h1`. |
| `SellerCard` | `<SellerCard>` is the plain card surface. It renders a `section`; pass `aria-labelledby`. |
| `SellerCardHeader` | `<SellerCardHeader title="…" description="…" action={…} />` for dashboard-style cards (`.ch`). |
| `SectionCard` | `<SectionCard icon={Truck} title="…" description="…" action={<Toggle/>}>…</SectionCard>` for settings (`.sec`/`.shd`). |
| `TwoColumns` | Two equal columns, one at ≤860px (`.g2c`). |
| `IconTile` | `<IconTile icon={Star} tone="accent" />`. Tones: primary, accent, success, danger, info, solid, neutral. |
| `SellerButton` | `variant`: amber (one main action per screen), solid, outline, whatsapp, danger, mini. `size`: default 42, sm 36, xs 34 (40 on phones). `asChild` to style a `Link`. |
| `IconButton` | `<IconButton aria-label="…"><X /></IconButton>`, 36px, 40 on phones. |
| `TextAction` | Quiet "see all": `<TextAction asChild><Link…>…</Link></TextAction>`. |
| `PageTabs` | `<PageTabs tabs={[{ key, label, icon, href }]} />` for links, or `value` + `onChange` for buttons. Sticky under the top bar; scrolls sideways on phones. |
| `Field` | `<Field label="…" hint="…" note="…" error="…" htmlFor="x"><TextInput id="x" /></Field>` |
| `TextInput`, `TextArea`, `NativeSelect` | Plain elements with the design's look; `ref` works with react-hook-form. |
| `InputGroup` | `<InputGroup start="https://" end="ج.م" value=… />` for a fixed part. |
| `fieldClass` | The same look for anything else: `<SelectTrigger className={fieldClass} />`. |
| `FieldRow` | Two fields, one column at ≤720px. |
| `Toggle` | `<Toggle checked={on} onCheckedChange={setOn} label="…" />` or `name` + `defaultChecked` in a plain form. |
| `CheckRow` | `<CheckRow label="…" description="…" checked=… onChange=… />` |
| `OptionCards`, `OptionCard` | `<OptionCard name="x" value="a" title="…" description="…" checked=… onChange=… />`. `type="checkbox"` for many. |
| `Chips`, `Chip` | `<Chip pressed={on} onClick=…>…</Chip>` |
| `Segmented` | `<Segmented value={v} onChange={setV} options={[{ value, label }]} />`; `solid` for the dark look. Client only (it takes a function). |
| `Rows`, `Row` | `<Rows><Row start={…} title="…" description="…" end={…} /></Rows>` |
| `StatusBadge` | `<StatusBadge tone="success">…</StatusBadge>`, with a dot. Tones: success, danger, warning, info, muted. |
| `Tag` | Small label, no dot, same tones. |
| `CountPill` | Amber number; renders nothing at 0. |
| `EmptyState` | `<EmptyState icon={Package} title="…" description="…" action={…} />` |
| `DropZone` | `<DropZone title="…" hint="…" accept="image/*" multiple onFiles={fn} />` |
| `Note` | `<Note>…</Note>`, `tone="amber"`, `"danger"` or `"success"`. |
| `SaveBar` | `<SaveBar dirty={dirty} saving={saving} onSave={save} onDiscard={reset} />`. Inside a `<form>`, omit `onSave` and it submits. Warns before closing the tab. |
| `Modal` | `<Modal open onOpenChange title="…" description="…" footer={<>…</>}>…</Modal>`. |
| `AnchoredSheet` | A panel on its button, a bottom sheet at ≤600px. Notifications and the store switcher use it. |
| `KpiGrid`, `KpiCard` | `<KpiCard href label icon value unit footer delta={12.5} />`. No charts, by owner's decision. |
| `DeltaBadge` | Green `TrendingUp` or red `TrendingDown` with the percentage; `null` shows a dash. |
| `StatStrip`, `StatItem` | The slim row of secondary numbers (`.strip`). |
| `ResponsiveTable` | See below. |
| Toasts | `import { toast } from "sonner"`, then `toast.success("…")`. Already styled. |

`ResponsiveTable` turns into rows at ≤720px with no sideways scroll, and works in server components:

```tsx
<ResponsiveTable
  label="Orders"
  rows={orders}
  rowKey={(o) => o.id}
  rowHref={(o) => `/orders?order=${o.id}`}
  rowLabel={(o) => o.number}
  columns={[
    { key: "customer", header: "Customer", phone: "title", cell: (o) => o.name },
    { key: "total", header: "Total", phone: "end", cell: (o) => o.total },
    { key: "number", header: "Order", phone: "sub", cell: (o) => o.number },
    { key: "status", header: "Status", phone: "endSub", cell: (o) => <StatusBadge>…</StatusBadge> },
    { key: "date", header: "Date", phone: "hide", cell: (o) => o.date },
  ]}
/>
```

`phone` places a cell in the row: `title`/`end` first line, `sub`/`endSub` second line, `full` its own line with its header as a label (the default), `hide` drops it. `wideOnly` also hides a column up to 1020px. A control inside a linked row needs `relative z-10`.

## Page conventions

```tsx
<PageContainer>                {/* or narrow, for a settings or form page */}
  <PageHeader … />
  <PageTabs … />               {/* directly under the header */}
  <SectionCard … />            {/* one card per topic, 20px apart */}
  <SaveBar … />                {/* last; fixed, so its place in the tree doesn't matter */}
</PageContainer>
```

- Grids between cards use `gap-3.5`. Breakpoints come from the design: 1180, 1020, 720, 600, 480. Write them as `max-[720px]:` rather than `md:`.
- Saving: forms that hold unsaved state use `SaveBar`. `PageActionBar` still exists for pages not converted yet; don't use it in new work.
- `DashboardMain` already adds bottom padding for the floating support button.
- Sticky things sit under the top bar: 68px tall, 60px at ≤600. `PageTabs` handles its own offset.
- Add every string to both `ar.json` and `en.json`. Arabic stays formal even where the mockup is colloquial.

## Mobile

- The sidebar is a drawer up to 1020px; language, theme and install move into it at ≤600px. The top bar then holds menu, search, wallet and bell.
- The WhatsApp button floats only up to 1020px (the sidebar card replaces it on desktop) and rises above an open `SaveBar`.
- Touch targets are at least 40px: the primitives switch at ≤600px. Check anything custom.
- Dialogs and alert dialogs become bottom sheets at ≤480px, on every page, with no extra code. To opt out, add `className="sui-no-sheet"` (the command palette does, because a keyboard would cover it).
- Tables never scroll the page sideways: use `ResponsiveTable`.
- Inputs are 16px on touch phones so iOS doesn't zoom (already global).

## Dark mode

There is no dark mockup. The values extend the dark palette in `Seller Add Product.html`. If you use the tokens above, dark mode works. The only hard-coded surfaces are on the always-dark setup card and save bar. Don't write `bg-white`, `text-[#…]` or `dark:` overrides in pages; add a token if one is missing. Check the main page of every task in dark.

## Don't

- Change `packages/ui` defaults, or add global element or `[data-slot]` CSS without the shell scope.
- Hard-code mock numbers, names or phone numbers.
- Add a mockup control with no real behaviour behind it.
