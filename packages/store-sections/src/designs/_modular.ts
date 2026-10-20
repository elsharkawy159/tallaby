/**
 * The "Modular" direction of the Claude Design section library (sections f–o
 * of every category, 2026-10-19): hairline-ruled cells, bento tiles, dot
 * labels and big numbers. Every helper returns ordinary element nodes with
 * Layers labels, like `_kit.ts`.
 */
import type { ElementIconName } from "../elements/registry";
import type { StyleValues } from "../elements/style";
import type { NodeTemplate } from "../elements/tree";
import type { DesignText, NodeOptions, TreeBuilder } from "./builder";
import { L, arrowLink } from "./_kit";

/** A ruled grid: 1px gaps over the line colour, so every cell reads as a hairline box. Cells take `RULED_CELL`. */
export const RULED: StyleValues = {
  gap: 1,
  background: "border",
  borderWidth: 1,
  borderColor: "border",
  radius: 24,
  overflow: "hidden",
};
export const RULED_CELL: StyleValues = { background: "background" };

/** Bento tiles: shelf, brand and sun. */
export const TILE: StyleValues = {
  background: "secondary",
  radius: 24,
  paddingTop: 28,
  paddingBottom: 28,
  paddingStart: 28,
  paddingEnd: 28,
  overflow: "hidden",
};
export const TILE_MOBILE: StyleValues = {
  paddingTop: 22,
  paddingBottom: 22,
  paddingStart: 22,
  paddingEnd: 22,
};
export const BRAND_TILE: StyleValues = {
  ...TILE,
  background: "primary",
  color: "primaryInk",
};
export const SUN_TILE: StyleValues = {
  ...TILE,
  background: "accent",
  color: "foreground",
};

/** No padding (link blocks carry 12px by default). */
export const FLUSH: StyleValues = {
  paddingTop: 0,
  paddingBottom: 0,
  paddingStart: 0,
  paddingEnd: 0,
};

/** A big tabular number. */
export const BIG_NUMBER: StyleValues = {
  fontWeight: "bold",
  letterSpacing: "tight",
  lineHeight: "tight",
};

/** The dot label: a small sun dot and a muted label above a title. */
export function dotLabel(t: TreeBuilder, text: DesignText, opts: { onBrand?: boolean } = {}): NodeTemplate {
  return t.row(
    [
      t.box([], {
        label: L("النقطة", "Dot"),
        style: {
          background: "accent",
          radius: 999,
          width: "8px",
          minHeight: 8,
        },
      }),
      t.text(text, {
        role: "eyebrow",
        style: {
          fontSize: "sm",
          fontWeight: "semibold",
          color: opts.onBrand ? "primaryInk" : "muted",
        },
      }),
    ],
    { label: L("التسمية", "Label"), style: { gap: 8, wrap: false } },
  );
}

type HeadOptions = {
  label?: DesignText;
  title: DesignText;
  link?: { text: DesignText; href: string };
  onBrand?: boolean;
  align?: "center";
};

/** The Modular section head: dot label and title, with a link at the end. */
export function modHead(t: TreeBuilder, o: HeadOptions): NodeTemplate {
  const center = o.align === "center";
  const copy = t.stack(
    [
      ...(o.label ? [dotLabel(t, o.label, { onBrand: o.onBrand })] : []),
      t.heading(o.title, "h2", {
        role: "title",
        style: {
          fontSize: "display-sm",
          letterSpacing: "tight",
          maxWidth: "22ch",
          ...(o.onBrand && { color: "primaryInk" }),
          ...(center && { textAlign: "center" }),
        },
      }),
    ],
    {
      label: L("العنوان", "Heading"),
      role: "intro",
      style: { gap: 10, ...(center && { alignItems: "center" }) },
    },
  );
  return t.row(
    [
      copy,
      ...(o.link
        ? [
            arrowLink(t, o.link.text, o.link.href, {
              style: { color: o.onBrand ? "primaryInk" : "primary" },
            }),
          ]
        : []),
    ],
    {
      label: L("رأس القسم", "Section head"),
      style: {
        justifyContent: center ? "center" : "between",
        alignItems: "end",
        gap: 16,
        marginBottom: 32,
        wrap: false,
      },
      mobile: { marginBottom: 22 },
    },
  );
}

/** `text` and an arrow, for use inside a card that is already a link (no nested link). */
export function arrowText(t: TreeBuilder, text: DesignText, color = "primary"): NodeTemplate {
  return t.row(
    [
      t.text(text, {
        style: { fontWeight: "semibold", fontSize: "sm", color },
      }),
      t.icon("arrow", { style: { fontSize: "md", color } }),
    ],
    {
      label: L("نص الرابط", "Link text"),
      role: "link",
      style: { gap: 6, wrap: false },
    },
  );
}

/** A pill link: optional round photo and an optional muted count. */
export function chip(t: TreeBuilder, text: DesignText, href: string, opts: { photo?: NodeTemplate; count?: DesignText; active?: boolean } = {}): NodeTemplate {
  return t.link(
    href,
    [
      t.row(
        [
          ...(opts.photo ? [opts.photo] : []),
          t.text(text, { style: { fontWeight: "semibold", fontSize: "sm" } }),
          ...(opts.count
            ? [
                t.text(opts.count, {
                  style: { color: "muted", fontSize: "sm" },
                }),
              ]
            : []),
        ],
        { label: L("المحتوى", "Content"), style: { gap: 8, wrap: false } },
      ),
    ],
    {
      label: L("شريحة", "Chip"),
      style: {
        radius: 999,
        borderWidth: 1,
        borderColor: opts.active ? "primary" : "border",
        background: opts.active ? "primary" : "background",
        color: opts.active ? "primaryInk" : "foreground",
        paddingTop: 10,
        paddingBottom: 10,
        paddingStart: opts.photo ? 6 : 18,
        paddingEnd: 18,
        hover: { borderColor: "primary" },
      },
    },
  );
}

/** A round sun play mark (decoration over a video poster or reel). */
export function playMark(t: TreeBuilder, size = 64): NodeTemplate {
  return t.box([t.icon("play", { style: { fontSize: "xl", color: "foreground" } })], {
    label: L("زر التشغيل", "Play mark"),
    style: {
      background: "accent",
      radius: 999,
      width: `${size}px`,
      paddingTop: Math.round(size * 0.3),
      paddingBottom: Math.round(size * 0.26),
      textAlign: "center",
    },
  });
}

/** A rounded progress bar filled to `width` (a percent string). */
export function bar(t: TreeBuilder, width: string, style: StyleValues = {}): NodeTemplate {
  return t.box(
    [
      t.box([], {
        label: L("الجزء الممتلئ", "Fill"),
        style: { background: "primary", radius: 999, minHeight: 8, width },
      }),
    ],
    {
      label: L("الشريط", "Bar"),
      style: { background: "border", radius: 999, minHeight: 8, ...style },
    },
  );
}

const AVATAR_TONES: StyleValues[] = [
  { background: "primary", color: "primaryInk" },
  { background: "accent", color: "foreground" },
  {
    background: "secondary",
    color: "foreground",
    borderWidth: 1,
    borderColor: "border",
  },
  { background: "foreground", color: "background" },
];

/** A round initial in one of four tones, with the name and a small line. */
export function who(t: TreeBuilder, initial: DesignText, name: DesignText, line: DesignText, tone = 0, opts: { onBrand?: boolean } = {}): NodeTemplate {
  const { color, ...surface } = AVATAR_TONES[tone % AVATAR_TONES.length]!;
  return t.row(
    [
      t.box(
        [
          t.text(initial, {
            style: {
              fontWeight: "bold",
              textAlign: "center",
              fontSize: "md",
              color,
            },
          }),
        ],
        {
          label: L("الصورة الرمزية", "Avatar"),
          style: {
            ...surface,
            radius: 999,
            width: "44px",
            paddingTop: 10,
            paddingBottom: 10,
          },
        },
      ),
      t.stack(
        [
          t.text(name, {
            style: {
              fontWeight: "semibold",
              ...(opts.onBrand && { color: "primaryInk" }),
            },
          }),
          t.text(line, {
            style: {
              fontSize: "xs",
              color: opts.onBrand ? "primaryInk" : "muted",
            },
          }),
        ],
        { label: L("الاسم", "Name"), style: { gap: 2 } },
      ),
    ],
    { label: L("الشخص", "Person"), style: { gap: 12, wrap: false } },
  );
}

/** An icon centred in a round paper disc. */
export function iconDisc(t: TreeBuilder, icon: ElementIconName, style: StyleValues = {}): NodeTemplate {
  return t.box(
    [
      t.icon(icon, {
        style: { fontSize: "lg", color: style.color ?? "foreground" },
      }),
    ],
    {
      label: L("أيقونة", "Icon"),
      style: {
        background: "background",
        radius: 999,
        width: "44px",
        paddingTop: 11,
        paddingBottom: 9,
        textAlign: "center",
        ...style,
      },
    },
  );
}

/** A solid or outline pill button with an optional leading icon. */
export function pillButton(
  t: TreeBuilder,
  text: DesignText,
  href: string,
  o: {
    icon?: ElementIconName;
    tone?: "brand" | "outline" | "on-brand" | "ink";
  } & NodeOptions = {},
): NodeTemplate {
  const tone = o.tone ?? "brand";
  const surface: StyleValues =
    tone === "brand"
      ? { background: "primary", color: "primaryInk" }
      : tone === "ink"
        ? { background: "foreground", color: "background" }
        : tone === "on-brand"
          ? {
              background: "transparent",
              color: "primaryInk",
              borderWidth: 2,
              borderColor: "primaryInk",
            }
          : {
              background: "transparent",
              color: "foreground",
              borderWidth: 2,
              borderColor: "border",
            };
  const { icon, tone: _tone, style, ...rest } = o;
  return t.link(
    href,
    [
      t.row(
        [
          ...(icon
            ? [
                t.icon(icon, {
                  style: { fontSize: "md", color: surface.color },
                }),
              ]
            : []),
          t.text(text, {
            style: { fontWeight: "semibold", color: surface.color },
          }),
        ],
        {
          label: L("المحتوى", "Content"),
          style: { gap: 8, wrap: false, justifyContent: "center" },
        },
      ),
    ],
    {
      label: L("زر", "Button"),
      role: "cta",
      ...rest,
      style: {
        ...surface,
        radius: 999,
        paddingTop: 12,
        paddingBottom: 12,
        paddingStart: 22,
        paddingEnd: 22,
        hover: { opacity: 85 },
        ...style,
      },
    },
  );
}
