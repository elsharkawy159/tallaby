/**
 * Server-renderable element tree (P4B-02). No hooks and no editor imports;
 * styles come from `collectPageCss` (scoped by `data-node-id`), links go
 * through `SmartLink`/`safeHref` and images through `ctx.imageUrl`. Text is
 * always printed as text, never parsed as HTML.
 */
import type { ReactNode } from "react";
import {
  ArrowLeft,
  Award,
  Calendar,
  Check,
  ChevronDown,
  Clock,
  Copy,
  CreditCard,
  Facebook,
  Gift,
  Globe,
  Moon,
  Headphones,
  Heart,
  Image,
  Instagram,
  Leaf,
  Mail,
  MapPin,
  Menu,
  MessageCircle,
  Package,
  Percent,
  Phone,
  Play,
  Plus,
  Quote,
  RotateCcw,
  Search,
  Send,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  Star,
  Store,
  Tag,
  Truck,
  User,
  Users,
  Wrench,
  X,
  Smartphone,
  Youtube,
  Zap,
  type LucideIcon,
} from "lucide-react";
import { MOBILE_COLLAPSE, MOBILE_GROUP, MOBILE_SPLIT } from "../config/header";
import type { ComponentNode } from "../config/schema";
import { sectionText } from "../core/copy";
import { IMAGE_SIZES, imageSource, type RenderContext } from "../core/types";
import { DataEmpty } from "../sections/_data";
import { CarouselElement, SlideElement } from "./render-carousel";
import { FORM_SUBMIT_CLASS, FormFieldsView, formCopy } from "../sections/forms";
import { resolvePhotoSlot } from "../designs/photo-slots";
import { ButtonLink, SmartLink, cn } from "../sections/_primitives";
import { DATA_NODE_NEEDS, boundValue, isDataList, isPaginated, listRecords, nodeFormId, walkNodes, type DataRecord } from "./data";
import { MAX_ELEMENT_DEPTH, PATTERN_VARIANTS, getElementDefinition, type ElementIconName, type PatternVariant } from "./registry";
import { VideoElement, VideoPlaylist } from "./render-video";
import { productSectionEmpty, renderProductElement } from "./product-elements";
import { ProductFlags, hasProductFlags } from "./product-flags";
import { SocialIcon } from "../social/icon";
import { contactRowGone, storeSocialLinks, withStoreContact } from "./store-contact";
import { PaymentLogo, storePayments } from "./store-payments";
import { normalizeStyle } from "./style";
import { REVEAL_CHOICES, REVEAL_MAX_STEP, marqueeSeconds, type RevealChoice, type RevealVariant } from "./motion";
import { CountdownElement } from "./countdown";

const ICONS: Record<ElementIconName, LucideIcon> = {
  star: Star,
  heart: Heart,
  check: Check,
  truck: Truck,
  shield: ShieldCheck,
  gift: Gift,
  phone: Phone,
  mail: Mail,
  "map-pin": MapPin,
  clock: Clock,
  sparkles: Sparkles,
  leaf: Leaf,
  tag: Tag,
  "shopping-bag": ShoppingBag,
  "credit-card": CreditCard,
  arrow: ArrowLeft,
  search: Search,
  user: User,
  menu: Menu,
  plus: Plus,
  quote: Quote,
  chat: MessageCircle,
  instagram: Instagram,
  facebook: Facebook,
  youtube: Youtube,
  play: Play,
  rotate: RotateCcw,
  package: Package,
  image: Image,
  copy: Copy,
  globe: Globe,
  award: Award,
  zap: Zap,
  users: Users,
  store: Store,
  percent: Percent,
  calendar: Calendar,
  headphones: Headphones,
  send: Send,
  wrench: Wrench,
};

const str = (value: unknown, max: number) => (typeof value === "string" ? value.slice(0, max) : "");

/** Fixed decorative backgrounds; colours come from the theme tokens. */
const PATTERN_CLASS: Record<PatternVariant, string> = {
  grid: "[background-image:linear-gradient(var(--sf-line)_1px,transparent_1px),linear-gradient(90deg,var(--sf-line)_1px,transparent_1px)] [background-size:44px_44px] [mask-image:radial-gradient(ellipse_at_center,black_30%,transparent_80%)]",
  dots: "[background-image:radial-gradient(var(--sf-line)_1.5px,transparent_1.5px)] [background-size:20px_20px] [mask-image:radial-gradient(ellipse_at_center,black_35%,transparent_80%)]",
  glow: "[background:radial-gradient(60%_50%_at_50%_0%,color-mix(in_srgb,var(--sf-brand)_18%,transparent),transparent_70%)]",
};

const HEADING_CLASS = {
  h1: "text-4xl font-extrabold leading-tight md:text-5xl",
  h2: "text-2xl font-bold leading-tight md:text-3xl",
  h3: "text-xl font-semibold leading-snug",
  h4: "text-lg font-semibold leading-snug",
} as const;

/** Which prop a `bind` fills on each node type. */
const BIND_TARGET: Partial<Record<string, string>> = {
  heading: "text",
  paragraph: "text",
  text: "text",
  badge: "text",
  blockQuote: "text",
  image: "src",
  button: "href",
  linkBlock: "href",
  textLink: "href",
};

/** A record's key, for React. */
const recordKey = (scope: DataRecord) => scope.record.id;

/** Props of a node inside a list template: bound fields come from the record (`null`: draw nothing). */
function scopedProps(node: ComponentNode, ctx: RenderContext, scope: DataRecord | undefined): Record<string, unknown> | null {
  const props = node.props ?? {};
  const target = BIND_TARGET[node.type];
  if (!target || typeof props.bind !== "string") return props;
  // A bound node outside any record has nothing to show on the storefront; the editor keeps its authored text.
  if (!scope) return ctx.mode === "public" ? null : props;
  const value = boundValue(scope, props.bind, ctx);
  if (value === null) return null;
  const next: Record<string, unknown> = { ...props, [target]: value };
  if (node.type === "image") next.alt = scope.kind === "categoryList" ? scope.record.name : scope.record.title;
  // A product card's photo fades to the product's second photo on hover (storefront only).
  if (node.type === "image" && props.bind === "image" && scope.kind === "productList" && scope.hoverImage !== false && ctx.mode === "public" && scope.record.secondImage) {
    next.secondSrc = scope.record.secondImage;
  }
  return next;
}

/**
 * A section is hidden on the storefront when a required list or its form
 * resolved empty, or when every list did (spec §6 rule 7). An `optional`
 * list (the "more posts" beside a lead post) may be empty on its own.
 */
function missingData(node: ComponentNode, ctx: RenderContext): boolean {
  const lists: { empty: boolean; optional: boolean }[] = [];
  let formMissing = false;
  walkNodes([node], (child) => {
    if (isDataList(child.type)) lists.push({ empty: listRecords(child, ctx).length === 0, optional: child.props?.optional === true });
    if (child.type === "storeForm") {
      const formId = nodeFormId(child);
      if (!formId || !ctx.forms?.[formId]) formMissing = true;
    }
  });
  return formMissing || lists.some((l) => l.empty && !l.optional) || (lists.length > 0 && lists.every((l) => l.empty));
}

/** First descendant of a type (depth-first), for reading a row's stencil. */
function findNode(node: ComponentNode, type: string, depth = 0): ComponentNode | null {
  if (node.type === type) return node;
  if (depth > 4) return null;
  for (const child of node.children) {
    const found = findNode(child, type, depth + 1);
    if (found) return found;
  }
  return null;
}

/**
 * A `role: "social"` row draws the store's own social links (Website › Social
 * media), each in the style of the row's first link: the clones keep that
 * link's and its icon's node ids, so the scoped CSS applies to every one.
 * `undefined`: draw the row as authored (no stencil, or the editor and the
 * store has no links yet). Publicly a store without links gets no row.
 */
function renderSocialRow(node: ComponentNode, ctx: RenderContext, attrs: Record<string, string>): ReactNode | undefined {
  const stencil = node.children.find((child) => child.type === "linkBlock");
  const icon = stencil ? findNode(stencil, "icon") : null;
  if (!stencil) return undefined;
  const links = storeSocialLinks(ctx);
  if (!links.length) return ctx.mode === "edit" ? undefined : null;
  return (
    <div {...attrs} className="flex min-w-0 flex-row flex-wrap">
      {/* Always round and never squeezed (owner, 2026-10-24): a soft tint keeps the circle visible on any footer. */}
      {links.map((link) => (
        <SmartLink key={link.platform} ctx={ctx} href={link.url} label={link.label} className="block shrink-0 rounded-full">
          <span
            data-node-id={stencil.id}
            data-node-type="linkBlock"
            className="grid aspect-square min-w-9 shrink-0 place-items-center rounded-full bg-current/8 transition-[transform,background-color] duration-200 hover:-translate-y-0.5 hover:bg-current/15 motion-reduce:transition-none motion-reduce:hover:translate-y-0"
          >
            <span {...(icon && { "data-node-id": icon.id, "data-node-type": "icon" })} className="inline-flex">
              <SocialIcon platform={link.platform} className="size-[1em]" />
            </span>
          </span>
        </SmartLink>
      ))}
    </div>
  );
}

/**
 * A `role: "payments"` row draws the methods the store's checkout offers
 * (store-payments.tsx) as logo cards; the row keeps its node id, so its
 * scoped CSS (gap, alignment) still applies. `undefined`: draw the row as
 * authored (no data from the host, or the editor and no methods). Publicly a
 * store with no methods gets no row.
 */
function renderPaymentsRow(ctx: RenderContext, attrs: Record<string, string>): ReactNode | undefined {
  const payments = storePayments(ctx);
  if (!payments) return undefined;
  if (!payments.length) return ctx.mode === "edit" ? undefined : null;
  return (
    <div {...attrs} className="flex min-w-0 flex-row flex-wrap items-center">
      {payments.map((payment) => (
        <PaymentLogo key={payment.key} payment={payment} />
      ))}
    </div>
  );
}

/** The burger button's look, shared by the host's sheet trigger, the editor and the fallback. */
export const MOBILE_MENU_BUTTON_CLASS =
  "inline-grid size-11 shrink-0 cursor-pointer list-none place-items-center rounded-full text-current hover:bg-current/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-current [&::-webkit-details-marker]:hidden";

/**
 * The header's burger menu (docs/section-rules.md §5.6). Its children are
 * copies of the menu links (drawChrome), drawn as 48px rows; a header without
 * a menu lists the site's pages. The host draws the sheet (`renderMobileMenu`);
 * the editor shows the still button; without a host, a plain dropdown.
 */
function renderMobileMenu(node: ComponentNode, ctx: RenderContext, depth: number, scope?: DataRecord): ReactNode {
  const label = sectionText("openMenu", ctx.locale);
  if (ctx.mode === "edit") {
    return (
      <span className={MOBILE_MENU_BUTTON_CLASS} aria-label={label}>
        <Menu className="size-6" aria-hidden />
      </span>
    );
  }
  const rows =
    node.children.length > 0
      ? renderElementTree(node.children, ctx, depth + 1, scope)
      : ctx.pages.map((page) => (
          <SmartLink key={page.href} ctx={ctx} href={page.href} className="block">
            {page.name}
          </SmartLink>
        ));
  const links = (
    <nav
      aria-label={sectionText("menu", ctx.locale)}
      className="flex flex-col text-base font-medium text-(--sf-ink) [&_a]:flex [&_a]:min-h-12 [&_a]:items-center [&_a]:border-b [&_a]:border-(--sf-line) [&_a]:hover:text-(--sf-brand)"
    >
      {rows}
    </nav>
  );
  const host = ctx.renderMobileMenu?.({ links, title: ctx.store.name });
  if (host) return host;
  // Without a host (template preview, builder preview): a native modal <dialog> as a sheet from the
  // start side. It sits in the top layer (above a transformed sticky header), traps focus and closes
  // with Esc by itself; the button opens it with an invoker command, and `MenuSheetRuntime` covers
  // browsers without invokers plus closing on a link or backdrop tap and the page scroll lock.
  const id = `sf-menu-${node.id.replace(/[^\w-]/g, "")}`;
  const invoker = { commandfor: id, command: "show-modal" } as Record<string, string>;
  return (
    <>
      <button
        type="button"
        className={MOBILE_MENU_BUTTON_CLASS}
        aria-label={label}
        aria-haspopup="dialog"
        aria-controls={id}
        aria-expanded={false}
        data-sf-menu-open={id}
        {...invoker}
      >
        <Menu className="size-6" aria-hidden />
      </button>
      <dialog
        id={id}
        data-sf-sheet
        aria-label={sectionText("menu", ctx.locale)}
        className="fixed inset-y-0 start-0 end-auto m-0 h-dvh max-h-none w-[85%] max-w-sm overflow-y-auto border-0 bg-(--sf-paper) p-5 text-(--sf-ink) shadow-xl backdrop:bg-black/45"
      >
        <div className="flex items-center justify-between gap-3 pb-3">
          <p className="min-w-0 truncate text-lg font-bold">{ctx.store.name}</p>
          <button
            type="button"
            className={MOBILE_MENU_BUTTON_CLASS}
            aria-label={sectionText("closeMenu", ctx.locale)}
            data-sf-menu-close
            {...({ commandfor: id, command: "close" } as Record<string, string>)}
          >
            <X className="size-6" aria-hidden />
          </button>
        </div>
        {links}
        <div className="mt-3 border-t border-(--sf-line) pt-3">
          <SmartLink ctx={ctx} href="/profile" className="flex min-h-11 items-center gap-2 text-base font-medium hover:text-(--sf-brand)">
            <User className="size-5" aria-hidden />
            {sectionText("signIn", ctx.locale)}
          </SmartLink>
        </div>
      </dialog>
    </>
  );
}

/** Nodes a header's search link draws its look with; anything else keeps it a plain link. */
const SEARCH_LINK_PARTS = new Set(["hFlex", "vFlex", "div", "icon", "text"]);

/**
 * A header search link: a link to the shop page holding one search icon and
 * at most one text (the placeholder). The host draws a working search there.
 */
function searchLinkParts(node: ComponentNode, href: string): { icon: ComponentNode; text: ComponentNode | null; iconFirst: boolean } | null {
  if (!/^\/products\/?$/.test(href)) return null;
  const parts: ComponentNode[] = [];
  walkNodes(node.children, (child) => parts.push(child));
  if (parts.some((part) => !SEARCH_LINK_PARTS.has(part.type))) return null;
  const icons = parts.filter((part) => part.type === "icon");
  const texts = parts.filter((part) => part.type === "text");
  const icon = icons[0];
  if (icons.length !== 1 || icon?.props.name !== "search" || texts.length > 1) return null;
  const text = texts[0] ?? null;
  return { icon, text, iconFirst: !text || parts.indexOf(icon) < parts.indexOf(text) };
}

/** A header cart link: to the cart page, with an icon (a footer's "Cart" text link gets no count). */
function isCartLink(node: ComponentNode, href: string): boolean {
  if (node.props.role !== "cart" && !/^\/cart\/?$/.test(href)) return false;
  let icon = false;
  walkNodes(node.children, (child) => {
    if (child.type === "icon") icon = true;
  });
  return icon;
}

/**
 * Reveal on scroll (docs/section-rules.md §6.2). `auto`: the node may get a
 * reveal of its own; `null`: an ancestor already reveals (or motion is off);
 * a number: an item of a grid or list, revealed with that stagger step.
 */
type RevealIn = "auto" | number | null;
/** What a node passes to its children: `items` staggers them. */
type RevealOut = "auto" | "items" | null;

/** Never revealed, nor anything inside: they move on their own, or must be there at once (forms, the buy box). */
const REVEAL_SKIP = new Set([
  "carousel",
  "slide",
  "storeForm",
  "addToCart",
  "wishlistButton",
  "mobileMenu",
  "productBreadcrumbs",
  "productGallery",
  "productPrice",
  "productStock",
  "productStockBadge",
  "productRating",
  "productVariants",
  "productBuyBox",
  "productDetails",
  "productContent",
  "productSeller",
  "productReviews",
]);
/** Revealed whole with `fade-up` (when not inside a revealed node). */
const REVEAL_FADE_UP = new Set(["paragraph", "button", "badge", "blockQuote", "accordion", "linkBlock", "list", "countdown"]);
/** Their children are items: each one fades up in turn. */
const REVEAL_ITEMS = new Set(["grid", "productList", "categoryList", "postList"]);

function revealOf(node: ComponentNode, props: Record<string, unknown>, ctx: RenderContext, input: RevealIn): { attrs: Record<string, string>; children: RevealOut } {
  if (!ctx.reveal || input === null || REVEAL_SKIP.has(node.type)) return { attrs: {}, children: null };
  const choice = REVEAL_CHOICES.find((c) => c === props.reveal) ?? "auto";
  // The section's Animation: a preset replaces the variant each element would pick (an element's own
  // Reveal still wins); items stagger only with Auto and Stagger, else a list's items play together.
  const preset = ctx.revealPreset ?? "auto";
  const staggers = preset === "auto" || preset === "stagger";
  const step = typeof input === "number" && staggers ? Math.min(input, REVEAL_MAX_STEP) : 0;
  let variant: RevealVariant | null = null;
  if (choice !== "auto") variant = choice === "none" ? null : (choice as Exclude<RevealChoice, "auto" | "none">);
  else if (typeof input === "number") variant = "fade-up";
  // The hero heading is the page's largest text (LCP): never hidden.
  else if (node.type === "heading") variant = props.level === "h1" ? null : "fade-up";
  else if (REVEAL_FADE_UP.has(node.type) || (props.role === "intro" && (node.type === "vFlex" || node.type === "hFlex"))) variant = "fade-up";
  else if (node.type === "image") variant = "zoom-in";
  // A marquee fades in whole (its items move on their own).
  else if (node.type === "marquee") variant = "fade";
  if (variant && choice === "auto" && preset !== "auto") variant = preset === "stagger" ? "fade-up" : preset;
  if (variant) {
    const attrs: Record<string, string> = { "data-reveal": variant };
    if (step > 0) attrs["data-reveal-step"] = String(step);
    return { attrs, children: null };
  }
  return { attrs: {}, children: REVEAL_ITEMS.has(node.type) ? "items" : "auto" };
}

/**
 * A product or category list as one row that swipes sideways on phones
 * (`mobileRail`, docs/section-rules.md §5.4, G15): it bleeds to the screen
 * edges, snaps card by card and lets the next card peek in.
 */
const MOBILE_RAIL_CLASS = {
  cards:
    "max-md:-mx-4 max-md:flex max-md:snap-x max-md:snap-mandatory max-md:scroll-px-4 max-md:overflow-x-auto max-md:overflow-y-hidden max-md:px-4 max-md:pb-1 max-md:[scrollbar-width:none] max-md:*:shrink-0 max-md:*:basis-[min(72%,280px)] max-md:*:snap-start max-md:[&::-webkit-scrollbar]:hidden",
  categories:
    "max-md:-mx-4 max-md:flex max-md:snap-x max-md:snap-mandatory max-md:scroll-px-4 max-md:overflow-x-auto max-md:overflow-y-hidden max-md:px-4 max-md:pb-1 max-md:[scrollbar-width:none] max-md:*:shrink-0 max-md:*:basis-[44%] max-md:*:snap-start max-md:[&::-webkit-scrollbar]:hidden",
} as const;

/**
 * A product list as a carousel row on every screen (`rail`, 2026-10-28): one
 * row that scrolls and snaps card by card, four cards in view on desktop,
 * three on tablets and a peeking card on phones (the widths assume the list's
 * gaps: `--rail-gap` 24px, `--rail-gap-t` 16px). Publicly, previous and next
 * arrows on tablet and desktop move it a view at a time (`CarouselRuntime`).
 */
const RAIL_CLASS =
  "flex snap-x snap-mandatory overflow-x-auto overflow-y-hidden pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden *:shrink-0 *:snap-start lg:*:basis-[calc((100%-3*var(--rail-gap,24px))/4)] md:max-lg:*:basis-[calc((100%-2*var(--rail-gap-t,16px))/3)] max-md:-mx-4 max-md:scroll-px-4 max-md:px-4 max-md:*:basis-[min(72%,280px)]";
const RAIL_ARROW =
  "absolute top-[34%] z-10 grid size-11 -translate-y-1/2 place-items-center rounded-full border border-(--sf-line) bg-(--sf-paper) text-(--sf-ink) shadow-md transition-colors hover:bg-(--sf-shelf) focus-visible:outline-2 focus-visible:outline-(--sf-brand) max-md:hidden";

/** A clipped link holding a photo (product and category cards): the photo zooms a little on hover (`MOTION_CSS`). */
function zoomsPhoto(node: ComponentNode): boolean {
  const overflow = normalizeStyle(node.style).overflow;
  return (overflow === "hidden" || overflow === "clip") && node.children.some((child) => child.type === "image");
}

/** A link or box holding nothing but one icon (an icon button or icon tile): its icon sits dead centre. */
function iconOnly(node: ComponentNode): boolean {
  return node.children.length === 1 && node.children[0]!.type === "icon";
}

/** A link whose photo is the record's image (a product card's photo link). */
function holdsBoundImage(node: ComponentNode): boolean {
  return node.children.some((child) => child.type === "image" && child.props?.bind === "image");
}

function renderNode(node: ComponentNode, ctx: RenderContext, depth: number, scope?: DataRecord, revealIn: RevealIn = "auto"): ReactNode {
  const definition = getElementDefinition(node.type);
  if (!definition || depth > MAX_ELEMENT_DEPTH) return null;
  const bound = scopedProps(node, ctx, scope);
  // Demo phone / email / WhatsApp values become the store's own (store-contact.ts).
  const props = bound && withStoreContact(node, bound, ctx);
  if (!props || contactRowGone(node, ctx)) return null;
  const reveal = revealOf(node, props, ctx, revealIn);
  const attrs = { "data-node-id": node.id, "data-node-type": node.type, ...reveal.attrs };
  if (props.role === "social") {
    const row = renderSocialRow(node, ctx, attrs);
    if (row !== undefined) return row;
  }
  if (props.role === "payments") {
    const row = renderPaymentsRow(ctx, attrs);
    if (row !== undefined) return row;
  }
  const kids = () => {
    if (!definition.container) return null;
    if (!node.children.length && ctx.mode === "edit") {
      // Templates leave decorative boxes empty, so an empty container keeps
      // only an invisible drop area, no "drop elements here" text (owner, 2026-10-21).
      if (node.type !== "accordion") return <span data-editor-only aria-hidden className="block min-h-6" />;
      return (
        <span data-editor-only className="block rounded-(--sf-radius,12px) border border-dashed border-(--sf-line) p-4 text-center text-xs text-(--sf-muted)">
          {sectionText("emptyAccordion", ctx.locale)}
        </span>
      );
    }
    return renderElementTree(node.children, ctx, depth + 1, scope, reveal.children);
  };

  // An emptied section or card (decorations alone don't count) is a blank band publicly: draw nothing.
  if ((definition.type === "section" || definition.type === "card") && ctx.mode !== "edit" && node.children.every((child) => child.type === "pattern")) {
    return null;
  }

  switch (definition.type) {
    case "section":
      if (ctx.mode !== "edit" && (missingData(node, ctx) || productSectionEmpty(node, ctx, scope))) return null;
      return (
        <section {...attrs} className="relative isolate overflow-x-clip">
          {kids()}
        </section>
      );
    case "card":
      return (
        <div {...attrs} className="min-w-0">
          {kids()}
        </div>
      );
    case "pattern": {
      const variant = PATTERN_VARIANTS.find((v) => v === props.variant) ?? "grid";
      return <div {...attrs} aria-hidden="true" className={cn("pointer-events-none absolute inset-0 -z-10", PATTERN_CLASS[variant])} />;
    }
    case "accordion":
      return (
        <div {...attrs} className="flex flex-col">
          {kids()}
        </div>
      );
    case "accordionItem":
      return (
        <details {...attrs} open={props.open === true} className="group border-b border-(--sf-line) py-4">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-start font-semibold [&::-webkit-details-marker]:hidden">
            {str(props.title, 200)}
            <ChevronDown className="size-4 shrink-0 transition-transform group-open:rotate-180 motion-reduce:transition-none" aria-hidden />
          </summary>
          <div className="mt-3">{kids()}</div>
        </details>
      );
    case "container":
      return (
        <div {...attrs} className="mx-auto w-full max-w-(--sf-max-width,1280px) px-[clamp(16px,4vw,48px)]">
          {kids()}
        </div>
      );
    case "vFlex":
      return (
        <div {...attrs} className={cn("flex min-w-0 flex-col", props.collapse === MOBILE_COLLAPSE && "max-md:hidden")}>
          {kids()}
        </div>
      );
    case "hFlex":
      // A header menu (`collapse: "mobile"`, drawChrome) hides on phones: the burger menu holds it there.
      // A header bar (`split`) is three columns on phones, the logo in the middle; its end cell
      // (`group`) is a box only there.
      return (
        <div
          {...attrs}
          className={cn(
            "flex min-w-0 flex-row flex-wrap",
            props.collapse === MOBILE_COLLAPSE && "max-md:hidden",
            props.split === MOBILE_SPLIT && "max-md:grid max-md:grid-cols-[1fr_auto_1fr]",
            props.group === MOBILE_GROUP && "md:contents",
          )}
        >
          {kids()}
        </div>
      );
    case "mobileMenu":
      return (
        <div {...attrs} className="flex shrink-0 md:hidden">
          {renderMobileMenu(node, ctx, depth, scope)}
        </div>
      );
    case "grid":
      return (
        <div {...attrs} className="grid min-w-0">
          {kids()}
        </div>
      );
    case "div":
      return (
        <div {...attrs} className={cn("min-w-0", iconOnly(node) && "grid place-items-center")}>
          {kids()}
        </div>
      );
    case "heading": {
      const level = (["h1", "h2", "h3", "h4"] as const).find((l) => l === props.level) ?? "h2";
      const Tag = level;
      return (
        <Tag {...attrs} className={cn("text-balance", HEADING_CLASS[level])}>
          {str(props.text, 200)}
        </Tag>
      );
    }
    case "paragraph":
      return (
        <p {...attrs} className="whitespace-pre-line text-pretty leading-relaxed text-(--sf-muted)">
          {str(props.text, 2000)}
        </p>
      );
    case "text":
      // The price before a discount is always struck through (owner, 2026-10-29).
      return (
        <p {...attrs} className={cn("text-sm", props.bind === "compareAtPrice" && "line-through")}>
          {str(props.text, 300)}
        </p>
      );
    case "blockQuote":
      return (
        <blockquote {...attrs} className="border-s-4 border-(--sf-brand) ps-4 text-lg italic leading-relaxed">
          {str(props.text, 600)}
        </blockquote>
      );
    case "button": {
      const variant = (["solid", "outline", "light"] as const).find((v) => v === props.variant) ?? "solid";
      const label = str(props.label, 60);
      const button = <ButtonLink ctx={ctx} href={str(props.href, 2048)} label={label} variant={variant} />;
      // A button with no valid link still shows in the editor so it can be fixed.
      return (
        <div {...attrs} className="flex">
          {button ??
            (ctx.mode === "edit" && label ? (
              <span className="inline-flex h-11 items-center rounded-(--sf-radius,12px) bg-(--sf-brand) px-6 text-sm font-semibold text-(--sf-brand-ink,#fff) opacity-60">
                {label}
              </span>
            ) : null)}
        </div>
      );
    }
    case "image": {
      const url = ctx.imageUrl(resolvePhotoSlot(str(props.src, 2048), ctx.industry));
      if (!url) {
        return ctx.mode === "edit" ? <div {...attrs} aria-hidden className="block w-full bg-(--sf-shelf)" /> : null;
      }
      const sizes = typeof props.bind === "string" ? IMAGE_SIZES.card : IMAGE_SIZES.content;
      const secondUrl = typeof props.secondSrc === "string" ? ctx.imageUrl(props.secondSrc) : null;
      if (secondUrl) {
        // Both photos overlap; hovering the card fades the first one out to show the second.
        // `isolate` keeps the first photo's z-index inside this swap, so a sale badge placed over the photo stays on top.
        return (
          <span className="group/pc relative isolate block w-full">
            {/* eslint-disable-next-line @next/next/no-img-element -- shared by both apps; the host optimizes through ctx.optimizeImage */}
            <img {...attrs} {...imageSource(ctx, url, sizes)} alt={str(props.alt, 160)} className="relative z-[1] block w-full transition-opacity duration-500 ease-in-out group-hover/pc:opacity-0 motion-reduce:transition-none" loading="lazy" decoding="async" />
            {/* eslint-disable-next-line @next/next/no-img-element -- same as above */}
            <img {...attrs} {...imageSource(ctx, secondUrl, sizes)} alt="" aria-hidden className="absolute! inset-0 block size-full! object-cover" loading="lazy" decoding="async" />
          </span>
        );
      }
      // eslint-disable-next-line @next/next/no-img-element -- shared by both apps; the host optimizes through ctx.optimizeImage
      return <img {...attrs} {...imageSource(ctx, url, sizes)} alt={str(props.alt, 160)} className="block w-full" loading="lazy" decoding="async" />;
    }
    case "video":
      return <VideoElement attrs={attrs} props={props} ctx={ctx} />;
    case "videoPlaylist":
      return <VideoPlaylist attrs={attrs} node={node} ctx={ctx} />;
    case "videoItem":
      // Drawn by its playlist; on its own it has no player to play in.
      return null;
    case "carousel":
      return (
        <CarouselElement attrs={attrs} node={node} props={props} ctx={ctx}>
          {kids()}
        </CarouselElement>
      );
    case "slide":
      return <SlideElement attrs={attrs}>{kids()}</SlideElement>;
    case "marquee": {
      // The editor shows one still row (selection outlines must not move). Publicly two copies of the row
      // loop (`MOTION_CSS`); the second is hidden from assistive tech and focus.
      if (ctx.mode === "edit") {
        return (
          <div {...attrs} className="flex min-w-0 flex-row flex-wrap">
            {kids()}
          </div>
        );
      }
      const row = kids();
      const gap = normalizeStyle(node.style).gap;
      const vars = { ["--sf-marquee" as string]: `${marqueeSeconds(props.speed)}s`, ["--sf-mg" as string]: `${typeof gap === "number" ? Math.min(160, Math.max(0, gap)) : 40}px` };
      const rowClass = "flex min-w-[100vw] shrink-0 flex-row items-center justify-around gap-(--sf-mg)";
      return (
        <div {...attrs} className="min-w-0 overflow-x-clip py-[0.12em]" style={vars}>
          <div data-marquee-track className="flex w-max gap-(--sf-mg)">
            <div data-marquee-row className={rowClass}>
              {row}
            </div>
            <div data-marquee-row data-marquee-copy aria-hidden="true" inert className={rowClass}>
              {row}
            </div>
          </div>
        </div>
      );
    }
    case "countdown":
      return <CountdownElement attrs={attrs} props={props} ctx={ctx} />;
    case "divider":
      return <hr {...attrs} className="border-(--sf-line)" />;
    case "spacer":
      return <div {...attrs} aria-hidden />;
    case "icon": {
      const Icon = ICONS[props.name as ElementIconName] ?? Star;
      return (
        <span {...attrs} className="inline-flex shrink-0 items-center justify-center align-middle leading-none">
          {/* The arrow points forward: left in Arabic, right in English. */}
          {/* Rating stars are filled (an outline star reads as "not earned"); faded ones keep their opacity. */}
          <Icon className={cn("size-[1em]", props.name === "arrow" && "ltr:-scale-x-100")} {...(props.name === "star" && { fill: "currentColor" })} aria-hidden />
        </span>
      );
    }
    case "badge":
      return (
        <span {...attrs} className="inline-flex w-fit items-center rounded-full bg-(--sf-shelf) px-3 py-1 text-xs font-semibold">
          {str(props.text, 40)}
        </span>
      );
    case "list": {
      const Tag = props.ordered === true ? "ol" : "ul";
      return (
        <Tag {...attrs} className={cn("space-y-1.5 ps-5", props.ordered === true ? "list-decimal" : "list-disc")}>
          {kids()}
        </Tag>
      );
    }
    case "listItem":
      return <li {...attrs}>{str(props.text, 300)}</li>;
    case "linkBlock": {
      const href = str(props.href, 2048);
      const search = ctx.renderSearch ? searchLinkParts(node, href) : null;
      if (search && ctx.renderSearch) {
        // The link's own box (border, padding, colours) holds the working search.
        return (
          <div {...attrs} className="relative block min-w-0">
            {ctx.renderSearch({
              placeholder: search.text ? str(search.text.props.text, 120) || undefined : undefined,
              icon: renderNode(search.icon, ctx, depth + 1, scope),
              iconFirst: search.iconFirst,
            })}
          </div>
        );
      }
      if (!ctx.renderSearch && ctx.mode !== "edit") {
        // No host search (a template or library preview): a plain search form that opens the
        // shop page's results (`/products?search=…`), so a search bar still works without script.
        const parts = searchLinkParts(node, href);
        const placeholder = parts?.text ? str(parts.text.props.text, 120) : "";
        if (parts && placeholder) {
          const submit = (
            <button type="submit" className="inline-flex shrink-0 cursor-pointer" aria-label={sectionText("searchSubmit", ctx.locale)}>
              {renderNode(parts.icon, ctx, depth + 1, scope)}
            </button>
          );
          return (
            <div {...attrs} className="relative block min-w-0">
              <form action={href} method="get" role="search" className="flex items-center gap-3">
                {parts.iconFirst && submit}
                <input
                  type="search"
                  name="search"
                  required
                  maxLength={100}
                  placeholder={placeholder}
                  aria-label={placeholder}
                  autoComplete="off"
                  enterKeyHint="search"
                  className="min-w-0 flex-1 appearance-none bg-transparent text-inherit [text-align:inherit] outline-none placeholder:text-(--sf-muted) [&::-webkit-search-cancel-button]:hidden"
                />
                {!parts.iconFirst && submit}
              </form>
            </div>
          );
        }
      }
      const badge = isCartLink(node, href) ? ctx.renderCartBadge?.() : null;
      // A product card's photo link carries the product's trending / seasonal badges (every card, no design change).
      const flags =
        scope?.kind === "productList" && props.bind === "href" && hasProductFlags(scope.record) && holdsBoundImage(node) ? (
          <ProductFlags product={scope.record} ctx={ctx} className="pointer-events-none absolute bottom-2.5 start-2.5 z-1" />
        ) : null;
      return (
        // An icon-only link (header search, cart) is named by its label (docs/section-rules.md §5.6).
        <SmartLink ctx={ctx} href={href} className="block min-w-0" label={iconOnly(node) ? str(props.label, 60) || undefined : undefined}>
          <span
            {...attrs}
            className={cn(iconOnly(node) ? "grid place-items-center" : "block", (badge != null || flags) && "relative", zoomsPhoto(node) && "sf-zoom")}
          >
            {kids()}
            {badge}
            {flags}
          </span>
        </SmartLink>
      );
    }
    case "textLink":
      return (
        <SmartLink ctx={ctx} href={str(props.href, 2048)} className="font-medium text-(--sf-brand) underline underline-offset-4">
          <span {...attrs}>{str(props.text, 120)}</span>
        </SmartLink>
      );
    case "productList":
    case "categoryList":
    case "postList": {
      const records = listRecords(node, ctx);
      if (!records.length) {
        if (ctx.mode !== "edit") return null;
        const need = DATA_NODE_NEEDS[node.type]!;
        // Records exist but this list's choice matches none: say so instead of "add products".
        const filtered = need === "products" && (ctx.catalog.counts?.products ?? 0) > 0;
        return (
          <div data-node-id={node.id} data-node-type={node.type} className="min-w-0">
            <DataEmpty need={need} ctx={ctx} filtered={filtered} />
          </div>
        );
      }
      const carousel = props.rail === true && node.type === "productList" && !isPaginated(node);
      const rail = carousel ? RAIL_CLASS : props.mobileRail === true && !isPaginated(node) ? MOBILE_RAIL_CLASS[node.type === "categoryList" ? "categories" : "cards"] : undefined;
      const grid = (
        <div {...attrs} {...(carousel && { "data-rail": "" })} className={cn(!carousel && "grid", "min-w-0", rail)}>
          {records.map((record, index) =>
            node.children.map((child) => (
              <ElementFragment key={`${recordKey(record)}-${child.id}`} node={child} ctx={ctx} depth={depth + 1} scope={record} reveal={reveal.children === null ? null : index} />
            )),
          )}
        </div>
      );
      if (carousel && ctx.mode !== "edit") {
        return (
          <div data-rail-wrap="" className="relative min-w-0">
            {grid}
            <button type="button" data-rail-step="-1" aria-label={sectionText("carouselPrevious", ctx.locale)} className={cn(RAIL_ARROW, "-start-5")}>
              {/* Back points to the start side: right in Arabic, left in English. */}
              <ArrowLeft className="size-4 rtl:-scale-x-100" aria-hidden />
            </button>
            <button type="button" data-rail-step="1" aria-label={sectionText("carouselNext", ctx.locale)} className={cn(RAIL_ARROW, "-end-5")}>
              <ArrowLeft className="size-4 ltr:-scale-x-100" aria-hidden />
            </button>
          </div>
        );
      }
      return isPaginated(node) ? (
        <>
          {grid}
          <ProductPager node={node} ctx={ctx} />
        </>
      ) : (
        grid
      );
    }
    case "storeForm": {
      const formId = nodeFormId(node);
      const form = formId ? ctx.forms?.[formId] : undefined;
      if (!form) {
        return ctx.mode === "edit" ? (
          <div {...attrs} className="min-w-0">
            <DataEmpty need="forms" ctx={ctx} />
          </div>
        ) : null;
      }
      if (ctx.renderForm) {
        return (
          <div {...attrs} className="min-w-0">
            {ctx.renderForm(form, node.id)}
          </div>
        );
      }
      // Editor canvas: a still preview of the same fields.
      return (
        <div {...attrs} className="flex min-w-0 flex-col gap-4">
          <FormFieldsView form={form} idPrefix={node.id} locale={ctx.locale} disabled />
          <span className={cn(FORM_SUBMIT_CLASS, "w-fit")}>{formCopy(form, ctx.locale).submitLabel}</span>
        </div>
      );
    }
    case "wishlistButton": {
      if (scope?.kind === "productList" || scope?.kind === "product") {
        const button = ctx.renderWishlistButton?.(scope.record);
        return button ? (
          <div {...attrs} className="flex">
            {button}
          </div>
        ) : null;
      }
      // Outside a product list there is no product: a still heart in the editor only.
      return ctx.mode === "edit" ? (
        <div {...attrs} className="flex">
          <span
            aria-label={sectionText("addToWishlist", ctx.locale)}
            className="inline-flex size-9 items-center justify-center rounded-full border border-(--sf-line) bg-(--sf-paper) opacity-70"
          >
            <Heart className="size-4" aria-hidden />
          </span>
        </div>
      ) : null;
    }
    case "languageSwitcher": {
      const button = ctx.renderLanguageSwitcher?.();
      if (button) {
        return (
          <div {...attrs} className="flex">
            {button}
          </div>
        );
      }
      // The editor has no navigation: a still copy of the storefront switch.
      return ctx.mode === "edit" ? (
        <div {...attrs} className="flex">
          <span className="inline-flex h-10 items-center gap-1.5 rounded-full px-2.5 text-sm font-medium">
            <Globe className="size-4" aria-hidden />
            <span className="max-sm:sr-only">{sectionText("otherLanguage", ctx.locale)}</span>
          </span>
        </div>
      ) : null;
    }
    case "storeLogo": {
      // The logo uploaded in Website › Design, wherever the header/footer options put it.
      const url = ctx.store.logoUrl ? ctx.imageUrl(ctx.store.logoUrl) : null;
      if (!url) {
        // No logo yet: the editor shows its uploader in the logo's place.
        const uploader = ctx.mode === "edit" ? ctx.renderLogoUploader?.(props.size === "lg" ? "lg" : "md") : null;
        return uploader ? (
          <div {...attrs} className="flex shrink-0">
            {uploader}
          </div>
        ) : null;
      }
      return (
        // eslint-disable-next-line @next/next/no-img-element -- shared by both apps; the host optimizes through ctx.optimizeImage
        <img
          {...attrs}
          {...imageSource(ctx, url, IMAGE_SIZES.logo)}
          alt={ctx.store.name}
          className={cn("block w-auto max-w-40 shrink-0 object-contain", props.size === "lg" ? "h-12" : "h-9 md:h-10")}
          decoding="async"
        />
      );
    }
    case "themeToggle": {
      const button = ctx.renderThemeToggle?.();
      if (button) {
        return (
          <div {...attrs} className="flex">
            {button}
          </div>
        );
      }
      return ctx.mode === "edit" ? (
        <div {...attrs} className="flex">
          <span className="inline-grid size-10 place-items-center rounded-full">
            <Moon className="size-4.5" aria-hidden />
            <span className="sr-only">{sectionText("themeToggle", ctx.locale)}</span>
          </span>
        </div>
      ) : null;
    }
    case "appInstall": {
      const button = ctx.renderAppInstall?.();
      if (button) {
        return (
          <div {...attrs} className="flex">
            {button}
          </div>
        );
      }
      return ctx.mode === "edit" ? (
        <div {...attrs} className="flex">
          <span className="inline-flex h-10 items-center gap-1.5 rounded-full border border-current/20 px-3.5 text-sm font-medium">
            <Smartphone className="size-4" aria-hidden />
            {sectionText("downloadApp", ctx.locale)}
          </span>
        </div>
      ) : null;
    }
    case "accountLink": {
      const button = ctx.renderAccountButton?.();
      if (button) {
        return (
          <div {...attrs} className="flex">
            {button}
          </div>
        );
      }
      return ctx.mode === "edit" ? (
        <div {...attrs} className="flex">
          <span className="inline-flex h-10 items-center gap-1.5 rounded-full px-2.5 text-sm font-medium">
            <User className="size-4.5" aria-hidden />
            <span className="max-sm:sr-only">{sectionText("signIn", ctx.locale)}</span>
          </span>
        </div>
      ) : null;
    }
    case "addToCart": {
      // A product with variants needs a chosen variant (the buy box does that), so a plain add
      // button would add it without one: the editor shows the still preview, the storefront nothing.
      const variantProduct = scope?.kind === "product" && scope.record.variants.length > 0;
      if (!variantProduct && (scope?.kind === "productList" || scope?.kind === "product")) {
        const button = ctx.renderAddToCart?.(scope.record);
        return button ? (
          <div {...attrs} className="flex">
            {button}
          </div>
        ) : null;
      }
      // Outside a product list (or for a variant product) there is nothing to add: a still preview in the editor only.
      return ctx.mode === "edit" ? (
        <div {...attrs} className="flex">
          <span className="inline-flex h-9 items-center justify-center rounded-(--sf-radius,12px) bg-(--sf-brand) px-4 text-xs font-semibold text-(--sf-brand-ink,#fff) opacity-70">
            {sectionText("addToCart", ctx.locale)}
          </span>
        </div>
      ) : null;
    }
    // Product page parts: the page's product (`product-elements.tsx`).
    case "productBreadcrumbs":
    case "productGallery":
    case "productPrice":
    case "productStock":
    case "productStockBadge":
    case "productRating":
    case "productVariants":
    case "productBuyBox":
    case "productDetails":
    case "productContent":
    case "productSeller":
    case "productReviews":
      return renderProductElement(definition.type, props, attrs, ctx, scope);
  }
}

export function renderElementTree(
  nodes: readonly ComponentNode[] | undefined,
  ctx: RenderContext,
  depth = 1,
  scope?: DataRecord,
  reveal: RevealOut = "auto",
): ReactNode {
  if (!nodes?.length) return null;
  return nodes.map((node, index) => (
    <ElementFragment key={node.id} node={node} ctx={ctx} depth={depth} scope={scope} reveal={reveal === "items" ? index : reveal} />
  ));
}

function ElementFragment({ node, ctx, depth, scope, reveal }: { node: ComponentNode; ctx: RenderContext; depth: number; scope?: DataRecord; reveal?: RevealIn }) {
  return <>{renderNode(node, ctx, depth, scope, reveal)}</>;
}

/** Page numbers around the current one, with the first and last; `null` marks a gap. */
function pageWindow(page: number, total: number): (number | null)[] {
  const pages = [...new Set([1, page - 1, page, page + 1, total])].filter((p) => p >= 1 && p <= total).sort((a, b) => a - b);
  return pages.flatMap((p, i) => (i > 0 && p - pages[i - 1]! > 1 ? [null, p] : [p]));
}

/**
 * Page links under a paginated product list (`paginate`). The storefront
 * reports the page (`catalog.productPages`); the editor shows page 1 of the
 * store's products. Nothing when everything fits on one page.
 */
function ProductPager({ node, ctx }: { node: ComponentNode; ctx: RenderContext }) {
  const perPage = Math.max(1, Number(node.props?.limit) || 8);
  const known = ctx.catalog.productPages?.[node.id];
  const state = known ?? (ctx.mode === "edit" ? { page: 1, totalPages: Math.ceil((ctx.catalog.counts?.products ?? 0) / perPage) } : null);
  if (!state || state.totalPages <= 1 || (!ctx.productPageHref && ctx.mode !== "edit")) return null;
  const href = (page: number) => ctx.productPageHref?.(page) ?? "";
  const ar = ctx.locale === "ar";
  const item = "flex h-10 min-w-10 items-center justify-center rounded-full px-3 text-sm font-semibold tabular-nums";
  return (
    <nav aria-label={ar ? "صفحات المنتجات" : "Product pages"} data-part="pager" className="mt-8 flex flex-wrap items-center justify-center gap-1.5">
      {state.page > 1 && (
        <SmartLink ctx={ctx} href={href(state.page - 1)} className={cn(item, "border border-(--sf-line)")}>
          {ar ? "السابق" : "Previous"}
        </SmartLink>
      )}
      {pageWindow(state.page, state.totalPages).map((p, i) =>
        p === null ? (
          <span key={`gap-${i}`} aria-hidden className="px-1 opacity-60">
            …
          </span>
        ) : p === state.page ? (
          <span key={p} aria-current="page" className={cn(item, "bg-(--sf-brand) text-(--sf-brand-ink)")}>
            {p}
          </span>
        ) : (
          <SmartLink key={p} ctx={ctx} href={href(p)} className={cn(item, "hover:bg-(--sf-shelf)")}>
            {p}
          </SmartLink>
        ),
      )}
      {state.page < state.totalPages && (
        <SmartLink ctx={ctx} href={href(state.page + 1)} className={cn(item, "border border-(--sf-line)")}>
          {ar ? "التالي" : "Next"}
        </SmartLink>
      )}
    </nav>
  );
}
