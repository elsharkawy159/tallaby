/**
 * The editor AI agent's chat helpers (ROADMAP F-83c, F-101g/j). The chat's
 * mention is always a whole section: whatever is clicked inside a section (an
 * element, a part, the overlay or a handle), the chip names that section and
 * the turn targets it. Ids only: the host re-reads and validates the section
 * before anything changes. Pure.
 */
import type { PageContent, SectionInstance } from "@workspace/store-sections";
import { findCodeNode } from "@workspace/store-sections/agent";
import { findPath, storeSectionRegistry } from "@workspace/store-sections/render";
import type { SectionRef, Selection } from "../state/editor.store";
import { nodeLabel, refOf } from "./editor-selection.lib";

export type AgentMention = {
  /** Stable per section, so a dismissed mention stays dismissed until another section is selected. */
  key: string;
  /** The section the turn targets. */
  ref: SectionRef;
  /** What the chip shows: the section's name. */
  label: string;
  /** Where it sits: the page's name, or Header / Footer. */
  context: string;
  kind: AgentSectionKind;
};

export type AgentSectionKind = "tree" | "code";

/** The chip's context names (the caller gives them in the editor's UI language). */
export type AgentMentionContexts = { page: string; header: string; footer: string };

/** Caps of the host's input (`editor-agent.dto.ts`). */
export const AGENT_MAX_MESSAGE = 1500;
export const AGENT_MAX_HISTORY = 6;
export const AGENT_MAX_HISTORY_TEXT = 2000;
const MAX_OUTLINE_NAME = 120;

const pick = (value: { ar: string; en: string }, locale: string) => (locale === "en" ? value.en : value.ar) || value.ar;

/** One key per section (`page:<id>`, `header`, `footer`). */
export function sectionKey(ref: SectionRef): string {
  return ref.target === "page" ? `page:${ref.sectionId}` : ref.target;
}

/** "tree" for an element tree, "code" for a code section (a tree holding a `code` element). */
export function sectionKindOf(instance: SectionInstance): AgentSectionKind {
  return findCodeNode(instance.componentTree) ? "code" : "tree";
}

/** The section's name: its tree root's name, else its code element's name, else the section type's name. */
export function sectionNameOf(instance: SectionInstance, uiLocale: string): string {
  const root = instance.componentTree?.[0];
  const rootName = root ? nodeLabel(root, uiLocale).trim() : "";
  if (rootName) return rootName;
  const code = findCodeNode(instance.componentTree);
  const codeName = code ? nodeLabel(code, uiLocale).trim() : "";
  if (codeName) return codeName;
  const definition = storeSectionRegistry.get(instance.sectionId);
  return definition ? pick(definition.displayName, uiLocale) : instance.sectionId;
}

/**
 * The mention for the current selection: always the section it sits in (a
 * selected element or part names its section). Null when nothing (or a
 * section that is gone) is selected; the turn then targets the page.
 */
export function mentionOf(
  selection: Selection,
  instance: SectionInstance | null,
  uiLocale: string,
  contexts: AgentMentionContexts,
): AgentMention | null {
  if (!selection || !instance) return null;
  const ref = refOf(selection);
  return {
    key: sectionKey(ref),
    ref,
    label: sectionNameOf(instance, uiLocale),
    context: ref.target === "page" ? contexts.page : contexts[ref.target],
    kind: sectionKindOf(instance),
  };
}

/** The page's sections in order, named as the chip names them. */
export function agentOutline(content: PageContent, uiLocale: string): { id: string; name: string; kind: AgentSectionKind }[] {
  return content.sections.map((s) => ({ id: s.id, name: sectionNameOf(s, uiLocale).slice(0, MAX_OUTLINE_NAME), kind: sectionKindOf(s) }));
}

/** The last turns of the chat for the host, capped as its input is. */
export function agentHistory(turns: readonly { role: "user" | "assistant"; text: string }[]): { role: "user" | "assistant"; text: string }[] {
  return turns
    .filter((turn) => turn.text.trim())
    .slice(-AGENT_MAX_HISTORY)
    .map((turn) => ({ role: turn.role, text: turn.text.slice(0, AGENT_MAX_HISTORY_TEXT) }));
}

export type ComposerKey = { key: string; shiftKey?: boolean; ctrlKey?: boolean; metaKey?: boolean; altKey?: boolean; isComposing?: boolean };

/**
 * What a key in the message box does. Ctrl/⌘+Enter always sends; Enter sends
 * on a desktop (Shift+Enter adds a line) and adds a line on a touch screen;
 * Escape stops a turn that is waiting.
 */
export function composerKeyAction(event: ComposerKey, opts: { touch: boolean; pending: boolean }): "send" | "stop" | null {
  if (event.isComposing) return null;
  if (event.key === "Escape") return opts.pending ? "stop" : null;
  if (event.key !== "Enter" || event.altKey) return null;
  if (event.ctrlKey || event.metaKey) return "send";
  if (event.shiftKey || opts.touch) return null;
  return "send";
}

/** The element's ancestors from the tree root (for breadcrumbs); empty for a section or part. */
export function ancestorsOf(instance: SectionInstance, nodeId: string | undefined): string[] {
  if (!nodeId) return [];
  return (findPath(instance.componentTree ?? [], nodeId) ?? []).slice(0, -1);
}
