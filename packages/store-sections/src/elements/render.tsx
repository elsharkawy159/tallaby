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
  Youtube,
  Zap,
  type LucideIcon,
} from "lucide-react";
import type { ComponentNode } from "../config/schema";
import { sectionText } from "../core/copy";
import type { RenderContext } from "../core/types";
import { DataEmpty } from "../sections/_data";
import { FORM_SUBMIT_CLASS, FormFieldsView, formCopy } from "../sections/forms";
import { ButtonLink, SmartLink, cn } from "../sections/_primitives";
import { DATA_NODE_NEEDS, boundValue, isDataList, listRecords, nodeFormId, walkNodes, type DataRecord } from "./data";
import { MAX_ELEMENT_DEPTH, PATTERN_VARIANTS, getElementDefinition, type ElementIconName, type PatternVariant } from "./registry";

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
  if (!scope || !target || typeof props.bind !== "string") return props;
  const value = boundValue(scope, props.bind, ctx);
  if (value === null) return null;
  const next: Record<string, unknown> = { ...props, [target]: value };
  if (node.type === "image") next.alt = scope.kind === "categoryList" ? scope.record.name : scope.record.title;
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

function renderNode(node: ComponentNode, ctx: RenderContext, depth: number, scope?: DataRecord): ReactNode {
  const definition = getElementDefinition(node.type);
  if (!definition || depth > MAX_ELEMENT_DEPTH) return null;
  const props = scopedProps(node, ctx, scope);
  if (!props) return null;
  const attrs = { "data-node-id": node.id, "data-node-type": node.type };
  const kids = () => {
    if (!definition.container) return null;
    if (!node.children.length && ctx.mode === "edit") {
      return (
        <span data-editor-only className="block rounded-(--sf-radius,12px) border border-dashed border-(--sf-line) p-4 text-center text-xs text-(--sf-muted)">
          {sectionText(node.type === "accordion" ? "emptyAccordion" : "emptyContainer", ctx.locale)}
        </span>
      );
    }
    return renderElementTree(node.children, ctx, depth + 1, scope);
  };

  // An emptied section or card (decorations alone don't count) is a blank band publicly: draw nothing.
  if ((definition.type === "section" || definition.type === "card") && ctx.mode !== "edit" && node.children.every((child) => child.type === "pattern")) {
    return null;
  }

  switch (definition.type) {
    case "section":
      if (ctx.mode !== "edit" && missingData(node, ctx)) return null;
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
        <div {...attrs} className="mx-auto w-full max-w-(--sf-max-width,1200px) px-4 md:px-8">
          {kids()}
        </div>
      );
    case "vFlex":
      return (
        <div {...attrs} className="flex min-w-0 flex-col">
          {kids()}
        </div>
      );
    case "hFlex":
      return (
        <div {...attrs} className="flex min-w-0 flex-row flex-wrap">
          {kids()}
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
        <div {...attrs} className="min-w-0">
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
      return (
        <p {...attrs} className="text-sm">
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
      const url = ctx.imageUrl(str(props.src, 2048));
      if (!url) {
        return ctx.mode === "edit" ? <div {...attrs} aria-hidden className="block w-full bg-(--sf-shelf)" /> : null;
      }
      // eslint-disable-next-line @next/next/no-img-element -- shared by both apps; no next/image here
      return <img {...attrs} src={url} alt={str(props.alt, 160)} className="block w-full" loading="lazy" decoding="async" />;
    }
    case "divider":
      return <hr {...attrs} className="border-(--sf-line)" />;
    case "spacer":
      return <div {...attrs} aria-hidden />;
    case "icon": {
      const Icon = ICONS[props.name as ElementIconName] ?? Star;
      return (
        <span {...attrs} className="inline-flex">
          {/* The arrow points forward: left in Arabic, right in English. */}
          <Icon className={cn("size-[1em]", props.name === "arrow" && "ltr:-scale-x-100")} aria-hidden />
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
    case "linkBlock":
      return (
        <SmartLink ctx={ctx} href={str(props.href, 2048)} className="block min-w-0">
          <span {...attrs} className="block">
            {kids()}
          </span>
        </SmartLink>
      );
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
      return (
        <div {...attrs} className="grid min-w-0">
          {records.map((record) =>
            node.children.map((child) => <ElementFragment key={`${recordKey(record)}-${child.id}`} node={child} ctx={ctx} depth={depth + 1} scope={record} />),
          )}
        </div>
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
    case "addToCart": {
      if (scope?.kind === "productList") {
        const button = ctx.renderAddToCart?.(scope.record);
        return button ? (
          <div {...attrs} className="flex">
            {button}
          </div>
        ) : null;
      }
      // Outside a product list there is no product to add: a still preview in the editor only.
      return ctx.mode === "edit" ? (
        <div {...attrs} className="flex">
          <span className="inline-flex h-9 items-center justify-center rounded-(--sf-radius,12px) bg-(--sf-brand) px-4 text-xs font-semibold text-(--sf-brand-ink,#fff) opacity-70">
            {sectionText("addToCart", ctx.locale)}
          </span>
        </div>
      ) : null;
    }
  }
}

export function renderElementTree(nodes: readonly ComponentNode[] | undefined, ctx: RenderContext, depth = 1, scope?: DataRecord): ReactNode {
  if (!nodes?.length) return null;
  return nodes.map((node) => <ElementFragment key={node.id} node={node} ctx={ctx} depth={depth} scope={scope} />);
}

function ElementFragment({ node, ctx, depth, scope }: { node: ComponentNode; ctx: RenderContext; depth: number; scope?: DataRecord }) {
  return <>{renderNode(node, ctx, depth, scope)}</>;
}
