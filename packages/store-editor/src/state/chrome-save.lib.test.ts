import { describe, expect, it, vi } from "vitest";
import type { EditorAdapter } from "../adapter.types";
import type { SectionInstance } from "@workspace/store-sections";
import { saveDirtyChrome } from "./chrome-save.lib";
import { createEditorStore } from "./editor.store";

const node = (id: string) => ({ id, sectionId: "store-header", version: 1, props: {} }) as unknown as SectionInstance;

function makeStore(chromeVersion = 5) {
  return createEditorStore({
    pages: [{ id: "home", slug: "", isHome: true, name: { en: "Home" }, seo: {}, showInNav: true, content: { sections: [] }, version: 1 }],
    header: node("h0"),
    footer: node("f0"),
    designSystem: { colors: {}, typography: {}, spacing: {} },
    designVersion: 1,
    chromeVersion,
    defaultLocale: "en",
    industry: undefined,
  });
}

const adapterWith = (saveChrome: EditorAdapter["saveChrome"]) => ({ saveChrome }) as unknown as EditorAdapter;

describe("saveDirtyChrome", () => {
  it("sends the stored chromeVersion and chains the returned version to the next part", async () => {
    const store = makeStore(5);
    store.getState().editChrome("header", node("h1"));
    store.getState().editChrome("footer", node("f1"));
    const saveChrome = vi.fn(async (_part: string, _value: unknown, v: number) => ({ success: true as const, data: { version: v + 1 } }));
    expect(await saveDirtyChrome(store, adapterWith(saveChrome))).toBe("ok");
    expect(saveChrome.mock.calls.map((c) => [c[0], c[2]])).toEqual([["header", 5], ["footer", 6]]);
    expect(store.getState().chromeVersion).toBe(7);
    expect(store.getState().dirtyChrome).toEqual({});
  });

  it("reports a conflict on versionConflict and keeps the chrome dirty", async () => {
    const store = makeStore(5);
    store.getState().editChrome("header", node("h1"));
    const saveChrome = vi.fn(async () => ({ success: false as const, error: "versionConflict" as const }));
    expect(await saveDirtyChrome(store, adapterWith(saveChrome))).toBe("conflict");
    expect(store.getState().chromeVersion).toBe(5);
    expect(store.getState().dirtyChrome.header).toBe(true);
  });

  it("reports an error for any other failure", async () => {
    const store = makeStore();
    store.getState().editChrome("footer", node("f1"));
    const saveChrome = vi.fn(async () => ({ success: false as const, error: "generic" as const }));
    expect(await saveDirtyChrome(store, adapterWith(saveChrome))).toBe("error");
  });

  it("does nothing when neither part is dirty", async () => {
    const saveChrome = vi.fn();
    expect(await saveDirtyChrome(makeStore(), adapterWith(saveChrome as never))).toBe("ok");
    expect(saveChrome).not.toHaveBeenCalled();
  });

  it("still advances the version when the value changed during the save", async () => {
    const store = makeStore(5);
    store.getState().editChrome("header", node("h1"));
    const saveChrome = vi.fn(async (_p: string, _v: unknown, v: number) => {
      store.getState().editChrome("header", node("h2"));
      return { success: true as const, data: { version: v + 1 } };
    });
    await saveDirtyChrome(store, adapterWith(saveChrome));
    expect(store.getState().chromeVersion).toBe(6);
    expect(store.getState().dirtyChrome.header).toBe(true);
  });
});
