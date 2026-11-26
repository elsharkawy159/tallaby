/**
 * One turn of the website editor's AI agent (ROADMAP F-83c, F-101g/j), without
 * the host's auth, billing and data loading: one model call, the ops applied to
 * a copy of the sent content with the full server checks after each op, and
 * one retry with the problems when a code op failed its checks. Server only.
 *
 * The host (the dashboard action) checks the store, the switch, the caps and
 * the credits, validates the sent section, and renders the code previews.
 */
import type { SectionInstance } from "../config/schema";
import { validatePageContent } from "../config/validate";
import { CODE_SERVER_CHECKS } from "../code/code-node.server";
import { prepareCodePreview } from "../code/preview-code.server";
import { joinSectionFile } from "../code/section-file";
import type { CodeNodeProps } from "../code/code-node";
import { cleanAgentReply, toSectionOpCandidate, type EditorAgentModelOutput } from "./model-output";
import { buildEditorAgentSystemPrompt, buildEditorAgentTurnText, type EditorAgentTurnText } from "./prompt.lib";
import {
  applySectionOps,
  describeAppliedOp,
  findCodeNode,
  type AgentIssue,
  type AppliedOp,
  type ApplySectionOpsOptions,
  type CodePropsBuilder,
  type RejectedOp,
  type SectionOp,
  type SectionOpRejectCode,
} from "./section-ops";

export type EditorAgentModelCall = (args: { system: string; text: string; attempt: 1 | 2 }) => Promise<EditorAgentModelOutput>;

export type EditorAgentTurnRequest = Omit<EditorAgentTurnText, "previousIssues"> & {
  allowCode: boolean;
  /** What the ops apply to: the page outline with the targeted section in place, or the header or footer alone. Already validated. */
  content: { sections: SectionInstance[] };
  /** Model calls the daily cap still allows (the retry needs 2). */
  maxModelCalls: number;
  makeId?: ApplySectionOpsOptions["makeId"];
  /** set_image: the host's check of a photo not already in the section (default: refuse every such photo). */
  allowImage?: ApplySectionOpsOptions["allowImage"];
};

export type EditorAgentCodeNode = { nodeId: string; opIndex: number; file: string; props: CodeNodeProps };

export type EditorAgentTurnResult = {
  reply: string;
  /** The applied ops, normalised (the editor applies exactly these). */
  ops: SectionOp[];
  applied: AppliedOp[];
  /** One line per applied op, in the UI language. */
  summary: string[];
  /** Index into the model's ops of the answer that was kept. */
  rejected: { index: number; code: SectionOpRejectCode; issues?: AgentIssue[] }[];
  content: { sections: SectionInstance[] };
  /** The code elements the applied ops wrote, for the canvas previews. */
  codeNodes: EditorAgentCodeNode[];
  modelCalls: number;
  retried: boolean;
};

const MAX_RETRY_ISSUES_BYTES = 3 * 1024;

export { buildEditorAgentSystemPrompt, buildEditorAgentTurnText, EDITOR_AGENT_FEATURE, MAX_AGENT_IMAGES, type EditorAgentImage } from "./prompt.lib";
export { editorAgentModelOutputSchema, type EditorAgentModelOutput } from "./model-output";
export { MAX_SITE_OUTLINE_SECTIONS, sectionDisplayName, serializeSiteOutline, siteOutline, siteOutlineEntry, type SiteOutlineEntry } from "./site-outline";

/**
 * What a page turn's ops apply to on the server: the page outline as empty
 * stand-ins, with the targeted (validated) section in its place. Section-level
 * ops (move, remove, add after) then see the real order; element ops can only
 * reach the one real section. A header or footer turn applies to that section
 * alone. Returns null when the sent section isn't the target or isn't in the
 * outline.
 */
export function buildAgentContent(input: {
  target: { kind: "page" | "header" | "footer"; sectionId?: string };
  section: SectionInstance | null;
  outlineIds: readonly string[];
}): { sections: SectionInstance[] } | null {
  const { target, section } = input;
  if (target.kind !== "page") return section && (!target.sectionId || target.sectionId === section.id) ? { sections: [section] } : null;
  if (section && section.id !== target.sectionId) return null;
  if (target.sectionId && !input.outlineIds.includes(target.sectionId)) return null;
  if (target.sectionId && !section) return null;
  const ids = [...new Set(input.outlineIds)];
  return {
    sections: ids.map((id) => (section && id === section.id ? section : { id, sectionId: "custom-section", version: 1, props: {}, componentTree: [] })),
  };
}

/** File to props with the full server checks; issues positioned in the file (as the Code tab shows it). */
export const serverCodeProps: CodePropsBuilder = (file, rest) => {
  const prepared = prepareCodePreview({ nodeId: "agent", file, name: rest.name, settings: rest.settings, blocks: rest.blocks });
  return { props: prepared.props, issues: prepared.issues };
};

/** `validatePageContent` with the server checks, as issues (null when valid). */
export function validateAgentContent(content: { sections: SectionInstance[] }): AgentIssue[] | null {
  const result = validatePageContent(content, { serverChecks: CODE_SERVER_CHECKS });
  if (result.success) return null;
  return result.issues.map((issue) => ({
    code: issue.code,
    message: issue.detail ? `${issue.detail}: ${issue.message}` : issue.message,
    ...(issue.line !== undefined && { line: issue.line }),
    ...(issue.column !== undefined && { column: issue.column }),
  }));
}

function retryText(rejected: readonly RejectedOp[]): string {
  const lines: string[] = [];
  let bytes = 0;
  for (const item of rejected) {
    const op = (item.op as { op?: string; sectionId?: string }) ?? {};
    const head = `- op ${item.index + 1} (${op.op ?? "?"}${op.sectionId ? ` on ${op.sectionId}` : ""}): ${item.code}`;
    const details = (item.issues ?? []).slice(0, 8).map((i) => `  * ${i.message}${i.line ? ` (line ${i.line}${i.column ? `, column ${i.column}` : ""})` : ""}`);
    for (const line of [head, ...details]) {
      bytes += line.length + 1;
      if (bytes > MAX_RETRY_ISSUES_BYTES) return lines.join("\n");
      lines.push(line);
    }
  }
  return lines.join("\n");
}

type Attempt = {
  output: EditorAgentModelOutput;
  result: ReturnType<typeof applySectionOps<{ sections: SectionInstance[] }>>;
};

/** Runs one turn. Throws only when the first model call fails (the host reports it); a failed retry keeps the first answer. */
export async function runEditorAgentTurn(req: EditorAgentTurnRequest, deps: { callModel: EditorAgentModelCall }): Promise<EditorAgentTurnResult> {
  const system = buildEditorAgentSystemPrompt({ allowCode: req.allowCode });
  const options: ApplySectionOpsOptions = {
    target: req.target,
    defaultLocale: req.store.defaultLocale,
    allowCode: req.allowCode,
    codeProps: serverCodeProps,
    validate: validateAgentContent,
    ...(req.makeId && { makeId: req.makeId }),
    // The server never takes a photo it can't vouch for: without the host's check only the section's own photos.
    allowImage: req.allowImage ?? (() => null),
  };
  const attempt = (output: EditorAgentModelOutput): Attempt => ({
    output,
    result: applySectionOps(req.content, (output.ops ?? []).map(toSectionOpCandidate), options),
  });

  const text = buildEditorAgentTurnText(req);
  let kept = attempt(await deps.callModel({ system, text, attempt: 1 }));
  let modelCalls = 1;
  let retried = false;

  const codeProblems = kept.result.rejected.filter((r) => r.code === "invalid_code");
  if (codeProblems.length && req.maxModelCalls >= 2) {
    retried = true;
    modelCalls = 2;
    try {
      const second = attempt(await deps.callModel({ system, text: buildEditorAgentTurnText({ ...req, previousIssues: retryText(codeProblems) }), attempt: 2 }));
      if (second.result.applied.length >= kept.result.applied.length) kept = second;
    } catch {
      // The first answer stands; the usage row of the failed call is already written.
    }
  }

  const { result } = kept;
  // One preview per code element: the last op that wrote it (its props are the final ones).
  const codeNodes = new Map<string, EditorAgentCodeNode>();
  for (const item of result.applied) {
    if (!item.codeNodeId) continue;
    const section = result.content.sections.find((s) => s.id === item.sectionId);
    const node = findCodeNode(section?.componentTree);
    if (!node || node.id !== item.codeNodeId) continue;
    const props = node.props as unknown as CodeNodeProps;
    codeNodes.set(node.id, { nodeId: node.id, opIndex: item.index, props, file: joinSectionFile({ source: props.source, css: props.css ?? "", schema: props.schema }) });
  }

  return {
    reply: cleanAgentReply(kept.output.reply),
    ops: result.applied.map((a) => a.op),
    applied: result.applied,
    summary: result.applied.map((a) => describeAppliedOp(a, req.uiLocale)),
    rejected: result.rejected.map(({ index, code, issues }) => ({ index, code, ...(issues && { issues }) })),
    content: result.content,
    codeNodes: [...codeNodes.values()],
    modelCalls,
    retried,
  };
}
