import { renderToString } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { EditorAdapterProvider, useEditorAdapter } from "./adapter.client";
import type { EditorAdapter } from "./adapter.types";

function Probe({ onAdapter }: { onAdapter: (a: EditorAdapter) => void }) {
  onAdapter(useEditorAdapter());
  return null;
}

describe("useEditorAdapter", () => {
  it("throws outside a provider", () => {
    expect(() => renderToString(<Probe onAdapter={() => {}} />)).toThrow("EditorAdapterProvider missing");
  });

  it("returns the adapter inside a provider", () => {
    const fake = { capabilities: { publishLabel: "site" } } as unknown as EditorAdapter;
    let seen: EditorAdapter | null = null;
    renderToString(
      <EditorAdapterProvider adapter={fake}>
        <Probe onAdapter={(a) => (seen = a)} />
      </EditorAdapterProvider>,
    );
    expect(seen).toBe(fake);
  });
});
