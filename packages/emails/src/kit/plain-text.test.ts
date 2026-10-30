import { describe, expect, it } from "vitest";
import { parseInline, parsePlainText } from "./plain-text.js";

describe("parsePlainText", () => {
  it("splits paragraphs on blank lines and keeps single line breaks", () => {
    expect(parsePlainText("Hi\nthere\n\nBye")).toEqual([
      { kind: "paragraph", lines: [[{ text: "Hi", bold: false }], [{ text: "there", bold: false }]] },
      { kind: "paragraph", lines: [[{ text: "Bye", bold: false }]] },
    ]);
  });

  it("reads a block whose every line starts with a bullet as a list", () => {
    expect(parsePlainText("- one\n* two\n• three")).toEqual([
      {
        kind: "list",
        items: [[{ text: "one", bold: false }], [{ text: "two", bold: false }], [{ text: "three", bold: false }]],
      },
    ]);
    expect(parsePlainText("- one\nnot a bullet")[0]?.kind).toBe("paragraph");
  });

  it("marks **bold** and leaves an unmatched marker as typed", () => {
    expect(parseInline("a **b** c")).toEqual([
      { text: "a ", bold: false },
      { text: "b", bold: true },
      { text: " c", bold: false },
    ]);
    expect(parseInline("2 ** 3")).toEqual([{ text: "2 ** 3", bold: false }]);
  });

  it("never turns markup into HTML: tags stay text", () => {
    expect(parsePlainText("<b>x</b>")).toEqual([{ kind: "paragraph", lines: [[{ text: "<b>x</b>", bold: false }]] }]);
  });

  it("handles CRLF and empty input", () => {
    expect(parsePlainText("")).toEqual([]);
    expect(parsePlainText("a\r\n\r\nb")).toHaveLength(2);
  });
});
