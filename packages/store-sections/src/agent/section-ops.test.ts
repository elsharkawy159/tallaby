import { describe, expect, it } from "vitest";
import type { ComponentNode, SectionInstance } from "../config/schema";
import { joinSectionFile } from "../code/section-file";
import {
  applySectionOps,
  codeSectionInstance,
  describeAppliedOp,
  findCodeNode,
  isSafeAgentHref,
  MAX_CODE_OPS_PER_TURN,
  MAX_OPS_PER_TURN,
  SECTION_OP_NAMES,
  type ApplySectionOpsOptions,
} from "./section-ops";

const node = (id: string, type: ComponentNode["type"], props: Record<string, unknown> = {}, children: ComponentNode[] = [], extra: Partial<ComponentNode> = {}): ComponentNode => ({
  id,
  type,
  props,
  children,
  ...extra,
});

function hero(id = "s-hero"): SectionInstance {
  return {
    id,
    sectionId: "custom-section",
    version: 1,
    props: {},
    componentTree: [
      node(`${id}-root`, "section", {}, [
        node(`${id}-title`, "heading", { text: "أهلا", level: "h2", translations: { en: { text: "Hello" } } }, [], { style: { fontSize: "3xl" } }),
        node(`${id}-cta`, "button", { label: "تسوق", href: "/products" }),
        node(`${id}-bound`, "text", { bind: "title", text: "اسم المنتج" }),
        node(`${id}-img`, "image", { src: "", alt: "" }),
      ]),
    ],
  };
}

const FAQ_FILE = joinSectionFile({
  source: `<div class="faq"><h2>{{ section.settings.title }}</h2>{% for block in section.blocks %}<details {{ block.attributes }}><summary>{{ block.settings.q }}</summary>{{ block.settings.a }}</details>{% endfor %}</div>`,
  css: ".faq { padding-block: 24px; }",
  schema: {
    name: { ar: "أسئلة", en: "FAQ" },
    settings: [
      { type: "text", id: "title", label: { ar: "العنوان", en: "Title" }, default: { ar: "أسئلة شائعة", en: "FAQ" } },
      { type: "product", id: "featured", label: { ar: "منتج", en: "Product" } },
    ],
    blocks: [
      {
        type: "item",
        name: { ar: "سؤال", en: "Question" },
        settings: [
          { type: "text", id: "q", label: { ar: "السؤال", en: "Question" } },
          { type: "richtext", id: "a", label: { ar: "الإجابة", en: "Answer" } },
        ],
      },
    ],
    default: { blocks: [{ type: "item", settings: { q: { ar: "س١", en: "Q1" }, a: { ar: "<p>ج</p>", en: "<p>A</p>" } } }] },
  },
});

let seq = 0;
const opts = (extra: Partial<ApplySectionOpsOptions> = {}): ApplySectionOpsOptions => ({
  target: { kind: "page", sectionId: "s-hero" },
  defaultLocale: "ar",
  allowCode: true,
  makeId: (kind) => `${kind === "section" ? "s" : "n"}-t${++seq}`,
  ...extra,
});

const page = () => ({ sections: [hero("s-a"), hero("s-hero"), hero("s-b")] });

describe("applySectionOps", () => {
  it("never mutates its input", () => {
    const content = page();
    const before = JSON.stringify(content);
    applySectionOps(content, [{ op: "set_text", sectionId: "s-hero", nodeId: "s-hero-title", prop: "text", ar: "جديد" }, { op: "remove_section", sectionId: "s-hero" }], opts());
    expect(JSON.stringify(content)).toBe(before);
  });

  it("lists every op name", () => {
    expect(SECTION_OP_NAMES).toHaveLength(14);
  });

  describe("set_text", () => {
    it("writes the default language in props and the other in translations", () => {
      const { content, applied } = applySectionOps(page(), [{ op: "set_text", sectionId: "s-hero", nodeId: "s-hero-title", prop: "text", ar: "عرض", en: "Sale" }], opts());
      expect(applied).toHaveLength(1);
      const title = content.sections[1]!.componentTree![0]!.children[0]!;
      expect(title.props.text).toBe("عرض");
      expect((title.props.translations as Record<string, Record<string, string>>).en!.text).toBe("Sale");
    });

    it("writes English in props for an English-default store", () => {
      const { content } = applySectionOps(page(), [{ op: "set_text", sectionId: "s-hero", nodeId: "s-hero-title", prop: "text", en: "Sale" }], opts({ defaultLocale: "en" }));
      expect(content.sections[1]!.componentTree![0]!.children[0]!.props.text).toBe("Sale");
    });

    it("cleans HTML and caps the length", () => {
      const { applied } = applySectionOps(page(), [{ op: "set_text", sectionId: "s-hero", nodeId: "s-hero-title", prop: "text", ar: `<b onclick="x()">مرحبا</b><script>alert(1)</script>${"ا".repeat(500)}` }], opts());
      const op = applied[0]!.op as { ar: string };
      expect(op.ar).not.toMatch(/script|onclick/);
      expect(op.ar.length).toBeLessThanOrEqual(200);
    });

    it("refuses props that aren't text, bound elements and empty text", () => {
      const { rejected } = applySectionOps(
        page(),
        [
          { op: "set_text", sectionId: "s-hero", nodeId: "s-hero-title", prop: "level", ar: "h1" },
          { op: "set_text", sectionId: "s-hero", nodeId: "s-hero-bound", prop: "text", ar: "x" },
          { op: "set_text", sectionId: "s-hero", nodeId: "s-hero-title", prop: "text", ar: "  " },
          { op: "set_text", sectionId: "s-hero", nodeId: "missing", prop: "text", ar: "x" },
        ],
        opts(),
      );
      expect(rejected.map((r) => r.code)).toEqual(["not_text_prop", "bound_node", "empty_text", "node_not_found"]);
    });

    it("accepts a button label and an image alt text", () => {
      const { applied } = applySectionOps(
        page(),
        [
          { op: "set_text", sectionId: "s-hero", nodeId: "s-hero-cta", prop: "label", ar: "اطلب الآن", en: "Order now" },
          { op: "set_text", sectionId: "s-hero", nodeId: "s-hero-img", prop: "alt", ar: "صورة" },
        ],
        opts(),
      );
      expect(applied).toHaveLength(2);
    });
  });

  describe("set_image", () => {
    const MEDIA = "https://cdn.example/storage/v1/object/public/store-media/a/b/c.jpg";
    const own = (src: string) => (src === MEDIA ? src : null);
    const withPhoto = () => {
      const content = page();
      const img = content.sections[1]!.componentTree![0]!.children[3]!;
      img.props = { ...img.props, src: "https://images.example/old.jpg" };
      return content;
    };

    it("puts an allowed photo and its alt text in both languages", () => {
      const { content, applied, rejected } = applySectionOps(
        page(),
        [{ op: "set_image", sectionId: "s-hero", nodeId: "s-hero-img", src: ` ${MEDIA} `, alt: { ar: "فستان <b>أحمر</b>", en: "Red dress" } }],
        opts({ allowImage: own }),
      );
      expect(rejected).toEqual([]);
      const img = content.sections[1]!.componentTree![0]!.children[3]!;
      expect(img.props.src).toBe(MEDIA);
      expect(img.props.alt).toBe("فستان أحمر");
      expect((img.props.translations as Record<string, Record<string, string>>).en!.alt).toBe("Red dress");
      expect(applied[0]!.op).toEqual({ op: "set_image", sectionId: "s-hero", nodeId: "s-hero-img", src: MEDIA, alt: { ar: "فستان أحمر", en: "Red dress" } });
      expect(describeAppliedOp(applied[0]!, "en")).toBe("Changed a photo");
    });

    it("refuses a link the host doesn't own, and unsafe links", () => {
      const { rejected, applied } = applySectionOps(
        page(),
        [
          { op: "set_image", sectionId: "s-hero", nodeId: "s-hero-img", src: "https://evil.example/x.jpg" },
          { op: "set_image", sectionId: "s-hero", nodeId: "s-hero-img", src: "javascript:alert(1)" },
          { op: "set_image", sectionId: "s-hero", nodeId: "s-hero-img", src: "//evil.example/x.jpg" },
        ],
        opts({ allowImage: own }),
      );
      expect(applied).toEqual([]);
      expect(rejected.map((r) => r.code)).toEqual(["image_not_allowed", "unsafe_url", "unsafe_url"]);
    });

    it("always accepts a photo already in the same section", () => {
      const content = withPhoto();
      const title = content.sections[1]!.componentTree![0]!.children;
      title.push({ id: "s-hero-img2", type: "image", props: { src: "", alt: "" }, children: [] });
      const { applied } = applySectionOps(content, [{ op: "set_image", sectionId: "s-hero", nodeId: "s-hero-img2", src: "https://images.example/old.jpg" }], opts({ allowImage: () => null }));
      expect(applied).toHaveLength(1);
    });

    it("does not reuse a photo of another section without the host's check", () => {
      const content = withPhoto();
      const { rejected } = applySectionOps(
        content,
        [{ op: "set_image", sectionId: "s-a", nodeId: "s-a-img", src: "https://images.example/old.jpg" }],
        opts({ target: { kind: "page", sectionId: "s-a" }, allowImage: () => null }),
      );
      expect(rejected.map((r) => r.code)).toEqual(["image_not_allowed"]);
    });

    it("sets the section's background photo on its root element", () => {
      const { content, applied } = applySectionOps(page(), [{ op: "set_image", sectionId: "s-hero", nodeId: "s-hero-root", src: MEDIA, alt: { ar: "x" } }], opts({ allowImage: own }));
      expect(applied[0]!.op).toEqual({ op: "set_image", sectionId: "s-hero", nodeId: "s-hero-root", src: MEDIA });
      expect((content.sections[1]!.style as { shell: { bgImage: string } }).shell.bgImage).toBe(MEDIA);
    });

    it("refuses elements without a photo and bound photos", () => {
      const content = page();
      content.sections[1]!.componentTree![0]!.children.push({ id: "s-hero-pimg", type: "image", props: { bind: "image", src: "" }, children: [] });
      const { rejected } = applySectionOps(
        content,
        [
          { op: "set_image", sectionId: "s-hero", nodeId: "s-hero-title", src: MEDIA },
          { op: "set_image", sectionId: "s-hero", nodeId: "s-hero-pimg", src: MEDIA },
          { op: "set_image", sectionId: "s-hero", nodeId: "nope", src: MEDIA },
        ],
        opts({ allowImage: own }),
      );
      expect(rejected.map((r) => r.code)).toEqual(["not_image", "bound_node", "node_not_found"]);
    });

    it("without a host check, takes any safe src (the editor re-applying the server's ops)", () => {
      const { applied } = applySectionOps(page(), [{ op: "set_image", sectionId: "s-hero", nodeId: "s-hero-img", src: "https://images.example/new.jpg" }], opts());
      expect(applied).toHaveLength(1);
    });
  });

  describe("set_style", () => {
    it("keeps only whitelisted keys and writes the breakpoint slot", () => {
      const { content, applied } = applySectionOps(
        page(),
        [{ op: "set_style", sectionId: "s-hero", nodeId: "s-hero-title", breakpoint: "mobile", style: { fontSize: "5xl", color: "#ff0000", position: "fixed", behavior: "url(x)" } }],
        opts(),
      );
      const title = content.sections[1]!.componentTree![0]!.children[0]!;
      expect(title.breakpointStyles?.mobile).toEqual({ fontSize: "5xl", color: "#ff0000" });
      expect(title.style).toEqual({ fontSize: "3xl" });
      expect((applied[0]!.op as { style: unknown }).style).toEqual({ fontSize: "5xl", color: "#ff0000" });
    });

    it("styles the root element when no node is named", () => {
      const { content, applied } = applySectionOps(page(), [{ op: "set_style", sectionId: "s-hero", style: { background: "secondary" } }], opts());
      expect(content.sections[1]!.componentTree![0]!.style).toEqual({ background: "secondary" });
      expect((applied[0]!.op as { nodeId: string }).nodeId).toBe("s-hero-root");
    });

    it("refuses a style with no valid key", () => {
      expect(applySectionOps(page(), [{ op: "set_style", sectionId: "s-hero", style: { fontSize: "huge" } }], opts()).rejected[0]!.code).toBe("invalid_style");
    });
  });

  it("set_custom_css sets, clears and caps", () => {
    const set = applySectionOps(page(), [{ op: "set_custom_css", sectionId: "s-hero", nodeId: "s-hero-title", css: ":root { letter-spacing: 1px; }" }], opts());
    expect(set.content.sections[1]!.componentTree![0]!.children[0]!.customCss).toBe(":root { letter-spacing: 1px; }");
    const cleared = applySectionOps(set.content, [{ op: "set_custom_css", sectionId: "s-hero", nodeId: "s-hero-title", css: " " }], opts());
    expect(cleared.content.sections[1]!.componentTree![0]!.children[0]!.customCss).toBeUndefined();
    const section = applySectionOps(page(), [{ op: "set_custom_css", sectionId: "s-hero", css: "h2 { color: red; }" }], opts());
    expect(section.content.sections[1]!.customCss).toBe("h2 { color: red; }");
    expect(applySectionOps(page(), [{ op: "set_custom_css", sectionId: "s-hero", css: "a{}".repeat(3000) }], opts()).rejected[0]!.code).toBe("css_too_large");
  });

  it("set_link keeps safe links and refuses the rest", () => {
    const { applied, rejected } = applySectionOps(
      page(),
      [
        { op: "set_link", sectionId: "s-hero", nodeId: "s-hero-cta", href: "/about" },
        { op: "set_link", sectionId: "s-hero", nodeId: "s-hero-cta", href: "javascript:alert(1)" },
        { op: "set_link", sectionId: "s-hero", nodeId: "s-hero-title", href: "/x" },
      ],
      opts(),
    );
    expect(applied).toHaveLength(1);
    expect(rejected.map((r) => r.code)).toEqual(["unsafe_url", "not_link"]);
    expect(isSafeAgentHref("tel:+201000000000")).toBe(true);
    expect(isSafeAgentHref("mailto:a@b.co")).toBe(true);
    expect(isSafeAgentHref("#faq")).toBe(true);
    expect(isSafeAgentHref("//evil.com")).toBe(false);
    expect(isSafeAgentHref("data:text/html,x")).toBe(false);
  });

  describe("element ops", () => {
    it("removes, duplicates and hides elements; the root stays", () => {
      const { content, rejected } = applySectionOps(
        page(),
        [
          { op: "remove_node", sectionId: "s-hero", nodeId: "s-hero-img" },
          { op: "duplicate_node", sectionId: "s-hero", nodeId: "s-hero-cta" },
          { op: "hide_node", sectionId: "s-hero", nodeId: "s-hero-title", device: "mobile" },
          { op: "remove_node", sectionId: "s-hero", nodeId: "s-hero-root" },
        ],
        opts(),
      );
      const children = content.sections[1]!.componentTree![0]!.children;
      expect(children.map((c) => c.type)).toEqual(["heading", "button", "button", "text"]);
      expect(children[0]!.breakpointStyles?.mobile).toEqual({ hidden: true });
      expect(children[0]!.style).toEqual({ fontSize: "3xl" });
      expect(rejected.map((r) => r.code)).toEqual(["root_node"]);
    });

    it("hides on every device when none is named", () => {
      const { content } = applySectionOps(page(), [{ op: "hide_node", sectionId: "s-hero", nodeId: "s-hero-cta" }], opts());
      const cta = content.sections[1]!.componentTree![0]!.children[1]!;
      expect(cta.style?.hidden).toBe(true);
      expect(cta.breakpointStyles?.tablet?.hidden).toBe(true);
      expect(cta.breakpointStyles?.mobile?.hidden).toBe(true);
    });
  });

  describe("section ops", () => {
    it("moves, duplicates and removes sections", () => {
      const page2 = { sections: [hero("s-a"), hero("s-b"), hero("s-c")] };
      const target = { kind: "page" as const };
      const moved = applySectionOps(page2, [{ op: "move_section", sectionId: "s-c", to: 0 }], opts({ target }));
      expect(moved.content.sections.map((s) => s.id)).toEqual(["s-c", "s-a", "s-b"]);
      const dup = applySectionOps(page2, [{ op: "duplicate_section", sectionId: "s-a" }], opts({ target }));
      expect(dup.content.sections).toHaveLength(4);
      expect(dup.content.sections[1]!.id).not.toBe("s-a");
      expect(dup.content.sections[1]!.componentTree![0]!.id).not.toBe("s-a-root");
      const removed = applySectionOps(page2, [{ op: "remove_section", sectionId: "s-b" }], opts({ target }));
      expect(removed.content.sections.map((s) => s.id)).toEqual(["s-a", "s-c"]);
    });

    it("refuses edits on a section the turn doesn't target", () => {
      const { rejected, applied } = applySectionOps(
        page(),
        [
          { op: "set_text", sectionId: "s-a", nodeId: "s-a-title", prop: "text", ar: "x" },
          { op: "remove_section", sectionId: "s-b" },
          { op: "set_text", sectionId: "s-hero", nodeId: "s-a-title", prop: "text", ar: "x" },
          { op: "set_text", sectionId: "s-ghost", nodeId: "x", prop: "text", ar: "x" },
        ],
        opts(),
      );
      expect(applied).toHaveLength(0);
      expect(rejected.map((r) => r.code)).toEqual(["outside_target", "outside_target", "node_not_found", "section_not_found"]);
    });

    it("keeps the header itself fixed but lets its elements change", () => {
      const header = { sections: [hero("s-hdr")] };
      const target = { kind: "header" as const, sectionId: "s-hdr" };
      const { applied, rejected } = applySectionOps(
        header,
        [
          { op: "set_text", sectionId: "s-hdr", nodeId: "s-hdr-title", prop: "text", ar: "x" },
          { op: "remove_section", sectionId: "s-hdr" },
          { op: "duplicate_section", sectionId: "s-hdr" },
          { op: "add_code_section", file: FAQ_FILE },
          { op: "convert_to_code_section", sectionId: "s-hdr", file: FAQ_FILE },
        ],
        opts({ target }),
      );
      expect(applied).toHaveLength(1);
      expect(rejected.map((r) => r.code)).toEqual(["chrome_locked", "chrome_locked", "chrome_locked", "chrome_locked"]);
    });
  });

  describe("code ops", () => {
    it("adds a code section after the target, with the schema's default blocks and server-made ids", () => {
      const { content, applied } = applySectionOps(page(), [{ op: "add_code_section", file: FAQ_FILE, name: "FAQ", settings: { featured: "p-evil" } }], opts());
      expect(content.sections.map((s) => s.id)).toEqual(["s-a", "s-hero", applied[0]!.sectionId, "s-b"]);
      const added = content.sections[2]!;
      expect(added.sectionId).toBe("custom-section");
      expect(added.componentTree![0]!.type).toBe("section");
      const code = findCodeNode(added.componentTree)!;
      expect(code.id).toBe(applied[0]!.codeNodeId);
      expect(code.props.blocks).toHaveLength(1);
      // Picks are never the model's: the seller picks in the sidebar.
      expect((code.props.settings as Record<string, unknown>).featured).toBeUndefined();
      const op = applied[0]!.op as { newSectionId: string; newNodeId: string; after: string };
      expect(op.newSectionId).toBe(added.id);
      expect(op.newNodeId).toBe(code.id);
      expect(op.after).toBe("s-hero");
    });

    it("applying the normalised op again gives the same section", () => {
      const first = applySectionOps(page(), [{ op: "add_code_section", file: FAQ_FILE }], opts());
      const again = applySectionOps(page(), first.applied.map((a) => a.op), opts());
      expect(again.content).toEqual(first.content);
    });

    it("updates a code section and keeps the seller's values for kept ids", () => {
      const added = applySectionOps(page(), [{ op: "add_code_section", file: FAQ_FILE }], opts());
      const id = added.applied[0]!.sectionId;
      const withValue = applySectionOps(added.content, [{ op: "update_code_section", sectionId: id, settings: { title: { ar: "أسئلتكم", en: "Your questions" }, featured: "p-1" } }], opts({ target: { kind: "page", sectionId: id } }));
      const code = findCodeNode(withValue.content.sections.find((s) => s.id === id)!.componentTree)!;
      expect((code.props.settings as Record<string, unknown>).title).toEqual({ ar: "أسئلتكم", en: "Your questions" });
      expect((code.props.settings as Record<string, unknown>).featured).toBeUndefined();
      // A new file without settings keeps the stored values.
      const newFile = FAQ_FILE.replace('class="faq"', 'class="faq faq--wide"');
      const updated = applySectionOps(withValue.content, [{ op: "update_code_section", sectionId: id, file: newFile }], opts({ target: { kind: "page", sectionId: id } }));
      const after = findCodeNode(updated.content.sections.find((s) => s.id === id)!.componentTree)!;
      expect(after.props.source).toContain("faq--wide");
      expect((after.props.settings as Record<string, unknown>).title).toEqual({ ar: "أسئلتكم", en: "Your questions" });
      expect(after.props.blocks).toEqual(code.props.blocks);
    });

    it("keeps the seller's picks on update", () => {
      const added = applySectionOps(page(), [{ op: "add_code_section", file: FAQ_FILE }], opts());
      const id = added.applied[0]!.sectionId;
      const sections = added.content.sections.map((s) =>
        s.id === id ? { ...s, componentTree: s.componentTree!.map((root) => ({ ...root, children: root.children.map((c) => ({ ...c, props: { ...c.props, settings: { ...(c.props.settings as object), featured: "p-mine" } } })) })) } : s,
      );
      const updated = applySectionOps({ sections }, [{ op: "update_code_section", sectionId: id, settings: { featured: "p-other" } }], opts({ target: { kind: "page", sectionId: id } }));
      expect((findCodeNode(updated.content.sections.find((s) => s.id === id)!.componentTree)!.props.settings as Record<string, unknown>).featured).toBe("p-mine");
    });

    it("refuses update on a tree section", () => {
      expect(applySectionOps(page(), [{ op: "update_code_section", sectionId: "s-hero", file: FAQ_FILE }], opts()).rejected[0]!.code).toBe("not_code_section");
    });

    it("converts a tree section in place", () => {
      const { content, applied } = applySectionOps(page(), [{ op: "convert_to_code_section", sectionId: "s-hero", file: FAQ_FILE }], opts());
      expect(content.sections.map((s) => s.id)).toEqual(["s-a", "s-hero", "s-b"]);
      expect(findCodeNode(content.sections[1]!.componentTree)!.id).toBe(applied[0]!.codeNodeId);
    });

    it("refuses code ops when code sections are off", () => {
      const { rejected } = applySectionOps(page(), [{ op: "add_code_section", file: FAQ_FILE }, { op: "convert_to_code_section", sectionId: "s-hero", file: FAQ_FILE }], opts({ allowCode: false }));
      expect(rejected.map((r) => r.code)).toEqual(["code_disabled", "code_disabled"]);
    });

    it("refuses a file with schema problems, with the issues", () => {
      const bad = joinSectionFile({ source: "<p>x</p>", css: "", schema: { name: "X", settings: [{ type: "magic", id: "m", label: "M" }] } });
      const { rejected } = applySectionOps(page(), [{ op: "add_code_section", file: bad }], opts());
      expect(rejected[0]!.code).toBe("invalid_code");
      expect(rejected[0]!.issues?.length).toBeGreaterThan(0);
    });
  });

  describe("caps", () => {
    it(`refuses ops after the first ${MAX_OPS_PER_TURN}`, () => {
      const ops = Array.from({ length: MAX_OPS_PER_TURN + 2 }, () => ({ op: "set_style", sectionId: "s-hero", nodeId: "s-hero-title", style: { gap: 4 } }));
      const { applied, rejected } = applySectionOps(page(), ops, opts());
      expect(applied).toHaveLength(MAX_OPS_PER_TURN);
      expect(rejected.map((r) => r.code)).toEqual(["too_many_ops", "too_many_ops"]);
    });

    it(`refuses code ops after the first ${MAX_CODE_OPS_PER_TURN}`, () => {
      const ops = Array.from({ length: MAX_CODE_OPS_PER_TURN + 1 }, () => ({ op: "add_code_section", file: FAQ_FILE, after: "end" }));
      const { applied, rejected } = applySectionOps(page(), ops, opts());
      expect(applied).toHaveLength(MAX_CODE_OPS_PER_TURN);
      expect(rejected.map((r) => r.code)).toEqual(["too_many_code_ops"]);
    });

    it("refuses invalid ops and ids the model made up for new things are only used when free", () => {
      const { rejected } = applySectionOps(page(), [{ op: "nope" }, { op: "set_text", sectionId: "bad id!", nodeId: "x", prop: "text" }, null], opts());
      expect(rejected.map((r) => r.code)).toEqual(["invalid_op", "invalid_op", "invalid_op"]);
      const taken = applySectionOps(page(), [{ op: "add_code_section", file: FAQ_FILE, newSectionId: "s-a", newNodeId: "s-a-title" }], opts());
      expect(taken.applied[0]!.sectionId).not.toBe("s-a");
      expect(taken.applied[0]!.codeNodeId).not.toBe("s-a-title");
    });
  });

  it("a validator refuses the op and keeps the content before it", () => {
    const { content, rejected } = applySectionOps(page(), [{ op: "remove_section", sectionId: "s-hero" }], opts({ validate: () => [{ code: "invalid_schema", message: "no" }] }));
    expect(rejected[0]!.code).toBe("invalid_result");
    expect(content.sections).toHaveLength(3);
  });

  it("describes applied ops in both languages", () => {
    const { applied } = applySectionOps(page(), [{ op: "set_style", sectionId: "s-hero", nodeId: "s-hero-title", breakpoint: "mobile", style: { gap: 4 } }], opts());
    expect(describeAppliedOp(applied[0]!, "en")).toBe("Changed the style (mobile)");
    expect(describeAppliedOp(applied[0]!, "ar")).toContain("الموبايل");
  });
});

describe("codeSectionInstance", () => {
  it("builds section → code", () => {
    let n = 0;
    const made = codeSectionInstance({ source: "<p>x</p>" }, { sectionId: "s-1", codeNodeId: "n-code", makeNodeId: () => `n-${++n}` })!;
    expect(made.instance).toMatchObject({ id: "s-1", sectionId: "custom-section", version: 1, props: {} });
    expect(made.instance.componentTree![0]!.type).toBe("section");
    expect(made.instance.componentTree![0]!.children[0]).toMatchObject({ id: "n-code", type: "code" });
  });
});
