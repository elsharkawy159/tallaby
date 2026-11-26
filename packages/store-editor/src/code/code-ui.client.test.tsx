import { renderToString } from "react-dom/server";
import { NextIntlClientProvider } from "next-intl";
import type { ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";
import type { ComponentNode } from "@workspace/store-sections";
import { EditorAdapterProvider } from "../adapter.client";
import type { EditorAdapter } from "../adapter.types";
import en from "../messages/en.json";
import { CodeSectionEntry } from "../panels/add/code-section-entry.client";
import { CodeNodeInspector } from "./code-inspector.client";
import { CodePreviewValueProvider, renderCanvasCodeNode } from "./code-preview.client";
import { codePreviewInput, createCodePreviewRunner, createCodePreviewStore, previewKey } from "./code-preview.lib";

const CAPABILITIES = {
  pages: true,
  templates: true,
  forms: true,
  explore: true,
  mediaLibrary: true,
  revisions: true,
  unpublish: true,
  preview: true,
  industrySwitcher: false,
  designSystem: true,
  publishLabel: "site",
} as const;

const preview = vi.fn();
const withCode = { capabilities: CAPABILITIES, code: { preview } } as unknown as EditorAdapter;
const withoutCode = { capabilities: CAPABILITIES } as unknown as EditorAdapter;

function render(adapter: EditorAdapter, node: ReactNode): string {
  return renderToString(
    <NextIntlClientProvider locale="en" messages={en} timeZone="Africa/Cairo">
      <EditorAdapterProvider adapter={adapter}>{node}</EditorAdapterProvider>
    </NextIntlClientProvider>,
  );
}

const ALL_TYPES_SCHEMA = {
  name: "All",
  settings: [
    { type: "header", content: "Heading row" },
    { type: "paragraph", content: "Help row" },
    { type: "text", id: "f_text", label: "L text", default: "Hello" },
    { type: "textarea", id: "f_textarea", label: "L textarea" },
    { type: "inline_richtext", id: "f_inline", label: "L inline" },
    { type: "richtext", id: "f_rich", label: "L rich" },
    { type: "number", id: "f_number", label: "L number", min: 1, max: 9 },
    { type: "range", id: "f_range", label: "L range", min: 0, max: 40, step: 2, unit: "px", default: 12 },
    { type: "checkbox", id: "f_check", label: "L check" },
    { type: "select", id: "f_select", label: "L select", options: [{ value: "a", label: "Opt A" }, { value: "b", label: "Opt B" }] },
    { type: "radio", id: "f_radio", label: "L radio", options: [{ value: "x", label: "Opt X" }] },
    { type: "text_alignment", id: "f_align", label: "L align" },
    { type: "color", id: "f_color", label: "L color", default: "#112233" },
    { type: "color_background", id: "f_bg", label: "L bg" },
    { type: "image_picker", id: "f_image", label: "L image" },
    { type: "url", id: "f_url", label: "L url" },
    { type: "video_url", id: "f_video", label: "L video" },
    { type: "product", id: "f_product", label: "L product" },
    { type: "product_list", id: "f_products", label: "L products", limit: 4 },
    { type: "collection", id: "f_collection", label: "L collection" },
    { type: "collection_list", id: "f_collections", label: "L collections" },
  ],
  blocks: [{ type: "item", name: "Item", settings: [{ type: "text", id: "label", label: "Item text" }] }],
  max_blocks: 3,
};

const codeNode = (props: Record<string, unknown> = {}): ComponentNode =>
  ({
    id: "n1",
    type: "code",
    props: {
      apiVersion: 1,
      name: "My code",
      source: "<p class=\"secret-source\">{{ section.settings.f_text }}</p>",
      schema: ALL_TYPES_SCHEMA,
      settings: { f_text: { ar: "مرحبا", en: "Hi there" } },
      blocks: [
        { id: "b1", type: "item", settings: { label: { ar: "أ", en: "A" } } },
        { id: "b2", type: "item", settings: {} },
      ],
      ...props,
    },
    children: [],
  }) as ComponentNode;

const catalog = {
  products: [{ id: "p1", title: { ar: "منتج", en: "Shirt" } }],
  categories: [{ id: "c1", name: { ar: "قسم", en: "Shirts" }, productCount: 2 }],
  forms: [],
} as never;

describe("Add › Code section", () => {
  it("is hidden when the host has no code preview", () => {
    expect(render(withoutCode, <CodeSectionEntry onAdd={() => {}} />)).toBe("");
  });

  it("shows when the host previews code", () => {
    const html = render(withCode, <CodeSectionEntry onAdd={() => {}} />);
    expect(html).toContain(en.storeEditor.code.add.label);
    expect(html).toContain('data-palette-entry="code-section"');
  });
});

describe("code node inspector", () => {
  const inspector = (props: Partial<Parameters<typeof CodeNodeInspector>[0]> = {}) =>
    render(
      withCode,
      <CodeNodeInspector
        node={codeNode()}
        onEdit={() => {}}
        locale="en"
        defaultLocale="en"
        uiLocale="en"
        catalog={catalog}
        storeId="s1"
        readOnly={false}
        {...props}
      />,
    );

  it("renders a field per schema setting type", () => {
    const html = inspector();
    for (const def of ALL_TYPES_SCHEMA.settings) {
      if ("label" in def) expect(html, def.type).toContain(`>${def.label}<`);
      if ("id" in def) expect(html, def.type).toContain(`id="n1-s-${def.id}"`);
    }
    expect(html).toContain("Heading row");
    expect(html).toContain("Help row");
    // Text shows the current language; the range shows its value and unit; choices and pickers are drawn.
    expect(html).toContain('value="Hi there"');
    expect(html).toContain('type="range"');
    expect(html).toContain("12<!-- -->px");
    expect(html).toContain("Opt A");
    expect(html).toContain(">Center<");
    expect(html).toContain('type="color"');
    expect(html).toContain("Shirt");
    expect(html).toContain("Shirts");
  });

  it("lists the blocks with add, reorder and remove controls", () => {
    const html = inspector();
    expect(html).toContain(en.storeEditor.code.blocks.title);
    expect(html).toContain("2<!-- -->/<!-- -->3");
    expect(html).toContain("Drag &amp; Drop to reorder Item 1");
    expect(html).toContain("Remove Item");
    expect(html).toContain("Add Item");
  });

  it("shows the name field and both tabs, with Content first", () => {
    const html = inspector();
    expect(html).toContain('value="My code"');
    expect(html).toMatch(/aria-selected="true"[^>]*>.*?Content/);
    expect(html).toContain(">Code<");
  });

  it("locks non-text settings and blocks while translating", () => {
    const html = inspector({ locale: "ar", defaultLocale: "en" });
    expect(html).toContain('value="مرحبا"');
    expect(html).toMatch(/<fieldset disabled=""[^>]*>.*?id="n1-s-f_color"/s);
  });
});

describe("canvas code node", () => {
  // The server render reads the store's initial state, so each case starts with its entries.
  const draw = (entries: (node: ComponentNode) => Parameters<typeof createCodePreviewStore>[0] = () => ({})) => {
    const node = codeNode();
    const store = createCodePreviewStore(entries(node));
    const target = { locale: "en" as const, pageId: "home" };
    const runner = createCodePreviewRunner({ preview: () => new Promise<never>(() => {}), store });
    return render(
      withCode,
      <CodePreviewValueProvider value={{ runner, store, target }}>{renderCanvasCodeNode(node, {} as never, undefined)}</CodePreviewValueProvider>,
    );
  };

  it("draws only the host's html and css", () => {
    const html = draw((node) => ({
        entries: { n1: { key: previewKey(codePreviewInput(node, { locale: "en", pageId: "home" })), status: "ready", html: "<p>From server</p>", css: '[data-node-id="n1"] p{color:red}', issues: [] } },
      }));
    expect(html).toContain('<div data-node-id="n1" data-node-type="code" class="code-node"><p>From server</p></div>');
    expect(html).toContain("<style data-code-node-css=\"n1\">[data-node-id=\"n1\"] p{color:red}</style>");
    // Nothing of the stored source reaches the frame.
    expect(html).not.toContain("secret-source");
    expect(html).not.toContain("section.settings");
  });

  it("shows the placeholder while loading and the first issue on an error", () => {
    expect(draw()).toContain(en.storeEditor.code.canvas.loading);
    const failed = draw(() => ({ entries: { n1: { key: "x", status: "error", html: "", css: "", issues: [{ code: "liquid", message: "Unknown tag", line: 3 }] } } }));
    expect(failed).toContain('role="alert"');
    expect(failed).toContain("Line 3: Unknown tag");
    expect(failed).not.toContain("secret-source");
  });
});
