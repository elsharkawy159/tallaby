import { describe, expect, it } from "vitest";
import { checkCss, scopeCss } from "./scope-css";

const SCOPE = '.site-root [data-node-id="n_abc"]';
const PREFIX = "cn_abc-";

const run = (input: string, maxBytes?: number) => scopeCss(input, { scope: SCOPE, keyframePrefix: PREFIX, maxBytes });
const css = (input: string) => run(input).css;
/** Output with whitespace collapsed, for easy comparison. */
const flat = (input: string) => css(input).replace(/\s+/g, " ");

describe("scopeCss selectors", () => {
  it("prefixes simple, compound, list and descendant selectors", () => {
    expect(flat(".a { color: red }")).toBe(`${SCOPE} .a { color: red }`);
    expect(flat("a.b:hover { color: red }")).toBe(`${SCOPE} a.b:hover { color: red }`);
    expect(flat(".a, .b > p { color: red }")).toBe(`${SCOPE} .a, ${SCOPE} .b > p { color: red }`);
    expect(flat(".a .b span { color: red }")).toBe(`${SCOPE} .a .b span { color: red }`);
  });

  it("prefixes rules inside @media and @supports", () => {
    expect(flat("@media (min-width: 600px) { .a { color: red } }")).toBe(
      `@media (min-width: 600px) { ${SCOPE} .a { color: red } }`,
    );
    expect(flat("@supports (display: grid) { .a { display: grid } }")).toBe(
      `@supports (display: grid) { ${SCOPE} .a { display: grid } }`,
    );
    expect(flat("@media (width < 600px) { .a { color: red } }")).toContain(`${SCOPE} .a`);
  });

  it("maps :root, html, body and :host to the scope", () => {
    expect(flat("html { color: red }")).toBe(`${SCOPE} { color: red }`);
    expect(flat(":root { --c: red }")).toBe(`${SCOPE} { --c: red }`);
    expect(flat("body .x { color: red }")).toBe(`${SCOPE} .x { color: red }`);
    expect(flat("BODY > .x { color: red }")).toBe(`${SCOPE} > .x { color: red }`);
    expect(flat(":host { color: red }")).toBe(`${SCOPE} { color: red }`);
    expect(flat("html.dark .x { color: red }")).toBe(`${SCOPE}.dark .x { color: red }`);
  });

  it("maps * to scope *", () => {
    expect(flat("* { box-sizing: border-box }")).toBe(`${SCOPE} * { box-sizing: border-box }`);
  });

  it("drops :has(), leading combinators and sibling reach from the scope", () => {
    const has = run(".a:has(.b) { color: red }");
    expect(has.css).toBe("");
    expect(has.issues[0]?.message).toMatch(/:has/);
    expect(css(".a:not(:has(.b)) { color: red }")).toBe("");
    expect(flat(".a:has(.b), .c { color: red }")).toBe(`${SCOPE} .c { color: red }`);
    expect(css("> .a { color: red }")).toBe("");
    expect(css("+ .a { color: red }")).toBe("");
    expect(css("body ~ div { color: red }")).toBe("");
    expect(css(":root + div { color: red }")).toBe("");
    expect(css(":host(.x) { color: red }")).toBe("");
    expect(css("& .a { color: red }")).toBe("");
  });

  it("drops nested rules inside a rule", () => {
    const out = run(".a { color: red; html & { color: blue } }");
    expect(out.css.replace(/\s+/g, " ")).toBe(`${SCOPE} .a { color: red }`);
    expect(out.issues).toHaveLength(1);
  });
});

describe("scopeCss at-rules", () => {
  it.each(["@import url(https://x.test/a.css);", "@charset \"utf-8\";", "@namespace svg url(http://www.w3.org/2000/svg);"])(
    "removes %s",
    (rule) => {
      const out = run(`${rule} .a { color: red }`);
      expect(out.css.replace(/\s+/g, " ")).toBe(`${SCOPE} .a { color: red }`);
      expect(out.issues).toHaveLength(1);
    },
  );

  it.each([
    "@font-face { font-family: x; src: url(https://x.test/f.woff2) }",
    "@document url-prefix() { .a { color: red } }",
    "@page { margin: 1cm }",
    "@layer base { .a { color: red } }",
    "@property --x { syntax: '<length>'; inherits: false; initial-value: 0px }",
    "@container (min-width: 400px) { .a { color: red } }",
    "@-webkit-keyframes spin { to { opacity: 0 } }",
    "@scope (.a) { .b { color: red } }",
  ])("removes %s", (rule) => {
    const out = run(rule);
    expect(out.css).toBe("");
    expect(out.issues).toHaveLength(1);
    expect(out.issues[0]?.message).toMatch(/not allowed/);
  });

  it("removes blocked at-rules nested in @media", () => {
    expect(css("@media print { @import url(https://x.test/a.css); }")).toBe("");
  });

  it("drops an @media whose condition hides an unsafe value", () => {
    expect(css("@supports (background: url(javascript:alert(1))) { .a { color: red } }")).toBe("");
  });
});

describe("scopeCss keyframes", () => {
  it("prefixes keyframes and rewrites animation and animation-name", () => {
    const out = flat(
      "@keyframes spin { from { transform: rotate(0) } 50% { opacity: .5 } to { transform: rotate(360deg) } }" +
        ".a { animation: spin 2s linear infinite } .b { animation-name: spin, fade } .c { animation: fade 1s }",
    );
    expect(out).toContain(`@keyframes ${PREFIX}spin { from { transform: rotate(0) } 50% { opacity: .5 } to {`);
    expect(out).toContain(`${SCOPE} .a { animation: ${PREFIX}spin 2s linear infinite }`);
    expect(out).toContain(`${SCOPE} .b { animation-name: ${PREFIX}spin, fade }`);
    expect(out).toContain(`${SCOPE} .c { animation: fade 1s }`);
  });

  it("rewrites names in a comma list and inside @media, not inside functions", () => {
    const out = flat(
      "@media (min-width: 1px) { @keyframes pop { to { opacity: 1 } } }" +
        ".a { animation: pop 1s cubic-bezier(0.1, 0.2, 0.3, 0.4), spin 2s; } .b { animation: var(--pop) }",
    );
    expect(out).toContain(`@keyframes ${PREFIX}pop`);
    expect(out).toContain(`animation: ${PREFIX}pop 1s cubic-bezier(0.1, 0.2, 0.3, 0.4), spin 2s`);
    expect(out).toContain("animation: var(--pop)");
  });

  it("leaves names that look like keywords, and never scopes keyframe selectors", () => {
    const out = flat("@keyframes slide { 0%, 100% { opacity: 0 } } .a { animation: slide 1s ease-in both }");
    expect(out).toContain("0%, 100% { opacity: 0 }");
    expect(out).not.toContain(`${SCOPE} 0%`);
    expect(out).toContain(`animation: ${PREFIX}slide 1s ease-in both`);
  });

  it("drops a keyframes block with an invalid name", () => {
    expect(css('@keyframes "x y" { to { opacity: 1 } }')).toBe("");
  });
});

describe("scopeCss declarations", () => {
  it.each([
    "background: url(javascript:alert(1))",
    "background: url('javascript:alert(1)')",
    "background: url(data:image/svg+xml;base64,AAAA)",
    "background: url(//evil.test/x.png)",
    "width: expression(alert(1))",
    "background: url(\\6a avascript:alert(1))",
    "color: r\\65 d",
    "-moz-binding: url(https://x.test/x.xml#x)",
    "behavior: url(https://x.test/x.htc)",
    "-ms-behavior: url(https://x.test/x.htc)",
  ])("drops %s", (decl) => {
    const out = run(`.a { ${decl}; color: blue }`);
    expect(out.css.replace(/\s+/g, " ")).toBe(`${SCOPE} .a { color: blue }`);
    expect(out.issues).toHaveLength(1);
  });

  it("keeps safe values, !important, relative and https urls and position: fixed", () => {
    const out = flat(
      ".a { position: fixed; color: red !important; background: url(https://cdn.test/a.png); background-image: url('/img/a.png') }",
    );
    expect(out).toBe(
      `${SCOPE} .a { position: fixed; color: red !important; background: url(https://cdn.test/a.png); background-image: url('/img/a.png') }`,
    );
  });

  it("removes comments", () => {
    const out = css("/* top */ .a { /* in */ color: red /* value */; }");
    expect(out).not.toContain("/*");
    expect(out).toContain("color: red");
  });

  it("drops declarations outside a rule", () => {
    expect(css("color: red;")).toBe("");
  });
});

describe("scopeCss markup breakout", () => {
  it("can't let </style> or <!-- survive from strings, comments, selectors or conditions", () => {
    const inputs = [
      '.a { content: "</style><script>alert(1)</script>" }',
      ".a { content: '<!--' }",
      "/* </style><script>alert(1)</script> */ .a { color: red }",
      ".a { color: red /* </style> */ }",
      '.a[title="</style>"] { color: red }',
      "@media (min-width: 1px) and (</style>) { .a { color: red } }",
      '.a { --x: "</STYLE>" }',
    ];
    for (const input of inputs) {
      const out = css(input);
      expect(out).not.toMatch(/<\/style|<!--/i);
    }
  });
});

describe("scopeCss errors and limits", () => {
  it("returns empty css and an issue with line and column on a syntax error", () => {
    const out = run(".a { color: red }\n.b { color: blue");
    expect(out.css).toBe("");
    expect(out.issues).toHaveLength(1);
    expect(out.issues[0]).toMatchObject({ line: 2, column: 1 });
    expect(out.issues[0]?.message).toMatch(/Unclosed block/);
  });

  it("caps the input size", () => {
    const big = `.a { color: red }`.repeat(2000);
    const out = run(big, 1024);
    expect(out.css).toBe("");
    expect(out.issues).toHaveLength(1);
    expect(out.issues[0]?.message).toMatch(/1024 bytes/);
    expect(run(".a { color: red }".repeat(3000)).css).toBe(""); // 51 KB > default 32 KB
  });

  it("throws on an invalid keyframePrefix", () => {
    expect(() => scopeCss(".a{}", { scope: SCOPE, keyframePrefix: "1abc" })).toThrow();
    expect(() => scopeCss(".a{}", { scope: SCOPE, keyframePrefix: "a b" })).toThrow();
    expect(() => scopeCss(".a{}", { scope: SCOPE, keyframePrefix: "" })).toThrow();
    expect(() => scopeCss(".a{}", { scope: SCOPE, keyframePrefix: `a${"b".repeat(41)}` })).toThrow();
  });

  it("returns empty css for empty input", () => {
    expect(run("")).toEqual({ css: "", issues: [] });
  });
});

describe("checkCss", () => {
  it("reports a syntax error with line and column", () => {
    const issues = checkCss(".a {\n  color: red;\n");
    expect(issues).toHaveLength(1);
    expect(issues[0]?.line).toBe(1);
    expect(issues[0]?.column).toBe(1);
  });

  it("reports blocked and unknown at-rules, nested ones too", () => {
    const issues = checkCss(
      '@import url(https://x.test/a.css);\n@media print { @font-face { font-family: x } }\n@foo bar;\n@keyframes k { to { opacity: 1 } }',
    );
    expect(issues.map((i) => i.message)).toEqual([
      "@import is not allowed",
      "@font-face is not allowed",
      "Unknown at-rule @foo is not allowed",
    ]);
    expect(issues[1]).toMatchObject({ line: 2, column: 16 });
  });

  it("returns nothing for clean CSS, and caps the size", () => {
    expect(checkCss(".a { color: red } @media (min-width: 1px) { .b { color: blue } }")).toEqual([]);
    expect(checkCss(".a{}".repeat(100), 50)).toHaveLength(1);
  });
});
