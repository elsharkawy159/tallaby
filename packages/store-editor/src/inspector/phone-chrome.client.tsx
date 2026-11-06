"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { useTranslations } from "next-intl";
import { ArrowDown, ArrowUp, Eye, EyeOff, Plus, RotateCcw, X } from "lucide-react";
import type { SectionInstance, SiteLocale } from "@workspace/store-sections";
import {
  BOTTOM_NAV_FIXED,
  BOTTOM_NAV_FIXED_LABELS,
  BOTTOM_NAV_FIXED_TYPES,
  BOTTOM_NAV_ICONS,
  BOTTOM_NAV_ICON_COMPONENTS,
  BOTTOM_NAV_MAX_ITEMS,
  MOBILE_MENU_MAX_ADDED,
  bottomNavIcon,
  bottomNavItems,
  bottomNavKey,
  mobileMenuRows,
  readBottomNavItems,
  readMobileMenu,
  sectionText,
  setBottomNavItems,
  setMobileMenu,
  type BottomNavFixedType,
  type BottomNavIcon,
  type BottomNavItem,
  type MobileMenuConfig,
} from "@workspace/store-sections/render";
import { Popover, PopoverContent, PopoverTrigger } from "@workspace/ui/components/popover";
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from "@workspace/ui/components/select";
import { cn } from "@workspace/ui/lib/utils";
import type { EditorPage } from "../state/editor.store";
import { nameOf } from "../panels/pages-panel.client";

type Update = (update: (instance: SectionInstance) => SectionInstance, coalesceKey?: string) => void;

/** Store pages a seller can link from the phone chrome: not Home (a fixed place) and not the product page. */
const linkablePages = (pages: readonly EditorPage[]) => pages.filter((p) => !p.isHome && p.kind !== "product");
const pageLabel = (page: EditorPage) => ({ ar: page.name.ar || page.name.en || page.slug, en: page.name.en || page.name.ar || page.slug });

const ICON_BUTTON =
  "grid size-8 shrink-0 place-items-center rounded-lg max-lg:size-10 text-(--s-muted) transition-colors hover:bg-(--s-hover) hover:text-(--s-ink) disabled:pointer-events-none disabled:opacity-35 focus-visible:outline-2 focus-visible:outline-(--s-primary)";

/** A card in the header's Content tab; opened and scrolled to when the seller clicked its part on the canvas. */
function PhoneCard({ title, hint, focused, children }: { title: string; hint: string; focused: boolean; children: ReactNode }) {
  const ref = useRef<HTMLFieldSetElement>(null);
  useEffect(() => {
    if (focused) ref.current?.scrollIntoView({ block: "start", behavior: "smooth" });
  }, [focused]);
  return (
    <fieldset ref={ref} className={cn("mb-4 min-w-0 space-y-2.5 rounded-md border p-3 scroll-mt-3", focused && "border-(--s-primary) ring-2 ring-(--s-primary)/20")}>
      <legend className="px-1 text-xs font-medium text-muted-foreground">{title}</legend>
      <p className="text-xs text-muted-foreground">{hint}</p>
      {children}
    </fieldset>
  );
}

/** Up / down buttons (keyboard and touch friendly; no drag needed). */
function MoveButtons({ index, count, onMove, label }: { index: number; count: number; onMove: (to: number) => void; label: string }) {
  const t = useTranslations("storeEditor.sidebar.phone");
  return (
    <>
      <button type="button" className={ICON_BUTTON} disabled={index === 0} onClick={() => onMove(index - 1)} aria-label={t("moveUp", { name: label })} title={t("moveUp", { name: label })}>
        <ArrowUp className="size-4" aria-hidden />
      </button>
      <button type="button" className={ICON_BUTTON} disabled={index === count - 1} onClick={() => onMove(index + 1)} aria-label={t("moveDown", { name: label })} title={t("moveDown", { name: label })}>
        <ArrowDown className="size-4" aria-hidden />
      </button>
    </>
  );
}

const move = <T,>(list: readonly T[], from: number, to: number): T[] => {
  const next = [...list];
  const [item] = next.splice(from, 1);
  next.splice(to, 0, item!);
  return next;
};

/**
 * The phone bottom bar (owner, F-74): reorder, add a store page or a fixed
 * place (each with a ready icon, changeable), remove; 1 to 5 items. Saved on
 * the header (`props.bottomNavItems`), so it is a draft until Publish.
 */
export function BottomNavEditor({
  instance,
  onChange,
  pages,
  locale,
  focused,
  enabled,
}: {
  instance: SectionInstance;
  onChange: Update;
  pages: readonly EditorPage[];
  locale: SiteLocale;
  focused: boolean;
  /** The header's "Bottom navigation on phones" option. */
  enabled: boolean;
}) {
  const t = useTranslations("storeEditor.sidebar.phone");
  const items = bottomNavItems(instance);
  const custom = readBottomNavItems(instance) !== null;
  const save = (next: readonly BottomNavItem[]) => onChange((current) => setBottomNavItems(current, next));
  const used = new Set(items.map(bottomNavKey));
  const labelOf = (item: BottomNavItem) => {
    if (item.type !== "page") return sectionText(BOTTOM_NAV_FIXED_LABELS[item.type], locale);
    const page = pages.find((p) => p.id === item.pageId) ?? pages.find((p) => p.slug === item.slug);
    return item.label[locale] || (page ? nameOf(page.name, locale) : "") || item.label.ar || item.label.en || item.slug;
  };
  const freePlaces = BOTTOM_NAV_FIXED_TYPES.filter((type) => !used.has(type));
  const freePages = linkablePages(pages).filter((p) => !used.has(`page:${p.id}`) && !items.some((i) => i.type === "page" && i.slug === p.slug));
  const full = items.length >= BOTTOM_NAV_MAX_ITEMS;
  const add = (value: string) => {
    if (full) return;
    if (value.startsWith("place:")) save([...items, { type: value.slice(6) as BottomNavFixedType }]);
    const page = value.startsWith("page:") ? pages.find((p) => p.id === value.slice(5)) : undefined;
    if (page) save([...items, { type: "page", pageId: page.id, slug: page.slug, label: pageLabel(page) }]);
  };

  return (
    <PhoneCard title={t("bottomNav.title")} hint={enabled ? t("bottomNav.hint", { max: BOTTOM_NAV_MAX_ITEMS }) : t("bottomNav.off")} focused={focused}>
      <ol className="space-y-1.5">
        {items.map((item, index) => {
          const label = labelOf(item);
          return (
            <li key={bottomNavKey(item)} className="flex items-center gap-1 rounded-lg border border-(--s-line) bg-(--s-surface) py-1 ps-1 pe-1">
              <IconPicker value={bottomNavIcon(item)} label={label} onPick={(icon) => save(items.map((it, i) => (i === index ? { ...it, icon } : it)))} />
              <span className="min-w-0 flex-1 truncate text-[13px] font-medium text-(--s-ink)">{label}</span>
              <MoveButtons index={index} count={items.length} label={label} onMove={(to) => save(move(items, index, to))} />
              <button
                type="button"
                className={ICON_BUTTON}
                disabled={items.length === 1}
                onClick={() => save(items.filter((_, i) => i !== index))}
                aria-label={t("remove", { name: label })}
                title={t("remove", { name: label })}
              >
                <X className="size-4" aria-hidden />
              </button>
            </li>
          );
        })}
      </ol>
      <AddSelect
        placeholder={full ? t("bottomNav.full", { max: BOTTOM_NAV_MAX_ITEMS }) : t("addItem")}
        disabled={full || (!freePlaces.length && !freePages.length)}
        onPick={add}
        places={freePlaces.map((type) => ({ value: `place:${type}`, label: sectionText(BOTTOM_NAV_FIXED_LABELS[type], locale) }))}
        pages={freePages.map((p) => ({ value: `page:${p.id}`, label: nameOf(p.name, locale) || p.slug }))}
      />
      {custom && <ResetButton onReset={() => save([])} />}
    </PhoneCard>
  );
}

/** The short icon list: a grid of 32px buttons in a popover. */
function IconPicker({ value, label, onPick }: { value: BottomNavIcon; label: string; onPick: (icon: BottomNavIcon) => void }) {
  const t = useTranslations("storeEditor.sidebar.phone");
  const Icon = BOTTOM_NAV_ICON_COMPONENTS[value];
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button type="button" className={cn(ICON_BUTTON, "bg-(--s-tint) text-(--s-ink)")} aria-label={t("changeIcon", { name: label })} title={t("changeIcon", { name: label })}>
          <Icon className="size-4" aria-hidden />
        </button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-auto p-2">
        <div role="listbox" aria-label={t("changeIcon", { name: label })} className="grid grid-cols-6 gap-1">
          {BOTTOM_NAV_ICONS.map((key) => {
            const Choice = BOTTOM_NAV_ICON_COMPONENTS[key];
            return (
              <button
                key={key}
                type="button"
                role="option"
                aria-selected={key === value}
                aria-label={key}
                onClick={() => onPick(key)}
                className={cn(ICON_BUTTON, key === value && "bg-(--s-hover) text-(--s-ink) ring-1 ring-(--s-primary)")}
              >
                <Choice className="size-4" aria-hidden />
              </button>
            );
          })}
        </div>
      </PopoverContent>
    </Popover>
  );
}

function AddSelect({
  placeholder,
  disabled,
  onPick,
  places,
  pages,
}: {
  placeholder: string;
  disabled: boolean;
  onPick: (value: string) => void;
  places: { value: string; label: string }[];
  pages: { value: string; label: string }[];
}) {
  const t = useTranslations("storeEditor.sidebar.phone");
  return (
    // Reset after each pick (value stays empty), so the same list adds the next item.
    <Select value="" onValueChange={onPick} disabled={disabled}>
      <SelectTrigger size="sm" className="h-9 w-full text-[13px]" aria-label={t("addItem")}>
        <Plus className="size-4" aria-hidden />
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {places.length > 0 && (
          <SelectGroup>
            <SelectLabel>{t("places")}</SelectLabel>
            {places.map((o) => (
              <SelectItem key={o.value} value={o.value}>
                {o.label}
              </SelectItem>
            ))}
          </SelectGroup>
        )}
        {pages.length > 0 && (
          <SelectGroup>
            <SelectLabel>{t("pages")}</SelectLabel>
            {pages.map((o) => (
              <SelectItem key={o.value} value={o.value}>
                {o.label}
              </SelectItem>
            ))}
          </SelectGroup>
        )}
      </SelectContent>
    </Select>
  );
}

function ResetButton({ onReset }: { onReset: () => void }) {
  const t = useTranslations("storeEditor.sidebar.phone");
  return (
    <button type="button" onClick={onReset} className="inline-flex min-h-8 items-center gap-1.5 text-xs font-medium text-(--s-primary) hover:underline">
      <RotateCcw className="size-3.5" aria-hidden />
      {t("reset")}
    </button>
  );
}

/** Fixed places a menu row can link to (a store page comes from the page list). */
const MENU_PLACES: readonly BottomNavFixedType[] = ["shop", "search", "blog", "account", "orders", "wishlist", "cart"];

/**
 * The phone menu sheet (owner, F-74): the rows the burger opens, in their
 * order. Rename a row (this language), hide or show it, move it, add a store
 * page or a fixed place, remove an added one. Saved on the header
 * (`props.mobileMenu`); the header's own menu links keep feeding it.
 */
export function MobileMenuEditor({
  instance,
  onChange,
  pages,
  locale,
  focused,
}: {
  instance: SectionInstance;
  onChange: Update;
  pages: readonly EditorPage[];
  locale: SiteLocale;
  focused: boolean;
}) {
  const t = useTranslations("storeEditor.sidebar.phone");
  const rows = mobileMenuRows(instance, locale);
  const config = readMobileMenu(instance);
  const save = (update: (config: MobileMenuConfig) => MobileMenuConfig, key?: string) => onChange((current) => setMobileMenu(current, update(readMobileMenu(current))), key);
  const hrefs = new Set(rows.map((r) => r.href));
  const full = config.added.length >= MOBILE_MENU_MAX_ADDED;

  const rename = (id: string, added: boolean, text: string) =>
    save((c) => {
      const value = text.replace(/\s+/g, " ").trim();
      if (added) {
        // An added row keeps a name: emptying this language falls back to the other one.
        return { ...c, added: c.added.map((link) => (link.id === id ? { ...link, label: { ...link.label, [locale]: value || undefined } } : link)) };
      }
      const { [id]: old, ...labels } = c.labels;
      const next = { ...old, [locale]: value || undefined };
      return { ...c, labels: next.ar || next.en ? { ...labels, [id]: next } : labels };
    });
  const add = (value: string) => {
    const id = `a${Date.now().toString(36)}`;
    const place = value.startsWith("place:") ? (value.slice(6) as BottomNavFixedType) : null;
    const page = value.startsWith("page:") ? pages.find((p) => p.id === value.slice(5)) : undefined;
    const link = place
      ? { id, href: BOTTOM_NAV_FIXED[place], label: { ar: sectionText(BOTTOM_NAV_FIXED_LABELS[place], "ar"), en: sectionText(BOTTOM_NAV_FIXED_LABELS[place], "en") } }
      : page
        ? { id, href: `/${page.slug}`, label: pageLabel(page) }
        : null;
    if (link) save((c) => ({ ...c, added: [...c.added, link], order: [...rows.map((r) => r.id), id] }));
  };

  return (
    <PhoneCard title={t("menu.title")} hint={t("menu.hint")} focused={focused}>
      {rows.length === 0 ? (
        <p className="rounded-lg bg-(--s-tint) p-2.5 text-xs text-(--s-muted)">{t("menu.empty")}</p>
      ) : (
        <ol className="space-y-1.5">
          {rows.map((row, index) => (
            <li key={row.id} className={cn("flex items-center gap-1 rounded-lg border border-(--s-line) bg-(--s-surface) py-1 ps-2 pe-1", row.hidden && "bg-(--s-tint)")}>
              <input
                // Saved on blur or Enter, so typing is one undo step.
                key={`${row.id}:${locale}:${row.label}`}
                defaultValue={row.label}
                dir="auto"
                maxLength={60}
                aria-label={t("menu.rename", { name: row.label })}
                onBlur={(e) => e.currentTarget.value.trim() !== row.label && rename(row.id, row.added, e.currentTarget.value)}
                onKeyDown={(e) => e.key === "Enter" && e.currentTarget.blur()}
                className={cn(
                  "h-8 min-w-0 flex-1 rounded-md bg-transparent max-lg:h-10 max-lg:text-base px-1.5 text-[13px] font-medium text-(--s-ink) outline-none focus:bg-(--s-tint) focus-visible:ring-2 focus-visible:ring-(--s-primary)/30",
                  row.hidden && "text-(--s-subtle) line-through",
                )}
              />
              <button
                type="button"
                className={ICON_BUTTON}
                aria-pressed={!row.hidden}
                onClick={() => save((c) => ({ ...c, hidden: row.hidden ? c.hidden.filter((id) => id !== row.id) : [...c.hidden, row.id] }))}
                aria-label={t(row.hidden ? "menu.show" : "menu.hide", { name: row.label })}
                title={t(row.hidden ? "menu.show" : "menu.hide", { name: row.label })}
              >
                {row.hidden ? <EyeOff className="size-4" aria-hidden /> : <Eye className="size-4" aria-hidden />}
              </button>
              <MoveButtons index={index} count={rows.length} label={row.label} onMove={(to) => save((c) => ({ ...c, order: move(rows.map((r) => r.id), index, to) }))} />
              {row.added && (
                <button
                  type="button"
                  className={ICON_BUTTON}
                  onClick={() => save((c) => ({ ...c, added: c.added.filter((link) => link.id !== row.id), order: c.order.filter((id) => id !== row.id) }))}
                  aria-label={t("remove", { name: row.label })}
                  title={t("remove", { name: row.label })}
                >
                  <X className="size-4" aria-hidden />
                </button>
              )}
            </li>
          ))}
        </ol>
      )}
      <AddSelect
        placeholder={t("addItem")}
        disabled={full}
        onPick={add}
        places={MENU_PLACES.filter((type) => !hrefs.has(BOTTOM_NAV_FIXED[type])).map((type) => ({ value: `place:${type}`, label: sectionText(BOTTOM_NAV_FIXED_LABELS[type], locale) }))}
        pages={linkablePages(pages)
          .filter((p) => !hrefs.has(`/${p.slug}`))
          .map((p) => ({ value: `page:${p.id}`, label: nameOf(p.name, locale) || p.slug }))}
      />
      {instance.props.mobileMenu !== undefined && <ResetButton onReset={() => save(() => ({ order: [], hidden: [], labels: {}, added: [] }))} />}
    </PhoneCard>
  );
}
