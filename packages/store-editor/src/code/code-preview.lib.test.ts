import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { ComponentNode } from "@workspace/store-sections";
import type { CodePreviewInput, CodePreviewView } from "../adapter.types";
import type { EditorResult } from "../editor.dto";
import { codeFileOf, withPreviewProps } from "./code-file.lib";
import { CODE_PREVIEW_DELAY, codePreviewInput, createCodePreviewRunner, createCodePreviewStore, previewKey } from "./code-preview.lib";

const node = (props: Record<string, unknown> = {}): ComponentNode =>
  ({ id: "n1", type: "code", props: { apiVersion: 1, source: "<p>{{ section.settings.t }}</p>", schema: { name: "A", settings: [] }, settings: {}, blocks: [], ...props }, children: [] }) as ComponentNode;

const target = { locale: "ar" as const, pageId: "p1" };

type Reply = EditorResult<CodePreviewView>;
const ok = (props: Record<string, unknown>, html = "<p>ok</p>", css = "[data-node-id=\"n1\"] p{color:red}"): Reply => ({ success: true, data: { props, issues: [], html, css } });

/** A fake host: records calls and answers when told to. */
function fakeHost() {
  const calls: { input: CodePreviewInput; resolve: (reply: Reply) => void }[] = [];
  const preview = vi.fn((input: CodePreviewInput) => new Promise<Reply>((resolve) => calls.push({ input, resolve })));
  return { preview, calls };
}

const flush = async () => {
  for (let i = 0; i < 10; i++) await Promise.resolve();
};

beforeEach(() => vi.useFakeTimers({ toFake: ["setTimeout", "clearTimeout"] }));
afterEach(() => vi.useRealTimers());

describe("canvas previews", () => {
  it("sends the first request at once, debounces later ones and drops stale answers", async () => {
    const host = fakeHost();
    const store = createCodePreviewStore();
    const runner = createCodePreviewRunner({ preview: host.preview, store });

    runner.request(codePreviewInput(node(), target));
    expect(host.preview).toHaveBeenCalledTimes(1);
    expect(host.calls[0]!.input).toMatchObject({ nodeId: "n1", locale: "ar", pageId: "p1", file: codeFileOf(node().props) });
    expect(store.getState().entries.n1?.status).toBe("loading");

    // Same input again: nothing new is sent.
    runner.request(codePreviewInput(node(), target));
    expect(host.preview).toHaveBeenCalledTimes(1);

    // Two quick edits: one request after the pause, for the last one.
    runner.request(codePreviewInput(node({ settings: { t: { ar: "أ", en: "A" } } }), target));
    runner.request(codePreviewInput(node({ settings: { t: { ar: "ب", en: "B" } } }), target));
    expect(host.preview).toHaveBeenCalledTimes(1);
    vi.advanceTimersByTime(CODE_PREVIEW_DELAY);
    expect(host.preview).toHaveBeenCalledTimes(2);

    // The first (stale) answer arrives late and is ignored.
    host.calls[0]!.resolve(ok({}, "<p>old</p>"));
    await flush();
    expect(store.getState().entries.n1?.html).toBe("");
    host.calls[1]!.resolve(ok({}, "<p>new</p>"));
    await flush();
    expect(store.getState().entries.n1).toMatchObject({ status: "ready", html: "<p>new</p>" });
  });

  it("asks again on a locale switch", () => {
    const host = fakeHost();
    const runner = createCodePreviewRunner({ preview: host.preview, store: createCodePreviewStore() });
    runner.request(codePreviewInput(node(), target));
    runner.request(codePreviewInput(node(), { ...target, locale: "en" }));
    vi.advanceTimersByTime(CODE_PREVIEW_DELAY);
    expect(host.calls.map((c) => c.input.locale)).toEqual(["ar", "en"]);
  });

  it("shows issues and host errors as an error entry", async () => {
    const host = fakeHost();
    const store = createCodePreviewStore();
    const runner = createCodePreviewRunner({ preview: host.preview, store });
    runner.request(codePreviewInput(node(), target));
    host.calls[0]!.resolve({ success: true, data: { props: {}, issues: [{ code: "liquid", message: "bad tag", line: 2 }], html: "", css: "" } });
    await flush();
    expect(store.getState().entries.n1).toMatchObject({ status: "error", issues: [{ line: 2 }] });

    const failing = createCodePreviewStore();
    createCodePreviewRunner({ preview: () => Promise.reject(new Error("network")), store: failing }).request(codePreviewInput(node(), target));
    await flush();
    expect(failing.getState().entries.n1).toMatchObject({ status: "error", error: "generic" });
  });
});

describe("Code tab file checks", () => {
  const edited = "<h2>{{ section.settings.t }}</h2>\n\n{% schema %}\n{}\n{% endschema %}\n";

  it("sends one debounced preview and applies the host's props", async () => {
    const host = fakeHost();
    const store = createCodePreviewStore();
    const runner = createCodePreviewRunner({ preview: host.preview, store });
    const apply = vi.fn();
    const current = node();
    const inputFor = (props: Record<string, unknown>) => codePreviewInput(withPreviewProps(current, props), target);

    runner.editFile({ ...codePreviewInput(current, target), file: "<h2>x" }, apply, inputFor);
    vi.advanceTimersByTime(CODE_PREVIEW_DELAY - 1);
    runner.editFile({ ...codePreviewInput(current, target), file: edited }, apply, inputFor);
    expect(store.getState().files.n1?.status).toBe("checking");
    vi.advanceTimersByTime(CODE_PREVIEW_DELAY - 1);
    expect(host.preview).not.toHaveBeenCalled();
    vi.advanceTimersByTime(1);
    expect(host.preview).toHaveBeenCalledTimes(1);
    expect(host.calls[0]!.input.file).toBe(edited);

    const returned = { apiVersion: 1, source: "<h2>{{ section.settings.t }}</h2>", schema: { name: "Custom section", settings: [], blocks: [] }, settings: {}, blocks: [] };
    host.calls[0]!.resolve(ok(returned, "<h2></h2>"));
    await flush();
    expect(apply).toHaveBeenCalledWith(returned);
    expect(store.getState().files.n1?.status).toBe("ok");
    // The canvas entry is already the answer for the applied props, so the canvas doesn't ask again.
    const entry = store.getState().entries.n1!;
    expect(entry).toMatchObject({ status: "ready", html: "<h2></h2>" });
    expect(entry.key).toBe(previewKey(inputFor(returned)));
    runner.request(inputFor(returned));
    expect(host.preview).toHaveBeenCalledTimes(1);
  });

  it("keeps the props and shows the issues when the file has problems", async () => {
    const host = fakeHost();
    const store = createCodePreviewStore();
    const runner = createCodePreviewRunner({ preview: host.preview, store });
    const apply = vi.fn();
    runner.editFile({ ...codePreviewInput(node(), target), file: "{% if %}" }, apply, (p) => codePreviewInput(withPreviewProps(node(), p), target));
    vi.advanceTimersByTime(CODE_PREVIEW_DELAY);
    host.calls[0]!.resolve({ success: true, data: { props: { source: "fallback" }, issues: [{ code: "liquid_parse", message: "if needs a condition", line: 1, column: 4 }], html: "", css: "" } });
    await flush();
    expect(store.getState().files.n1).toMatchObject({ status: "issues", issues: [{ line: 1, column: 4 }] });
    await flush();
    expect(apply).not.toHaveBeenCalled();
    expect(store.getState().entries.n1).toBeUndefined();
  });

  it("drops an answer once a newer edit or a reset happened", async () => {
    const host = fakeHost();
    const store = createCodePreviewStore();
    const runner = createCodePreviewRunner({ preview: host.preview, store });
    const apply = vi.fn();
    const inputFor = (p: Record<string, unknown>) => codePreviewInput(withPreviewProps(node(), p), target);
    runner.editFile({ ...codePreviewInput(node(), target), file: "a" }, apply, inputFor);
    vi.advanceTimersByTime(CODE_PREVIEW_DELAY);
    runner.resetFile("n1");
    host.calls[0]!.resolve(ok({ source: "a" }));
    await flush();
    expect(apply).not.toHaveBeenCalled();
    expect(store.getState().files.n1).toBeUndefined();
  });
});
