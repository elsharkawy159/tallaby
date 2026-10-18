/**
 * Server-renderable element tree (P4B-02). No hooks and no editor imports;
 * styles come from `collectPageCss` (scoped by `data-node-id`), links go
 * through `SmartLink`/`safeHref` and images through `ctx.imageUrl`. Text is
 * always printed as text, never parsed as HTML.
 */
import type { ReactNode } from "react";
import {
  ArrowLeft,
  Check,
  Clock,
  CreditCard,
  Gift,
  Heart,
  Leaf,
  Mail,
  MapPin,
  Phone,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  Star,
  Tag,
  Truck,
  type LucideIcon,
} from "lucide-react";
import type { ComponentNode } from "../config/schema";
import type { RenderContext } from "../core/types";
import { ButtonLink, SmartLink, cn } from "../sections/_primitives";
import { MAX_ELEMENT_DEPTH, getElementDefinition, type ElementIconName } from "./registry";

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
};

const str = (value: unknown, max: number) => (typeof value === "string" ? value.slice(0, max) : "");

const HEADING_CLASS = {
  h1: "text-4xl font-extrabold leading-tight md:text-5xl",
  h2: "text-2xl font-bold leading-tight md:text-3xl",
  h3: "text-xl font-semibold leading-snug",
  h4: "text-lg font-semibold leading-snug",
} as const;

function renderNode(node: ComponentNode, ctx: RenderContext, depth: number): ReactNode {
  const definition = getElementDefinition(node.type);
  if (!definition || depth > MAX_ELEMENT_DEPTH) return null;
  const props = node.props ?? {};
  const attrs = { "data-node-id": node.id, "data-node-type": node.type };
  const kids = () => (definition.container ? renderElementTree(node.children, ctx, depth + 1) : null);

  switch (definition.type) {
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
          <Icon className="size-[1em]" aria-hidden />
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
  }
}

export function renderElementTree(nodes: readonly ComponentNode[] | undefined, ctx: RenderContext, depth = 1): ReactNode {
  if (!nodes?.length) return null;
  return nodes.map((node) => <ElementFragment key={node.id} node={node} ctx={ctx} depth={depth} />);
}

function ElementFragment({ node, ctx, depth }: { node: ComponentNode; ctx: RenderContext; depth: number }) {
  return <>{renderNode(node, ctx, depth)}</>;
}
