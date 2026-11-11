import type { BuilderAnswerValue, BuilderQuestion } from "@/app/(main)/ai-builder/builder.dto";

/**
 * Pure helpers of the AI Store Builder chat page (ROADMAP.md F-82i; spec
 * 2026-11-08 §10): the chat column's width, the assistant text reveal, a
 * question card's answers, the rows the browser sends for a file, the build
 * checklist and which build steps change the site. No React, so each has a test.
 */

// ── The chat column's width ─────────────────────────────────────────────────

export const CHAT_WIDTH = { min: 360, max: 640, initial: 440 } as const;
/** The preview keeps at least this much room beside the chat. */
export const PREVIEW_MIN = 420;
export const CHAT_WIDTH_STORAGE_KEY = "tallaby.aiBuilder.chatWidth";

/** The chat width inside its limits, leaving the preview its minimum on narrow screens. */
export function clampChatWidth(width: number, viewport: number): number {
  const max = Math.max(CHAT_WIDTH.min, Math.min(CHAT_WIDTH.max, viewport - PREVIEW_MIN));
  if (!Number.isFinite(width)) return Math.min(CHAT_WIDTH.initial, max);
  return Math.round(Math.min(max, Math.max(CHAT_WIDTH.min, width)));
}

/** A width saved in localStorage, or null when it isn't a number. */
export function parseStoredWidth(raw: string | null | undefined): number | null {
  if (!raw) return null;
  const value = Number(raw);
  return Number.isFinite(value) && value > 0 ? value : null;
}

/**
 * The drag handle's new width. The chat is on the LEFT in both directions (the
 * owner's layout), so dragging right widens it in Arabic too.
 */
export const dragWidth = (startWidth: number, startX: number, x: number, viewport: number) => clampChatWidth(startWidth + (x - startX), viewport);

// ── The assistant's reveal ──────────────────────────────────────────────────

/**
 * The prefixes an assistant message is revealed through, cut at word ends,
 * at most `steps` of them, the last always the whole text. One step for a
 * short or empty text.
 */
export function revealSteps(text: string, steps = 14): string[] {
  const words = text.split(/(?<=\s)/u);
  if (words.length <= 1 || steps <= 1) return [text];
  const per = Math.max(1, Math.ceil(words.length / steps));
  const out: string[] = [];
  for (let end = per; end < words.length; end += per) out.push(words.slice(0, end).join("").trimEnd());
  out.push(text);
  return out;
}

// ── Question cards ──────────────────────────────────────────────────────────

const HEX = /^#[0-9a-f]{6}$/i;

/** `#abc`, `abc` or `#aabbcc` as `#aabbcc`; null when it isn't a hex colour. */
export function normalizeHex(value: string): string | null {
  const raw = value.trim().replace(/^#/, "");
  const full = /^[0-9a-f]{3}$/i.test(raw) ? raw.replace(/./g, (c) => c + c) : raw;
  return HEX.test(`#${full}`) ? `#${full.toLowerCase()}` : null;
}

const hasText = (value: BuilderAnswerValue | undefined) => Boolean(value?.text?.trim());

/** Whether this question's draft is a complete answer (a skip counts on an optional question). */
export function isAnswered(question: BuilderQuestion, value: BuilderAnswerValue | undefined): boolean {
  if (!value) return false;
  if (value.skip) return question.optional;
  switch (question.kind) {
    case "multi":
      return Boolean(value.choices?.length);
    case "color":
      return Boolean(value.choice) || (hasText(value) && normalizeHex(value.text!) !== null);
    case "templates":
      return Boolean(value.choice);
    case "text":
      return question.id === "describe" ? (value.text?.trim().length ?? 0) >= 3 : Boolean(value.choice) || hasText(value);
    case "single": {
      const option = question.options.find((o) => o.value === value.choice);
      if (option?.needsText) return hasText(value);
      return Boolean(option) || (question.allowOther && hasText(value));
    }
  }
}

/** One question's draft as the server reads it: only the fields that answer. */
function cleanAnswer(question: BuilderQuestion, value: BuilderAnswerValue): BuilderAnswerValue {
  if (value.skip) return { skip: true };
  const text = value.text?.trim();
  if (question.kind === "multi") return { choices: (value.choices ?? []).slice(0, question.maxChoices ?? 6) };
  if (question.kind === "color") return value.choice ? { choice: value.choice } : { text: normalizeHex(text ?? "") ?? "" };
  const option = question.options.find((o) => o.value === value.choice);
  if (option) return option.needsText || (option.value === "other" && text) ? { choice: option.value, text: text ?? "" } : { choice: option.value };
  return { text: text ?? "" };
}

export type CardAnswers = { answers: Record<string, BuilderAnswerValue>; missing: string[] };

/**
 * A whole card's answers for one Send: each answered question cleaned, an
 * optional one left blank sent as a skip, and the required ones still blank
 * listed in `missing` (Send waits for them).
 */
export function buildCardAnswers(questions: readonly BuilderQuestion[], draft: Readonly<Record<string, BuilderAnswerValue>>): CardAnswers {
  const answers: Record<string, BuilderAnswerValue> = {};
  const missing: string[] = [];
  for (const question of questions) {
    const value = draft[question.id];
    if (isAnswered(question, value)) answers[question.id] = cleanAnswer(question, value!);
    else if (question.optional && !value?.choice && !value?.choices?.length && !hasText(value)) answers[question.id] = { skip: true };
    else missing.push(question.id);
  }
  return { answers, missing };
}

/** A chip picked: single replaces, multi toggles up to its max. A pick clears a skip. */
export function pickOption(question: BuilderQuestion, current: BuilderAnswerValue | undefined, value: string): BuilderAnswerValue {
  if (question.kind === "multi") {
    const choices = current?.choices ?? [];
    const next = choices.includes(value) ? choices.filter((v) => v !== value) : [...choices, value].slice(-(question.maxChoices ?? 6));
    return { ...current, choices: next, skip: undefined };
  }
  const option = question.options.find((o) => o.value === value);
  return { choice: value, text: option?.needsText ? current?.text : undefined, skip: undefined };
}

/** A seller bubble saved as `card:<id>:<value> …` (answerSummary on the server), as pairs. */
export function parseCardSummary(text: string): { id: string; value: string }[] {
  if (!text.startsWith("card:")) return [];
  return text
    .slice(5)
    .split(" ")
    .flatMap((part) => {
      const at = part.indexOf(":");
      return at > 0 ? [{ id: part.slice(0, at), value: part.slice(at + 1) }] : [];
    });
}

// ── The file the browser reads ──────────────────────────────────────────────

/** The `attachFile` body limits (builderChatBodySchema). */
export const ATTACH_LIMITS = { columns: 40, header: 80, rows: 500, cell: 2000 } as const;

/** A sheet read in the browser as the `attachFile` body: capped, empty rows dropped. The server checks it all again. */
export function attachFileBody(model: { headers: readonly string[]; rows: readonly { row: number; cells: readonly string[] }[] }) {
  return {
    action: "attachFile" as const,
    headers: model.headers.slice(0, ATTACH_LIMITS.columns).map((header) => header.slice(0, ATTACH_LIMITS.header)),
    rows: model.rows
      .filter((row) => row.cells.some((cell) => cell.trim()))
      .slice(0, ATTACH_LIMITS.rows)
      .map((row) => ({ row: row.row, cells: row.cells.slice(0, ATTACH_LIMITS.columns).map((cell) => cell.slice(0, ATTACH_LIMITS.cell)) })),
  };
}

// ── The build checklist ─────────────────────────────────────────────────────

export const BUILD_PHASES = ["store", "design", "copy", "products", "selling", "checks", "publish"] as const;
export type BuildPhase = (typeof BUILD_PHASES)[number];
export type PhaseStatus = "done" | "running" | "pending";

const phaseOf = (key: string): BuildPhase => {
  const base = key.split(":")[0]!;
  if (base === "store" || base === "settings") return "store";
  if (base === "template" || base === "brand" || base === "categories") return "design";
  if (base === "site_copy" || base === "hero_photos") return "copy";
  if (base === "products_file" || base === "product" || base === "catalog") return "products";
  if (base === "shipping" || base === "policy") return "selling";
  if (base === "checks" || base === "notes") return "checks";
  return "publish";
};

export type ChecklistRow = { phase: BuildPhase; status: PhaseStatus; done?: number; total?: number };

/**
 * The live checklist from the build's item keys (in run order) and the next
 * one to run (`progress.current`, null when all ran). Items run one after the
 * other, so every key before the current one is finished. The products row
 * counts products: a file batch is `batchSize` rows (the last one the rest).
 */
export function buildChecklist(keys: readonly string[], current: string | null, fileRows: number, batchSize = 10): ChecklistRow[] {
  const at = current === null ? keys.length : Math.max(0, keys.indexOf(current));
  const rows: ChecklistRow[] = [];
  for (const phase of BUILD_PHASES) {
    const indexes = keys.flatMap((key, index) => (phaseOf(key) === phase ? [index] : []));
    if (!indexes.length) continue;
    const finished = indexes.filter((index) => index < at).length;
    const status: PhaseStatus = finished === indexes.length ? "done" : indexes.some((index) => index <= at) ? "running" : "pending";
    const row: ChecklistRow = { phase, status };
    if (phase === "products") {
      const productKeys = indexes.filter((index) => keys[index] !== "catalog");
      const batches = productKeys.filter((index) => keys[index]!.startsWith("products_file:"));
      const single = productKeys.length - batches.length;
      row.total = fileRows + single;
      row.done = Math.min(fileRows, batches.filter((index) => index < at).length * batchSize) + productKeys.filter((index) => index < at && !keys[index]!.startsWith("products_file:")).length;
      if (!row.total) continue;
    }
    rows.push(row);
  }
  return rows;
}

/** The step just finished changed what the store shows: the preview reloads. */
export function changesSite(key: string | null): boolean {
  if (!key) return false;
  const base = key.split(":")[0];
  return base === "template" || base === "brand" || base === "categories" || base === "site_copy" || base === "hero_photos" || base === "products_file" || base === "product" || base === "checks" || base === "publish";
}

/** The steps that finished between two `progress.current` values. */
export function finishedBetween(keys: readonly string[], before: string | null, after: string | null): string[] {
  const from = before === null ? keys.length : keys.indexOf(before);
  const to = after === null ? keys.length : keys.indexOf(after);
  if (from < 0 || to <= from) return [];
  return keys.slice(from, to);
}

/** The template's draft has been written once the template step is behind the build. */
export function draftReady(keys: readonly string[], current: string | null): boolean {
  const at = keys.indexOf("template");
  if (at < 0) return false;
  return current === null || keys.indexOf(current) > at;
}

// ── The preview ─────────────────────────────────────────────────────────────

export type PreviewDevice = "phone" | "tablet" | "desktop";
/** The width each device draws the store at; desktop fills the pane. */
export const DEVICE_WIDTH: Record<PreviewDevice, number | null> = { phone: 390, tablet: 768, desktop: null };

/** The scale that fits a device width into the pane (never above 1). */
export function deviceScale(device: PreviewDevice, paneWidth: number): number {
  const width = DEVICE_WIDTH[device];
  if (!width || paneWidth <= 0) return 1;
  return Math.min(1, paneWidth / width);
}

/**
 * A template preview frame on tallaby.com: Arabic (the default locale) has no
 * prefix. `edition` is the niche edition the suggestion carries (F-90); the
 * preview route checks it and falls back to the template's own content.
 */
export function templatePreviewSrc(origin: string, locale: string, key: string, thumb = false, edition?: string | null): string {
  const prefix = locale === "en" ? "/en" : "";
  const query = [...(edition ? [`edition=${encodeURIComponent(edition)}`] : []), ...(thumb ? ["thumb=1"] : [])].join("&");
  return `${origin}${prefix}/template-preview/${encodeURIComponent(key)}${query ? `?${query}` : ""}`;
}

/** WhatsApp share link for the store's address. */
export const whatsappShare = (text: string) => `https://wa.me/?text=${encodeURIComponent(text)}`;
