import { describe, expect, it } from "vitest";
import {
  ALLOWED_TAGS,
  DROPPED_TAG_NAMES,
  checkLiquidSource,
  clearLiquidCache,
  liquidCacheSize,
  liquidEngine,
  renderLiquid,
} from "./liquid.server";
import { LiquidHtml, toLiquidBlock, type LiquidScope } from "./liquid-objects";

const baseScope: LiquidScope = {
  section: { id: "s1", settings: {}, blocks: [] },
  shop: { name: "Shop", url: "https://shop.tallaby.com", logo: null, currency: "EGP", locale: "en", dir: "ltr" },
  request: { locale: "en", page_type: "page", design_mode: false },
  routes: { root_url: "/", collections_url: "/collections", cart_url: "/cart", search_url: "/search" },
  settings: {},
  localization: { language: { iso_code: "en", name: "English" }, direction: "ltr" },
};
const ctx = { locale: "en" as const, currency: "EGP" };

function render(source: string, extra: Record<string, unknown> = {}) {
  return renderLiquid(source, { ...baseScope, ...extra } as LiquidScope, ctx);
}
function html(source: string, extra: Record<string, unknown> = {}) {
  const out = render(source, extra);
  expect(out.error).toBeUndefined();
  return out.html;
}

describe("engine registry", () => {
  it("registers exactly the allowed tags plus the refusing ones", () => {
    expect(Object.keys(liquidEngine.tags).sort()).toEqual([...ALLOWED_TAGS, ...DROPPED_TAG_NAMES].sort());
  });

  it("uses the safety options", () => {
    const o = liquidEngine.options;
    expect(o.ownPropertyOnly).toBe(true);
    expect(o.strictFilters).toBe(true);
    expect(o.strictVariables).toBe(false);
    expect(o.parseLimit).toBe(64 * 1024);
    expect(o.renderLimit).toBe(50);
    expect(o.memoryLimit).toBe(1e6);
    expect(typeof o.outputEscape).toBe("function");
  });
});

describe("escaping", () => {
  it("escapes every {{ }} value", () => {
    expect(html("{{ x }}", { x: "<img onerror=1>" })).toBe("&lt;img onerror=1&gt;");
    expect(html("{{ x }}", { x: `"'&` })).toBe("&quot;&#39;&amp;");
    expect(html("{{ x | upcase }}", { x: "<b>" })).toBe("&lt;B&gt;");
  });

  it("escapes echo and cycle values", () => {
    expect(html("{% echo x %}", { x: "<i>" })).toBe("&lt;i&gt;");
    expect(html("{% liquid\necho x\n%}", { x: "<i>" })).toBe("&lt;i&gt;");
    expect(html("{% cycle x, 'b' %}", { x: "<i>" })).toBe("&lt;i&gt;");
  });

  it("lets raw opt out", () => {
    expect(html("{{ x | raw }}", { x: "<b>hi</b>" })).toBe("<b>hi</b>");
  });

  it("prints LiquidHtml as markup, and escapes it again once a filter changes it", () => {
    const rich = new LiquidHtml("<p>Hi <b>there</b></p>");
    expect(html("{{ rich }}", { rich })).toBe("<p>Hi <b>there</b></p>");
    expect(html("{{ rich | upcase }}", { rich })).toBe("&lt;P&gt;HI &lt;B&gt;THERE&lt;/B&gt;&lt;/P&gt;");
    expect(html("{{ rich.toString }}{{ rich.constructor }}", { rich })).toBe("");
  });

  it("prints block.attributes as an attribute with the id escaped", () => {
    const blocks = [toLiquidBlock({ id: 'b_1"><x', type: "slide", settings: { title: "<t>" } })];
    expect(
      html("{% for block in section.blocks %}<div {{ block.attributes }}>{{ block.settings.title }}</div>{% endfor %}", {
        section: { id: "s", settings: {}, blocks },
      }),
    ).toBe('<div data-block-id="b_1&quot;&gt;&lt;x">&lt;t&gt;</div>');
  });
});

describe("allowed tags", () => {
  const cases: [string, string, Record<string, unknown>?][] = [
    ["{% if a > 1 %}big{% elsif a == 1 %}one{% else %}small{% endif %}", "one", { a: 1 }],
    ["{% unless a %}no{% endunless %}", "no", { a: false }],
    ["{% case a %}{% when 1 %}one{% when 2, 3 %}few{% else %}many{% endcase %}", "few", { a: 3 }],
    ["{% for i in (1..5) limit: 2 offset: 1 %}{{ i }}{% endfor %}", "23"],
    ["{% for i in (1..3) reversed %}{{ i }}{% endfor %}", "321"],
    ["{% for i in (1..9) %}{% if i == 2 %}{% continue %}{% endif %}{% if i == 4 %}{% break %}{% endif %}{{ i }}{% endfor %}", "13"],
    ["{% for i in list %}{{ forloop.index }}{% else %}empty{% endfor %}", "empty", { list: [] }],
    ["{% assign n = 'a' | append: 'b' %}{{ n }}", "ab"],
    ["{% capture c %}x{{ 1 | plus: 1 }}{% endcapture %}{{ c }}", "x2"],
    ["a{% comment %}{% include 'x' %} hidden{% endcomment %}b", "ab"],
    ["a{% # inline note %}b", "ab"],
    ["{% raw %}{{ not run }}{% endraw %}", "{{ not run }}"],
    ["{% for i in (1..3) %}{% cycle 'a', 'b' %}{% endfor %}", "aba"],
    ["{% increment c %}{% increment c %}{% decrement d %}", "01-1"],
    ["{% liquid\nassign x = 2\nif x > 1\necho 'yes'\nendif\n%}", "yes"],
    ["{% echo 'hi' | upcase %}", "HI"],
    ["{{ missing | default: 'fallback' }}", "fallback"],
    ["{{ '<b>' | escape | raw }}", "&lt;b&gt;"],
  ];
  for (const [source, expected, extra] of cases) {
    it(source, () => {
      expect(checkLiquidSource(source)).toEqual([]);
      expect(html(source, extra)).toBe(expected);
    });
  }
});

describe("dropped tags", () => {
  const sources: Record<string, string> = {
    include: "{% include 'card' %}",
    render: "{% render 'card' %}",
    layout: "{% layout 'theme' %}",
    block: "{% block main %}x{% endblock %}",
    tablerow: "{% tablerow i in (1..2) %}{{ i }}{% endtablerow %}",
    javascript: "{% javascript %}alert(1){% endjavascript %}",
    form: "{% form 'contact' %}<input>{% endform %}",
    paginate: "{% paginate collection.products by 4 %}x{% endpaginate %}",
    section: "{% section 'header' %}",
    sections: "{% sections 'footer-group' %}",
    content_for: "{% content_for 'blocks' %}",
    style: "{% style %}p{}{% endstyle %}",
    stylesheet: "{% stylesheet %}p{}{% endstylesheet %}",
    schema: '{% schema %}{"name":"x"}{% endschema %}',
  };

  it("covers every dropped tag", () => {
    expect(Object.keys(sources).sort()).toEqual([...DROPPED_TAG_NAMES].sort());
  });

  for (const [tag, source] of Object.entries(sources)) {
    it(`refuses {% ${tag} %} with one clear issue`, () => {
      const issues = checkLiquidSource(`<p>ok</p>\n  ${source}`);
      expect(issues).toHaveLength(1);
      expect(issues[0]).toMatchObject({ code: "tag_not_allowed", line: 2, column: 3 });
      expect(issues[0]?.message).toContain(`{% ${tag} %}`);
      expect(issues[0]?.message).not.toMatch(/shopify/i);
      const out = render(source);
      expect(out.html).toBe("");
      expect(out.error?.kind).toBe("parse");
    });
  }

  it("refuses a dropped tag inside {% liquid %}", () => {
    expect(checkLiquidSource("{% liquid\n  render 'x'\n%}")).toEqual([
      expect.objectContaining({ code: "tag_not_allowed", line: 2, column: 3 }),
    ]);
  });

  it("collects several errors at once", () => {
    const issues = checkLiquidSource("{% include 'a' %}\n{{ x | nope }}\n{% form 'x' %}{% endform %}");
    expect(issues.map((i) => [i.code, i.line])).toEqual([
      ["tag_not_allowed", 1],
      ["unknown_filter", 2],
      ["tag_not_allowed", 3],
    ]);
  });
});

describe("errors", () => {
  it("makes an unknown filter a parse error", () => {
    expect(checkLiquidSource("<p>\n{{ x | evil }}</p>")).toEqual([{ code: "unknown_filter", message: 'Unknown filter "evil".', params: { filter: "evil" }, line: 2, column: 1 }]);
    expect(render("{{ x | evil }}").error?.kind).toBe("parse");
  });

  it("renders an unknown variable as empty", () => {
    expect(html("[{{ nothing }}][{{ product.title }}][{{ cart.item_count }}][{{ customer.name }}]")).toBe("[][][][]");
  });

  it("reports syntax errors with a position", () => {
    expect(checkLiquidSource("<p>\n{% if %}x{% endif %}")[0]).toMatchObject({ code: "liquid_syntax", line: 2 });
    expect(checkLiquidSource("{% for i in (1..2) %}")[0]?.code).toBe("liquid_syntax");
    expect(checkLiquidSource("{{ x ")[0]?.code).toBe("liquid_syntax");
    const out = render("{% if a %}");
    expect(out).toMatchObject({ html: "", error: { kind: "parse" } });
  });

  it("refuses a source over 64 KB", () => {
    const big = "x".repeat(64 * 1024 + 1);
    expect(checkLiquidSource(big)[0]?.code).toBe("source_too_large");
    expect(render(big).error?.kind).toBe("limit");
  });

  it("never throws on render errors", () => {
    const out = render("{{ 'a' | append }}");
    expect(out.html).toBe("");
    expect(out.error?.kind).toBe("render");
  });
});

describe("prototype access", () => {
  it("renders constructor and __proto__ as empty", () => {
    const source =
      "[{{ x.constructor }}][{{ x.__proto__ }}][{{ section.constructor }}][{{ section.blocks.constructor }}]" +
      "[{{ x.constructor.constructor }}][{{ 'abc'.constructor }}][{{ section['__proto__'] }}][{{ list.__proto__.push }}][{{ x.hasOwnProperty }}]";
    expect(html(source, { x: { a: 1 }, list: [1] })).toBe("[][][][][][][][][]");
  });

  it("can't reach a prototype through assign either", () => {
    expect(html("{% assign c = x.constructor %}{{ c.name }}{{ c.prototype }}", { x: {} })).toBe("");
  });
});

describe("limits", () => {
  it("stops a ten-million-step loop quickly", () => {
    const start = performance.now();
    const out = render("{% for i in (1..10000000) %}{{ i }}{% endfor %}");
    const ms = performance.now() - start;
    expect(out.html).toBe("");
    expect(out.error?.kind).toBe("limit");
    expect(ms).toBeLessThan(500);
  });

  it("stops a slow nested loop at the time limit", () => {
    const list = Array.from({ length: 3000 }, (_, i) => i);
    const start = performance.now();
    const out = render("{% for i in list %}{% for j in list %}{{ j }}{% endfor %}{% endfor %}", { list });
    const ms = performance.now() - start;
    expect(out.error?.kind).toBe("limit");
    expect(out.error?.message).toMatch(/50 ms/);
    expect(ms).toBeLessThan(500);
  });

  it("stops a huge string build at the memory limit", () => {
    const out = render('{% assign s = "xxxxxxxxxx" %}{% for i in (1..40) %}{% assign s = s | append: s %}{% endfor %}{{ s.size }}');
    expect(out.html).toBe("");
    expect(out.error?.kind).toBe("limit");
    expect(out.error?.message).toMatch(/memory/);
  });

  it("gives each render its own budget", () => {
    for (let i = 0; i < 3; i++) expect(html("{% for i in (1..1000) %}{{ i }}{% endfor %}").length).toBeGreaterThan(1000);
  });
});

describe("parse cache", () => {
  it("parses a source once and keeps at most 500", () => {
    clearLiquidCache();
    html("{{ 1 }}");
    html("{{ 1 }}");
    expect(liquidCacheSize()).toBe(1);
    for (let i = 0; i < 520; i++) html(`{{ ${i} }}`);
    expect(liquidCacheSize()).toBe(500);
  });

  it("keeps the scope of one render out of the next", () => {
    expect(html("{% assign a = 'x' %}{{ a }}")).toBe("x");
    expect(html("{{ a }}")).toBe("");
  });
});
