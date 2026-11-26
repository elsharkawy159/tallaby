/**
 * Denial-of-service limits of code sections (ROADMAP F-101): adversarial
 * templates that once blocked the event loop for seconds (the HTML cleaner
 * was quadratic in tags × depth; liquidjs checks its time limit only between
 * template steps, so one filter call over a huge range ran unchecked).
 *
 * Each template runs through the storefront's real path (`renderCodeHtml`:
 * Liquid, the output limits, then `sanitizeCodeHtml`) and must finish in
 * under BUDGET_MS, with either output or a `limit` error from `renderLiquid`.
 * The measured times are printed for the record.
 */
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import type { ComponentNode } from "../config/schema";
import type { CodeSectionsContext, RenderContext } from "../core/types";
import { checkLiquidSource, LIQUID_MAX_LIST_ITEMS, renderLiquid, REMOVED_FILTER_NAMES } from "./liquid.server";
import { clearCodeRenderCache, renderCodeHtml } from "./render-code.server";
import { checkCodeOutput, CODE_OUTPUT_MAX_CHARS, CODE_OUTPUT_MAX_DEPTH, CODE_OUTPUT_MAX_TAGS, sanitizeCodeHtml } from "./sanitize-code";
import { scopeCss } from "./scope-css";

const BUDGET_MS = 150;

const CODE_ON: CodeSectionsContext = { enabled: true, storeId: "store-a", pageType: "page", passThrough: false, currency: "EGP", preview: true };

const ctx: RenderContext = {
  mode: "public",
  locale: "en",
  dir: "ltr",
  store: { name: "Store", url: "https://x.tallaby.com" },
  pages: [],
  catalog: { products: {}, categories: [] },
  Link: () => null,
  imageUrl: (src) => src || null,
  formatPrice: (n) => `EGP ${n}`,
  codeSections: CODE_ON,
};

const node = (source: string): ComponentNode =>
  ({ id: "dos1", type: "code", props: { apiVersion: 1, source, schema: { name: "Dos", settings: [] }, settings: {}, blocks: [] }, children: [] }) as ComponentNode;

const timings: string[] = [];

/**
 * Runs `source` through the real storefront path three times and keeps the
 * fastest run (other test files run in parallel, so noise only adds): its
 * time, its cleaned HTML and the error kind it logged ("" when it drew).
 * `liquid` is a separate `renderLiquid` run, for the error code.
 */
function run(label: string, source: string) {
  let ms = Infinity;
  let html = "";
  let kind = "";
  for (let i = 0; i < 3; i++) {
    clearCodeRenderCache();
    warn.mockClear();
    const start = performance.now();
    const out = renderCodeHtml(node(source), ctx);
    const took = performance.now() - start;
    if (took < ms) {
      ms = took;
      html = out;
      // renderCodeHtml logs one line per failed render: "... kind=<kind>".
      kind = warn.mock.calls.map((c) => /kind=(\w+)/.exec(String(c[0]))?.[1] ?? "").join("");
    }
  }
  const liquid = renderLiquid(source, {} as never, { locale: "en", currency: "EGP" });
  timings.push(`${label.padEnd(58)} ${ms.toFixed(1).padStart(7)} ms  ${liquid.error ? `${liquid.error.kind}:${liquid.error.code}` : `ok ${html.length} chars`}`);
  return { ms, html, kind, liquid };
}

/** Within budget, and either drawn or refused with a limit (or, for a removed filter, a parse error). */
function expectBounded(label: string, source: string, refusal: "limit" | "parse" = "limit") {
  const { ms, html, kind, liquid } = run(label, source);
  expect(ms, label).toBeLessThan(BUDGET_MS);
  if (liquid.error) expect(liquid.error.kind, `${label}: ${liquid.error.message}`).toBe(refusal);
  // The measured run itself drew, or was refused the same way (a time limit only under load).
  if (html) expect(kind, label).toBe("");
  else expect(kind, label).toBe(refusal);
  return { html, liquid };
}

/** `piece` doubled `times` times with `append` (2^times copies), printed raw. */
const doubling = (piece: string, times: number) =>
  `{% assign s = "${piece}" %}{% for i in (1..${times}) %}{% assign s = s | append: s %}{% endfor %}{{ s | raw }}`;

let warn: ReturnType<typeof vi.spyOn>;
beforeAll(() => {
  warn = vi.spyOn(console, "warn").mockImplementation(() => {});
  // Warm the engine and the cleaner so the first measured case isn't charged for JIT.
  renderCodeHtml(node(doubling("<p>a</p>", 8)), ctx);
});
afterAll(() => {
  warn.mockRestore();
  console.log(`code-section DoS timings (fastest of 3 runs, budget ${BUDGET_MS} ms):\n${timings.join("\n")}`);
});

describe("the HTML cleaner's input is bounded", () => {
  it("the reported template (10 unclosed tags doubled 13 times) is refused at once", () => {
    const { liquid } = expectBounded("<b>x10 doubled 13 times (the report)", doubling("<b><b><b><b><b><b><b><b><b><b>", 13));
    expect(liquid.error?.code).toBe("output_too_large");
  });

  for (let times = 1; times <= 13; times++) {
    it(`unclosed <b>x10 doubled ${times} times`, () => {
      expectBounded(`<b>x10 doubled ${times} times`, doubling("<b><b><b><b><b><b><b><b><b><b>", times));
    });
  }

  it("closed tags doubled up to the output size cap", () => {
    for (let times = 10; times <= 16; times++) expectBounded(`<i>x</i> doubled ${times} times`, doubling("<i>x</i>", times));
  });

  it("just under the tag cap is drawn", () => {
    // 2048 × 2 tags = 4096 > cap; 1950 × 2 = 3900 is under it.
    const { html } = expectBounded("3900 sibling tags", `{% for i in (1..975) %}<p><b>a</b></p><p><b>b</b></p>{% endfor %}`);
    expect(html).toContain("<p><b>a</b></p>");
  });

  it("deep nesting at the depth cap is drawn, one level more is refused", () => {
    const depth = CODE_OUTPUT_MAX_DEPTH;
    const nest = (n: number) => `{% for i in (1..${n}) %}<div>{% endfor %}x{% for i in (1..${n}) %}</div>{% endfor %}`;
    expectBounded(`nesting ${depth} levels, 15 times`, `{% for k in (1..15) %}${nest(depth)}{% endfor %}`);
    const { liquid } = expectBounded(`nesting ${depth + 1} levels`, nest(depth + 1));
    expect(liquid.error?.code).toBe("output_too_deep");
    // Unclosed <p> and <li> close each other, as the parser does; they don't nest.
    expectBounded("3000 unclosed <li> and <p>", `<ul>{% for i in (1..1000) %}<li><p>a<p>b{% endfor %}</ul>`);
    // `/>` closes inside SVG only.
    expectBounded("SVG with 1000 self-closed paths", `<svg viewBox="0 0 10 10">{% for i in (1..1000) %}<path d="M0 0L1 1"/>{% endfor %}</svg>`);
    expect(run("1000 self-closed <div/> outside SVG", `{% for i in (1..1000) %}<div/>{% endfor %}`).liquid.error?.code).toBe("output_too_deep");
  });

  it("long attribute lists", () => {
    const attrs = Array.from({ length: 30 }, (_, i) => `data-a${i}="v{{ i }}" aria-x${i}="w"`).join(" ");
    expectBounded("90 tags × 60 attributes", `{% for i in (1..90) %}<div class="c" ${attrs}>x</div>{% endfor %}`);
    expectBounded("one tag, 6000 attributes", `<div {% for i in (1..600) %}data-a{{ i }}="1" data-b{{ i }}="2" data-c{{ i }}="3" data-d{{ i }}="4" data-e{{ i }}="5" data-f{{ i }}="6" data-g{{ i }}="7" data-h{{ i }}="8" data-k{{ i }}="9" data-m{{ i }}="0" {% endfor %}>x</div>`);
    expectBounded("attributes with unclosed quotes", `{% for i in (1..1000) %}<div title="a{{ i }}>{% endfor %}`);
  });

  it("big srcset", () => {
    const set = Array.from({ length: 20 }, (_, i) => `https://cdn.test/${i}.jpg ${i + 1}x`).join(", ");
    expectBounded("200 images × 20-candidate srcset", `{% for i in (1..200) %}<img src="https://cdn.test/a.jpg" srcset="${set}" alt="a">{% endfor %}`);
    expectBounded("one srcset with 4000 candidates", `<img src="https://cdn.test/a.jpg" srcset="{% for i in (1..1000) %}https://cdn.test/{{ i }}.jpg 1x, /a.jpg 2x, /b.jpg 3x, /c.jpg 4x, {% endfor %}/d.jpg" alt="a">`);
  });

  it("huge inline styles", () => {
    // Each style is built once, so the time is the cleaner's, not Liquid's.
    const styles = (label: string, loop: string) =>
      expectBounded(label, `{% capture st %}${loop}{% endcapture %}{% for i in (1..30) %}<div style="{{ st }}">x</div>{% endfor %}`);
    styles("30 styles × 4000 chars of unclosed url(", "{% for j in (1..800) %}url( {% endfor %}");
    styles("30 styles × 900 declarations", "{% for j in (1..900) %}a:b;{% endfor %}");
    styles("30 styles of nested parentheses", "color: {% for j in (1..1000) %}({% endfor %}");
  });

  it("huge stylesheet CSS is scoped within the budget", () => {
    const cases: Array<[string, string]> = [
      ["32 KB of selectors", Array.from({ length: 1500 }, (_, i) => `.a${i} .b > .c{color:red}`).join("").slice(0, 32 * 1024)],
      ["32 KB of nested parentheses", `.a{width:${"calc(".repeat(5000)}1px${")".repeat(5000)}}`.slice(0, 32 * 1024)],
      ["32 KB of unclosed url(", `.a{background:${"url(".repeat(8000)}}`.slice(0, 32 * 1024)],
    ];
    for (const [label, css] of cases) {
      const start = performance.now();
      scopeCss(css, { scope: '.sf-site [data-node-id="dos1"]', keyframePrefix: "k" });
      const ms = performance.now() - start;
      timings.push(`${`stylesheet: ${label}`.padEnd(58)} ${ms.toFixed(1).padStart(7)} ms`);
      expect(ms, label).toBeLessThan(BUDGET_MS);
    }
  });

  it("the cleaner refuses over-limit input itself, for any caller", () => {
    expect(sanitizeCodeHtml("<b>".repeat(CODE_OUTPUT_MAX_TAGS + 1), { nodeId: "n1" })).toBe("");
    expect(sanitizeCodeHtml(`<p>${"a".repeat(CODE_OUTPUT_MAX_CHARS)}</p>`, { nodeId: "n1" })).toBe("");
    expect(sanitizeCodeHtml("<div>".repeat(CODE_OUTPUT_MAX_DEPTH + 1), { nodeId: "n1" })).toBe("");
    const start = performance.now();
    sanitizeCodeHtml("<b>".repeat(41_000), { nodeId: "n1" });
    expect(performance.now() - start).toBeLessThan(BUDGET_MS);
  });

  it("counts tags the parser can't skip, and tags inside attribute values", () => {
    expect(checkCodeOutput(`<p title="${"<b>".repeat(CODE_OUTPUT_MAX_TAGS + 1)}">x</p>`)?.code).toBe("output_too_many_tags");
    expect(checkCodeOutput(`<!-- ${"<b>".repeat(CODE_OUTPUT_MAX_TAGS + 1)} -->`)?.code).toBe("output_too_many_tags");
    // A quoted value holding `>` doesn't end the tag early; `<div/>` doesn't close outside SVG.
    expect(checkCodeOutput(`${'<div title="a>b"/>'.repeat(CODE_OUTPUT_MAX_DEPTH + 1)}`)?.code).toBe("output_too_deep");
    expect(checkCodeOutput(`<svg>${'<g fill="a"/>'.repeat(CODE_OUTPUT_MAX_DEPTH + 1)}</svg>`)).toBeNull();
    // An unquoted value ending in `/` doesn't self-close.
    expect(checkCodeOutput(`<svg>${"<g fill=a/>".repeat(CODE_OUTPUT_MAX_DEPTH + 1)}</svg>`)?.code).toBe("output_too_deep");
    // <foreignObject> is HTML again: `/>` doesn't close there.
    expect(checkCodeOutput(`<svg><foreignObject>${"<g/>".repeat(CODE_OUTPUT_MAX_DEPTH + 1)}</foreignObject></svg>`)?.code).toBe("output_too_deep");
  });
});

describe("Liquid's work inside one step is bounded", () => {
  it("the reported find_exp templates are a parse error now", () => {
    const report = `{% assign a = (1..10000) %}{% assign b = a | find_exp: "i", "a contains 0" %}x`;
    expect(expectBounded("find_exp over (1..10000) (the report)", report, "parse").liquid.error?.code).toBe("filter_not_allowed");
    expect(checkLiquidSource(report).map((i) => i.code)).toEqual(["filter_not_allowed"]);
    for (const filter of REMOVED_FILTER_NAMES) {
      const source = `{% assign a = (1..10) %}{% assign b = a | ${filter}: "i", "i == 1" %}x`;
      expect(checkLiquidSource(source).map((i) => i.code), filter).toEqual(["filter_not_allowed"]);
      const { liquid } = run(`${filter} over (1..10)`, source);
      expect(liquid.error, filter).toMatchObject({ kind: "parse", code: "filter_not_allowed", params: { filter } });
    }
  });

  it("ranges over the cap are refused before they are built", () => {
    for (const n of [900_000, 300_000, LIQUID_MAX_LIST_ITEMS + 1]) {
      const { liquid } = expectBounded(`range (1..${n}) assigned and filtered`, `{% assign a = (1..${n}) %}{% assign b = a | where: "x", 5 %}x`);
      expect(liquid.error?.code).toBe("range_too_large");
    }
    expect(run("{{ (1..900000) }}", "{{ (1..900000) }}").liquid.error?.code).toBe("range_too_large");
    expect(run("for over (1..900000)", "{% for i in (1..900000) %}{% endfor %}x").liquid.error?.code).toBe("range_too_large");
    expect(run("range with a variable bound", "{% assign n = 5000 %}{% for i in (1..n) %}{{ i }}{% endfor %}").liquid.error?.code).toBe("range_too_large");
    expect(run("range inside {% liquid %}", "{% liquid\nassign a = (0..1000)\necho a.size\n%}").liquid.error?.code).toBe("range_too_large");
    expect(run("range as a filter argument", "{% assign a = (1..10) | concat: (1..5000) %}x").liquid.error?.code).toBe("range_too_large");
    expect(run("range at the cap", `{% assign a = (1..${LIQUID_MAX_LIST_ITEMS}) %}{{ a.size }}`).liquid.html).toBe(String(LIQUID_MAX_LIST_ITEMS));
  });

  it("the save check reports literal ranges over the cap, with their position", () => {
    expect(checkLiquidSource(`<p>\n{% for i in (1..1001) %}{% endfor %}{{ (5..2000) | size }}`)).toEqual([
      expect.objectContaining({ code: "range_too_large", params: { max: LIQUID_MAX_LIST_ITEMS }, line: 2 }),
      expect.objectContaining({ code: "range_too_large", line: 2 }),
    ]);
    expect(checkLiquidSource(`{% for i in (1..${LIQUID_MAX_LIST_ITEMS}) %}{% endfor %}{% assign n = 5 %}{{ (1..n) | size }}`)).toEqual([]);
  });

  const array = "{% assign a = (1..1000) %}";
  const ARRAY_FILTERS: Array<[string, string]> = [
    ["join", 'a | join: ","'],
    ["first", "a | first"],
    ["last", "a | last"],
    ["reverse", "a | reverse"],
    ["sort", "a | sort"],
    ["sort by property", 'a | sort: "x"'],
    ["sort_natural", "a | sort_natural"],
    ["size", "a | size"],
    ["map", 'a | map: "x"'],
    ["sum", "a | sum"],
    ["sum by property", 'a | sum: "x"'],
    ["compact", "a | compact"],
    ["concat (result over the cap)", "a | concat: a"],
    ["push (result over the cap)", "a | push: 1"],
    ["unshift (result over the cap)", "a | unshift: 1"],
    ["pop", "a | pop"],
    ["shift", "a | shift"],
    ["slice", "a | slice: 0, 500"],
    ["where", 'a | where: "x", 5'],
    ["where with a range property", 'a | where: "(1..1000)"'],
    ["reject", 'a | reject: "x", 5'],
    ["group_by", 'a | group_by: "x"'],
    ["has", 'a | has: "x", 5'],
    ["find", 'a | find: "x", 5'],
    ["find_index", 'a | find_index: "x", 5'],
    ["uniq", "a | uniq"],
    ["sample", "a | sample: 1000"],
  ];

  it.each(ARRAY_FILTERS)("a list at the cap through %s", (label, expr) => {
    expectBounded(`(1..1000) | ${label}`, `${array}{% assign b = ${expr} %}{{ b | size }}`);
  });

  it("every array filter at once, chained", () => {
    const chain = ARRAY_FILTERS.map(([, expr], i) => `{% assign b${i} = ${expr} %}`).join("");
    expectBounded("all array filters on (1..1000)", `${array}${chain}x`);
    expectBounded("map | sort | uniq | reverse | join, 20 times", `${array}{% for k in (1..20) %}{{ a | map: "x" | sort | uniq | reverse | join: "," | size }}{% endfor %}`);
  });

  it("a list over the cap from split is refused wherever it goes", () => {
    const big = '{% assign s = "a," %}{% for i in (1..12) %}{% assign s = s | append: s %}{% endfor %}';
    expect(expectBounded("split into 4096 items", `${big}{% assign l = s | split: "," %}x`).liquid.error?.code).toBe("list_too_large");
    const list = Array.from({ length: LIQUID_MAX_LIST_ITEMS + 1 }, (_, i) => i);
    expect(renderLiquid("{% for x in l %}{% endfor %}", { l: list } as never, { locale: "en", currency: "EGP" }).error?.code).toBe("list_too_large");
    expect(renderLiquid("{{ l }}", { l: list } as never, { locale: "en", currency: "EGP" }).error?.code).toBe("list_too_large");
    expect(renderLiquid("{{ l | size }}", { l: list } as never, { locale: "en", currency: "EGP" }).error?.code).toBe("list_too_large");
  });

  it("nested loops at the caps stop at the time limit", () => {
    expectBounded("for 1000 × for 1000, empty", "{% for i in (1..1000) %}{% for j in (1..1000) %}{% endfor %}{% endfor %}x");
    expectBounded("for 1000 × for 1000, printing", "{% for i in (1..1000) %}{% for j in (1..1000) %}{{ j }}{% endfor %}{% endfor %}");
    expectBounded("for 1000 × 1000 × 1000, empty", "{% for i in (1..1000) %}{% for j in (1..1000) %}{% for k in (1..1000) %}{% endfor %}{% endfor %}{% endfor %}x");
    expectBounded("for 1000 × where over 1000", `${array}{% for i in a %}{% assign b = a | where: "x", i %}{% endfor %}x`);
    expectBounded("for 1000 × sort over 1000", `${array}{% for i in a %}{% assign b = a | sort | reverse %}{% endfor %}x`);
  });

  it("string filters on the biggest string the memory limit allows", () => {
    const big = (piece: string) => `{% assign s = "${piece}" %}{% for i in (1..15) %}{% assign s = s | append: s %}{% endfor %}`;
    for (const [label, piece, expr] of [
      ["strip_html, unclosed <", "<<<<<<<<", "s | strip_html"],
      ["strip_html, unclosed <script", "<script>", "s | strip_html"],
      ["replace", "abababab", 's | replace: "ab", "ba"'],
      ["remove", "abababab", 's | remove: "a"'],
      ["truncatewords", "a a a a ", "s | truncatewords: 100000"],
      ["escape", "<&<&<&<&", "s | escape"],
      ["newline_to_br", "a\\nb\\nc\\nd\\n", "s | newline_to_br"],
      ["handleize", "a-b-c-d-", "s | handleize"],
      ["upcase", "abcdefgh", "s | upcase"],
      ["strip", "        ", "s | strip"],
      ["split (result over the cap)", "a,b,c,d,", 's | split: ","'],
    ] as const) {
      expectBounded(`256K-char string | ${label}`, `${big(piece)}{% assign b = ${expr} %}{{ b | size }}`);
    }
  });
});
