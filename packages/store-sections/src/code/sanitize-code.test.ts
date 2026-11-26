import { describe, expect, it } from "vitest";
import { sanitizeCodeHtml } from "./sanitize-code";
import { findBlockedConstructs } from "./blocked";

const clean = (html: string) => sanitizeCodeHtml(html, { nodeId: "n1" });

describe("sanitizeCodeHtml: allowed markup survives", () => {
  it("keeps a realistic product card", () => {
    const html =
      '<article class="card" data-product="42">' +
      '<a href="/products/linen-shirt" class="card__link">' +
      '<picture><source srcset="https://cdn.example.com/a.webp 1x, https://cdn.example.com/a@2x.webp 2x" type="image/webp" />' +
      '<img src="https://cdn.example.com/a.jpg" alt="Linen shirt" width="400" height="500" loading="lazy" decoding="async" /></picture>' +
      '<h3 class="card__title">Linen shirt</h3></a>' +
      '<p class="card__price"><s>EGP 900</s> <strong>EGP 750</strong> <small>VAT included</small></p>' +
      '<span class="badge" aria-label="On sale" role="status">Sale</span>' +
      "</article>";
    expect(clean(html)).toBe(html);
  });

  it("keeps a table", () => {
    const html =
      '<table class="sizes"><caption>Size guide</caption>' +
      "<thead><tr><th>Size</th><th colspan=\"2\">Chest</th></tr></thead>" +
      '<tbody><tr><td>M</td><td rowspan="2">100</td><td>cm</td></tr></tbody>' +
      "<tfoot><tr><td>All sizes in cm</td></tr></tfoot></table>";
    expect(clean(html)).toBe(html);
  });

  it("keeps a details FAQ", () => {
    const html =
      '<section class="faq"><h2>FAQ</h2>' +
      "<details open><summary>Do you ship to Alexandria?</summary><p>Yes, in 2 to 3 days.</p></details>" +
      "<details><summary>Can I return an item?</summary><p>Within <em>14 days</em>.</p></details>" +
      '<ol start="3" reversed type="a"><li>One</li></ol>' +
      '<p>Updated <time datetime="2026-11-26">today</time>.<br />Questions? <a href="mailto:hi@example.com">Email us</a> or <a href="tel:+201000000000">call</a>.</p>' +
      "</section>";
    expect(clean(html)).toBe(html);
  });

  it("keeps an inline SVG icon with a gradient, in browser case", () => {
    const html =
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" aria-hidden="true">' +
      "<title>Star</title>" +
      '<defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1" gradientUnits="objectBoundingBox">' +
      '<stop offset="0" stop-color="#f90" /><stop offset="1" stop-color="#f30" stop-opacity="0.8" /></linearGradient></defs>' +
      '<path d="M12 2l3 7h7l-6 4 2 7-6-4-6 4 2-7-6-4h7z" fill="url(#g)" stroke="#000" stroke-width="1" stroke-linejoin="round" />' +
      "</svg>";
    const out = clean(html);
    expect(out).toContain("<linearGradient ");
    expect(out).toContain("</linearGradient>");
    expect(out).toContain('viewBox="0 0 24 24"');
    expect(out).toContain('gradientUnits="objectBoundingBox"');
    // The gradient id and its reference are prefixed together.
    expect(out).toContain('id="c-n1-g"');
    expect(out).toContain('fill="url(#c-n1-g)"');
    // Self-closed SVG children come back with an explicit end tag.
    expect(out).toBe(
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" aria-hidden="true">' +
        "<title>Star</title>" +
        '<defs><linearGradient id="c-n1-g" x1="0" y1="0" x2="1" y2="1" gradientUnits="objectBoundingBox">' +
        '<stop offset="0" stop-color="#f90"></stop><stop offset="1" stop-color="#f30" stop-opacity="0.8"></stop></linearGradient></defs>' +
        '<path d="M12 2l3 7h7l-6 4 2 7-6-4-6 4 2-7-6-4h7z" fill="url(#c-n1-g)" stroke="#000" stroke-width="1" stroke-linejoin="round"></path>' +
        "</svg>",
    );
  });

  it("accepts SVG names in any case", () => {
    expect(clean('<SVG VIEWBOX="0 0 1 1"><LINEARGRADIENT ID="a"></LINEARGRADIENT></SVG>')).toBe(
      '<svg viewBox="0 0 1 1"><linearGradient id="c-n1-a"></linearGradient></svg>',
    );
  });
});

describe("sanitizeCodeHtml: ids", () => {
  it("prefixes every id and ARIA id reference", () => {
    expect(clean('<div id="hero"><h2 id="t">Hi</h2><p aria-labelledby="t hero">x</p></div>')).toBe(
      '<div id="c-n1-hero"><h2 id="c-n1-t">Hi</h2><p aria-labelledby="c-n1-t c-n1-hero">x</p></div>',
    );
  });

  it("uses the node id it was given", () => {
    expect(sanitizeCodeHtml('<p id="a">x</p>', { nodeId: "node_9-Z" })).toBe('<p id="c-node_9-Z-a">x</p>');
  });

  it("drops an empty id", () => {
    expect(clean('<p id="">x</p>')).toBe("<p>x</p>");
  });
});

describe("sanitizeCodeHtml: links", () => {
  it("forces rel on target=_blank", () => {
    expect(clean('<a href="https://example.com" target="_blank">x</a>')).toBe(
      '<a href="https://example.com" target="_blank" rel="noopener noreferrer">x</a>',
    );
    expect(clean('<a href="https://example.com" target="_BLANK" rel="nofollow opener">x</a>')).toBe(
      '<a href="https://example.com" target="_blank" rel="noopener noreferrer nofollow">x</a>',
    );
  });

  it("drops any other target", () => {
    expect(clean('<a href="/x" target="_top">x</a>')).toBe('<a href="/x">x</a>');
    expect(clean('<a href="/x" target="checkout">x</a>')).toBe('<a href="/x">x</a>');
  });

  it("keeps allowed hrefs and drops the rest", () => {
    expect(clean('<a href="#faq">x</a>')).toBe('<a href="#faq">x</a>');
    expect(clean('<a href="?page=2">x</a>')).toBe('<a href="?page=2">x</a>');
    expect(clean('<a href="http://example.com">x</a>')).toBe('<a href="http://example.com">x</a>');
    expect(clean('<a href="//evil.com">x</a>')).toBe("<a>x</a>");
    expect(clean('<a href="\\\\evil.com">x</a>')).toBe("<a>x</a>");
    expect(clean('<a href="/\\evil.com">x</a>')).toBe("<a>x</a>");
    expect(clean('<a href="ftp://example.com">x</a>')).toBe("<a>x</a>");
  });

  it("allows only https or relative image sources", () => {
    expect(clean('<img src="/a.png" alt="" />')).toBe('<img src="/a.png" alt="" />');
    expect(clean('<img src="http://example.com/a.png" alt="a" />')).toBe('<img alt="a" />');
    expect(clean('<img srcset="/a.png 1x, http://x.com/b.png 2x" alt="a" />')).toBe('<img alt="a" />');
  });
});

describe("sanitizeCodeHtml: style", () => {
  it("keeps a safe style", () => {
    expect(clean('<div style="color: red; padding: 1rem 2rem; background-image: url(https://cdn.example.com/a.jpg)">x</div>')).toBe(
      '<div style="color: red; padding: 1rem 2rem; background-image: url(https://cdn.example.com/a.jpg)">x</div>',
    );
  });

  it("drops a style that fails as a whole", () => {
    expect(clean('<div style="color: red; background: url(javascript:alert(1))">x</div>')).toBe("<div>x</div>");
    expect(clean('<div style="width: expression(alert(1))">x</div>')).toBe("<div>x</div>");
    expect(clean('<div style="background: url(//evil.com/a.png)">x</div>')).toBe("<div>x</div>");
    expect(clean('<div style="color: red; behavior: url(x.htc)">x</div>')).toBe("<div>x</div>");
    expect(clean('<div style="color: re\\64">x</div>')).toBe("<div>x</div>");
    expect(clean('<div style="not a declaration">x</div>')).toBe("<div>x</div>");
  });
});

describe("sanitizeCodeHtml: removed content", () => {
  it("removes blocked tags with their content and never leaks their text", () => {
    expect(clean("<p>a</p><script>alert(1)</script><style>p{color:red}</style><textarea>secret</textarea><p>b</p>")).toBe(
      "<p>a</p><p>b</p>",
    );
    expect(clean('<form action="/x"><input name="card" /><button>Pay</button></form><p>ok</p>')).toBe("<p>ok</p>");
  });

  it("removes comments and conditional comments", () => {
    expect(clean("<!-- hi --><p>a</p><!--[if IE]><p>ie</p><![endif]-->")).toBe("<p>a</p>");
  });

  it("drops a link inside an SVG but keeps its text", () => {
    expect(clean('<svg><a href="https://example.com"><text>x</text></a></svg>')).toBe("<svg>x</svg>");
  });

  it("removes every event handler", () => {
    expect(clean('<div onclick="x()" ONMOUSEOVER="y()" data-x="1">a</div>')).toBe('<div data-x="1">a</div>');
  });

  it("drops data-* names the builder and storefront runtimes read", () => {
    expect(
      clean('<div data-node-id="x" data-section-id="y" data-editor-action="delete" data-sf-link="/a" data-part="p" data-slot="s" data-card="1">a</div>'),
    ).toBe('<div data-card="1">a</div>');
  });

  it("drops attribute values that carry markup", () => {
    expect(clean('<img src="/a.png" alt="</style><b>" title="ok" />')).toBe('<img src="/a.png" title="ok" />');
  });

  it("drops a data-* value that is a javascript: URL", () => {
    expect(clean('<div data-href="javascript:alert(1)" data-ok="yes">a</div>')).toBe('<div data-ok="yes">a</div>');
  });
});

describe("sanitizeCodeHtml: nodeId", () => {
  it("throws on a bad nodeId", () => {
    for (const nodeId of ["", "a b", "a\"b", "x".repeat(65), "<x>", "a.b"]) {
      expect(() => sanitizeCodeHtml("<p>x</p>", { nodeId })).toThrow();
    }
    expect(() => sanitizeCodeHtml("<p>x</p>", { nodeId: undefined as unknown as string })).toThrow();
  });

  it("returns '' for empty input", () => {
    expect(clean("")).toBe("");
  });
});

describe("findBlockedConstructs", () => {
  it("reports kinds with 1-based line and column", () => {
    const source = [
      '<div class="x">',          // 1
      "  <script>alert(1)</script>", // 2
      '  <img src="a.png" onerror="x()">', // 3
      '  <a href="java&#x09;script:alert(1)">x</a>', // 4
      "  <form><iframe></iframe></form>", // 5
      "<style>p{}</style><object></object><embed>", // 6
      '<meta charset="utf-8"><base href="/"><link rel="stylesheet">', // 7
      "{%- javascript -%}alert(1){% endjavascript %}", // 8
      "</div>",
    ].join("\n");
    const issues = findBlockedConstructs(source).map(({ kind, line, column }) => ({ kind, line, column }));
    expect(issues).toEqual([
      { kind: "script", line: 2, column: 3 },
      { kind: "event_handler", line: 3, column: 20 },
      { kind: "javascript_url", line: 4, column: 12 },
      { kind: "form", line: 5, column: 3 },
      { kind: "iframe", line: 5, column: 9 },
      { kind: "style_tag", line: 6, column: 1 },
      { kind: "object", line: 6, column: 19 },
      { kind: "object", line: 6, column: 36 },
      { kind: "meta", line: 7, column: 1 },
      { kind: "base", line: 7, column: 23 },
      { kind: "link", line: 7, column: 38 },
      { kind: "javascript_tag", line: 8, column: 1 },
    ]);
  });

  it("finds entity-encoded and split javascript: schemes", () => {
    expect(findBlockedConstructs('<a href="&#106;avascript&colon;x">').map((i) => i.kind)).toEqual(["javascript_url"]);
    expect(findBlockedConstructs('<a href="java\nscript:x">')[0]).toMatchObject({ kind: "javascript_url", line: 1, column: 10 });
    expect(findBlockedConstructs('<a href="JaVaScRiPt:x">').map((i) => i.kind)).toEqual(["javascript_url"]);
  });

  it("still checks inside comment and raw blocks", () => {
    const source = "{% comment %}<script>x</script>{% endcomment %}\n{% raw %}<iframe>{% endraw %}";
    expect(findBlockedConstructs(source).map(({ kind, line }) => ({ kind, line }))).toEqual([
      { kind: "script", line: 1 },
      { kind: "iframe", line: 2 },
    ]);
  });

  it("does not report allowed code or look-alike names", () => {
    expect(
      findBlockedConstructs(
        '<div class="hero" data-on="1"><link-card></link-card><baseline></baseline>{% stylesheet %}.a{}{% endstylesheet %}<p>Shipping on time</p></div>',
      ),
    ).toEqual([]);
  });

  it("writes messages that name no other platform", () => {
    const all = findBlockedConstructs('<script><style><form><iframe><object><meta><base><link><a onclick="x" href="javascript:x">{% javascript %}');
    expect(new Set(all.map((i) => i.kind)).size).toBe(11);
    for (const issue of all) {
      expect(issue.message).toMatch(/\S/);
      expect(issue.message.toLowerCase()).not.toMatch(/shopify|salla|zid|woocommerce|wix|squarespace|bigcommerce/);
    }
  });
});
