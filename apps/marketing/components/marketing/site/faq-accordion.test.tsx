import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { FaqAccordion } from "./faq-accordion";

const items = [
  { q: "First question?", a: "First answer text." },
  { q: "Second question?", a: "Second answer text." },
];

describe("FaqAccordion", () => {
  it("puts every closed answer's text in the server HTML", () => {
    const html = renderToStaticMarkup(<FaqAccordion items={items} />);
    expect(html).toContain("First answer text.");
    expect(html).toContain("Second answer text.");
    // Closed: collapsed, out of the tab order and the accessibility tree.
    expect(html.match(/aria-expanded="false"/g)).toHaveLength(2);
    expect(html.match(/role="region"[^>]*inert=""/g)).toHaveLength(2);
  });

  it("links each question to its answer and opens every row while searching", () => {
    const html = renderToStaticMarkup(<FaqAccordion items={items} defaultOpen />);
    expect(html.match(/aria-expanded="true"/g)).toHaveLength(2);
    expect(html).not.toContain("inert");
    const controls = [...html.matchAll(/aria-controls="([^"]+)"/g)].map((m) => m[1]);
    for (const id of controls) expect(html).toContain(`id="${id}" role="region"`);
  });
});
