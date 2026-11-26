import { renderToString } from "react-dom/server";
import { NextIntlClientProvider } from "next-intl";
import type { ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";
import { SECTION_OP_REJECT_CODES } from "@workspace/store-sections/agent";
import { EditorAdapterProvider } from "../adapter.client";
import type { EditorAdapter } from "../adapter.types";
import type { AgentChatMessage } from "../lib/editor-agent-chat.lib";
import { agentChatOf } from "../lib/editor-agent-chat.lib";
import ar from "../messages/ar.json";
import en from "../messages/en.json";
import { createEditorStore } from "../state/editor.store";
import { AgentDock, AgentMessages, AgentSuggestions, agentErrorKey, agentRejectKey } from "./agent-dock.client";

const CAPABILITIES = {
  pages: true,
  templates: true,
  forms: true,
  explore: true,
  mediaLibrary: true,
  revisions: true,
  unpublish: true,
  preview: true,
  industrySwitcher: false,
  designSystem: true,
  publishLabel: "site",
} as const;

const withAgent = { capabilities: CAPABILITIES, agent: { turn: vi.fn() } } as unknown as EditorAdapter;
const withoutAgent = { capabilities: CAPABILITIES } as unknown as EditorAdapter;

function render(node: ReactNode, adapter: EditorAdapter = withAgent, locale: "en" | "ar" = "en"): string {
  return renderToString(
    <NextIntlClientProvider locale={locale} messages={locale === "en" ? en : ar} timeZone="Africa/Cairo">
      <EditorAdapterProvider adapter={adapter}>{node}</EditorAdapterProvider>
    </NextIntlClientProvider>,
  );
}

const editor = () =>
  createEditorStore({
    pages: [{ id: "p1", slug: "", isHome: true, name: { en: "Home" }, seo: {}, showInNav: true, content: { sections: [] }, version: 1 }],
    header: null,
    footer: null,
    designSystem: { colors: {}, typography: {}, spacing: {} },
    designVersion: 1,
    chromeVersion: 1,
    defaultLocale: "ar",
  });

const noUndo = { canUndo: () => false, undo: () => {} };
const text = (html: string) => html.replace(/<!-- -->/g, "");

describe("agent dock", () => {
  it("is hidden without the host's agent, and for a read-only editor", () => {
    expect(render(<AgentDock store={editor()} uiLocale="en" storeId="s1" />, withoutAgent)).toBe("");
    expect(render(<AgentDock store={editor()} uiLocale="en" storeId="s1" readOnly />)).toBe("");
    expect(render(<AgentDock store={editor()} uiLocale="en" storeId="s1" />)).toContain(en.storeEditor.agent.title);
  });

  it("has no 'soon' badge any more, and one chat per editor", () => {
    const store = editor();
    const html = text(render(<AgentDock store={store} uiLocale="en" storeId="s1" />));
    expect(html).not.toMatch(/>Soon</);
    expect(html).toContain('aria-expanded="false"');
    expect(agentChatOf(store)).toBe(agentChatOf(store));
    expect(agentChatOf(store)).not.toBe(agentChatOf(editor()));
  });

  it("suggests by context: the selected section, or new sections for the page", () => {
    const mention = { key: "page:s1", ref: { target: "page" as const, sectionId: "s1" }, label: "Hero", context: "Home", kind: "tree" as const };
    const section = text(render(<AgentSuggestions mention={mention} contentLocale="ar" onPick={() => {}} />));
    expect(section).toContain("Make the title bigger");
    expect(section).toContain("Turn this into a code section");
    expect(section).toContain("Translate this section to English");
    const page = text(render(<AgentSuggestions mention={null} contentLocale="ar" onPick={() => {}} />));
    expect(page).toContain("Add an FAQ section");
    expect(page).toContain("Add a size guide");
    expect(page).toContain("Add a comparison table");
  });

  it.each(["aiNoCredits", "aiDailyLimit", "rateLimited", "aiUnavailable", "aiFailed", "readOnly", "invalidInput", "invalidContent", "notFound", "generic", "stopped"] as const)(
    "shows the %s message",
    (error) => {
      const messages: AgentChatMessage[] = [{ id: "e", role: "error", error }];
      for (const locale of ["en", "ar"] as const) {
        const html = text(render(<AgentMessages chat={noUndo} messages={messages} pending={false} creditsHref="/settings/plan" />, withAgent, locale));
        const strings = (locale === "en" ? en : ar).storeEditor.agent.errors as Record<string, string>;
        expect(html).toContain(strings[error]!.replace(/'/g, "&#x27;"));
      }
    },
  );

  it("links to credits when they ran out, and shows other host errors as the generic message", () => {
    expect(render(<AgentMessages chat={noUndo} messages={[{ id: "e", role: "error", error: "aiNoCredits" }]} pending={false} creditsHref="/settings/plan" />)).toContain('href="/settings/plan"');
    expect(agentErrorKey("versionConflict")).toBe("generic");
  });

  it("has a friendly text for every reject code", () => {
    for (const code of SECTION_OP_REJECT_CODES) {
      expect(agentRejectKey(code)).toBe(code);
      expect((en.storeEditor.agent.rejects as Record<string, string>)[code]).toBeTruthy();
      expect((ar.storeEditor.agent.rejects as Record<string, string>)[code]).toBeTruthy();
    }
    expect(agentRejectKey("something_new")).toBe("other");
  });

  it("shows a reply's checklist, skipped items, credits and Undo while it is the latest step", () => {
    const reply: AgentChatMessage = { id: "a", role: "assistant", text: "Done", applied: ["Changed a text"], rejected: ["bound_node"], creditsUsed: 1, undoMarker: {} };
    const html = text(render(<AgentMessages chat={{ canUndo: () => true, undo: () => {} }} messages={[reply]} pending={false} creditsHref={null} />));
    expect(html).toContain('role="log"');
    expect(html).toContain('aria-live="polite"');
    expect(html).toContain("Changed a text");
    expect(html).toContain("Skipped: this text comes from your products, so change it there");
    expect(html).toContain("1 AI credit used");
    expect(html).toContain(">Undo<");
    const later = text(render(<AgentMessages chat={noUndo} messages={[reply]} pending={false} creditsHref={null} />));
    expect(later).not.toContain(">Undo<");
  });

  it("says so politely when nothing was applied, and shows the typing indicator while waiting", () => {
    const reply: AgentChatMessage = { id: "a", role: "assistant", text: "", applied: [], rejected: ["node_not_found"], creditsUsed: 0, undoMarker: null };
    const html = text(render(<AgentMessages chat={noUndo} messages={[reply]} pending creditsHref={null} />));
    expect(html).toContain("couldn&#x27;t make that change");
    expect(html).toContain(en.storeEditor.agent.thinking);
  });
});
