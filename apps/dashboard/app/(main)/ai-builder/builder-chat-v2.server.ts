import { createHash, randomUUID } from "node:crypto";
import { aiConfigured, aiErrorKind, generateStructured } from "@workspace/ai";
import { and, db, desc, eq, storeBuildIntakes, storeBuilds, users } from "@workspace/db";
import { getServiceClient } from "@workspace/db/supabase/service";
import { getBillingState } from "@workspace/lib/billing/server";
import { INTAKE_LIMITS, STORE_BUILD_INTAKE_BUCKET, bytesMatchType, intakeTypeFromName, isIntakeFileType, isIntakeId } from "@workspace/lib/store-builds";
import { scoreTemplates, nextTemplates } from "@workspace/store-editor/lib/template-shortlist.lib";
import { formatPhone } from "@workspace/store-sections/social";
import { TEMPLATE_STYLES, type TemplateStyle } from "@workspace/store-sections/templates";
import { mapColumns } from "@/app/(main)/products/add/from-file/from-file-run.server";
import { applyMapping, buildSheetModel, columnSamples, type SheetModel } from "@/app/(main)/products/add/from-file/from-file.lib";
import type { ColumnMapping, MappingSource } from "@/app/(main)/products/add/from-file/from-file.dto";
import {
  BUILDER_FEATURES,
  BUILDER_LIMITS,
  builderEditOutputSchema,
  builderIntakeOutputSchema,
  builderIntakeWithMappingOutputSchema,
  type BuilderAnswerValue,
  type BuilderErrorCode,
  type BuilderIntakeOutput,
  type BuilderState,
} from "./builder.dto";
import { withSellerMessage } from "./builder.lib";
import { applyEditReading, applyIntakeReading, cleanIntakeReading, intakeWithoutModel, mergeModelMapping, readFileColumns, toFileRows } from "./builder-intake.lib";
import { MAX_TEMPLATES_SHOWN, answerSummary, applyCardAnswers, currentRound, withCard } from "./builder-questions.lib";
import { EDIT_SYSTEM_RULES, INTAKE_SYSTEM_RULES, chatRequestText, intakeRequestText } from "./builder-prompts.lib";
import { imageTypeOf } from "./builder-upload.lib";
import { boundStore } from "./builder-run.server";
import { toView, type ChatContext, type ChatResult } from "./builder-chat.server";
import {
  abandonBuild,
  checkModelCall,
  claimFreeBuild,
  loadBuild,
  loadOpenBuild,
  saveBuild,
  startBuild,
  type BuildRow,
  type ModelGate,
} from "./builder.store.server";

/**
 * The v2 conversation's server side (ROADMAP.md F-82e, F-82f; spec §3–5): a
 * build from the tallaby.com hero intake or a dashboard start, one intake
 * reading (`store_builder_intake`), then question cards answered whole, free
 * text read as edits (`store_builder_chat`), and the seller's product file. The
 * seller comes from the session in every function; no id from the client is
 * trusted beyond a lookup filtered by that seller. Cost rules: docs/ai.md.
 */

const RESULT_CACHE_MS = 10 * 60_000;
const SHEET_ROW_READ_LIMIT = 600;

const gateError = (gate: Extract<ModelGate, { ok: false }>): BuilderErrorCode =>
  gate.reason === "budget" ? "budget" : gate.reason === "noCredits" ? "noCredits" : gate.reason === "dailyLimit" ? "dailyLimit" : "failed";

const fileKeyFor = (buildId: string) => createHash("sha256").update(`store-builder-file:${buildId}`).digest("hex").slice(0, 32);

/** The signup phone (users.phone), as the store's first contact number. */
async function signupPhone(sellerId: string): Promise<string | null> {
  const [row] = await db.select({ phone: users.phone }).from(users).where(eq(users.id, sellerId)).limit(1);
  return row?.phone ? formatPhone(row.phone) : null;
}

// ── Templates (spec §5) ─────────────────────────────────────────────────────

const STYLES = new Set<string>(TEMPLATE_STYLES);

function shortlistInput(state: BuilderState, seed: string) {
  return {
    industryId: state.industryId,
    styleWords: state.brief?.styleWords ?? [],
    styles: state.styles.filter((style): style is TemplateStyle => STYLES.has(style)),
    productCount: state.fileRows.length + state.products.length,
    categoryCount: new Set(state.fileRows.flatMap((row) => (row.category ? [row.category] : []))).size,
    primaryColor: state.primaryColor,
    seed,
  };
}

/** The 3 templates, scored in code (no catalog in any prompt), once the design round comes. */
export function withShortlistV2(state: BuilderState, seed: string): BuilderState {
  if (currentRound(state) !== "design" || state.shortlist.length) return state;
  const keys = scoreTemplates(shortlistInput(state, seed)).map((template) => template.key);
  return { ...state, shortlist: keys, templatesShown: [...new Set([...state.templatesShown, ...keys])] };
}

/** "Show 3 more": the next 3 by score, never one shown already. Free. */
export async function moreTemplates(ctx: ChatContext, build: BuildRow): Promise<ChatResult> {
  const state = build.state;
  if (currentRound(state) !== "design" || state.templatesShown.length >= MAX_TEMPLATES_SHOWN) return { view: toView(build), error: "invalidAnswer" };
  const keys = nextTemplates(shortlistInput(state, build.id), state.templatesShown).map((template) => template.key);
  if (!keys.length) return { view: toView(build), error: "invalidAnswer" };
  const next = withCard({ ...state, shortlist: keys, templatesShown: [...state.templatesShown, ...keys] });
  await saveBuild(ctx.sellerId, build.id, { state: next });
  return { view: toView({ ...build, state: next }) };
}

/** The card, the shortlist when its round comes, saved. */
const settle = (state: BuilderState, seed: string) => withCard(withShortlistV2(state, seed));

// ── The file ────────────────────────────────────────────────────────────────

/** The rows of a sheet the seller sent, through the mapping, as the build's compact rows. */
function fileState(state: BuilderState, buildId: string, model: SheetModel, mapping: ColumnMapping, source: MappingSource): BuilderState {
  const { rows, summary } = toFileRows(applyMapping(model, mapping), source);
  return {
    ...withActivity(state, "v2.activity.readFile", { count: summary.kept, missingPrice: summary.missingPrice, missingStock: summary.missingStock }),
    fileRows: rows,
    fileSummary: summary,
    fileReviewed: false,
    // Products are made only when the build runs, so one key per build is enough (a newer file replaces the rows).
    fileKey: fileKeyFor(buildId),
    productsChoice: state.productsChoice ?? "file",
  };
}

const withActivity = (state: BuilderState, key: string, params: Record<string, string | number>): BuilderState => ({
  ...state,
  messages: [...state.messages, { role: "assistant" as const, key, params }].slice(-200),
});

/**
 * A spreadsheet's bytes as rows of text, the importer's way (first sheet with
 * data, values not formulas, CSV kept as text). Server-side SheetJS: the file
 * was already checked by type and size at the intake, and the read is capped.
 */
async function readSheetBytes(bytes: Uint8Array, type: "csv" | "xlsx" | "xls"): Promise<SheetModel | null> {
  const XLSX = await import("xlsx");
  const text = () => {
    try {
      return new TextDecoder("utf-8", { fatal: true }).decode(bytes);
    } catch {
      return new TextDecoder("windows-1256").decode(bytes);
    }
  };
  const workbook =
    type === "csv"
      ? XLSX.read(text(), { type: "string", raw: true, sheetRows: SHEET_ROW_READ_LIMIT })
      : XLSX.read(bytes, { type: "array", cellFormula: false, cellHTML: false, cellStyles: false, sheetRows: SHEET_ROW_READ_LIMIT });
  for (const name of workbook.SheetNames) {
    const sheet = workbook.Sheets[name];
    if (!sheet?.["!ref"]) continue;
    const rows = XLSX.utils.sheet_to_json<unknown[]>(sheet, { header: 1, raw: false, defval: "", blankrows: true });
    const model = buildSheetModel(rows, XLSX.utils.decode_range(sheet["!ref"]).s.r);
    if (model.rows.length) return model;
  }
  return null;
}

// ── The intake reading (one call) ───────────────────────────────────────────

type IntakeExtras = { model: SheetModel | null; guess: { mapping: ColumnMapping; source: MappingSource; needsModel: boolean } | null; logo: { data: Uint8Array; mediaType: string } | null };

/**
 * The one `store_builder_intake` call (spec §4.2): `fast`, thinking minimal,
 * capped inputs, the logo at low resolution, cached 10 minutes, tagged with the
 * build id. The file's columns go in only when the code can't read the headers,
 * and then the same call returns the mapping. Without the model the cards
 * start from what the code read itself; nothing is lost.
 */
async function runIntakeReading(build: BuildRow, state: BuilderState, extras: IntakeExtras): Promise<{ state: BuilderState; notice: BuilderErrorCode | null }> {
  const prompt = state.about ?? "";
  const withFile = (next: BuilderState, mapping: ColumnMapping | null, source: MappingSource) =>
    extras.model && extras.guess ? fileState(next, build.id, extras.model, mapping ?? extras.guess.mapping, mapping ? source : extras.guess.source) : next;
  const fallback = (notice: BuilderErrorCode | null) => ({ state: withFile(intakeWithoutModel(state), null, "fallback"), notice });

  if (!prompt.trim() && !extras.model && !extras.logo) return { state: { ...state, intakeDone: false }, notice: null };
  if (!aiConfigured()) return fallback("disabled");
  const gate = await checkModelCall(build, BUILDER_FEATURES.intake);
  if (!gate.ok) return fallback(gateError(gate));

  const askMapping = Boolean(extras.model && extras.guess?.needsModel);
  const names = extras.model && extras.guess ? toFileRows(applyMapping(extras.model, extras.guess.mapping), extras.guess.source).rows.slice(0, 10).map((row) => row.name) : [];
  try {
    const { object } = await generateStructured({
      feature: BUILDER_FEATURES.intake,
      sellerId: build.sellerId,
      refId: build.id,
      tier: "fast",
      schema: askMapping ? builderIntakeWithMappingOutputSchema : builderIntakeOutputSchema,
      system: INTAKE_SYSTEM_RULES,
      content: [
        {
          type: "text",
          text: intakeRequestText({ prompt, color: state.primaryColor, columns: askMapping && extras.model ? columnSamples(extras.model) : null, productNames: names }),
        },
        ...(extras.logo ? [{ type: "image" as const, data: extras.logo.data, mediaType: extras.logo.mediaType }] : []),
      ],
      mediaResolution: "low",
      thinkingLevel: "minimal",
      maxOutputTokens: 900,
      cacheMs: RESULT_CACHE_MS,
    });
    const output = object as BuilderIntakeOutput;
    const next = applyIntakeReading(state, cleanIntakeReading(output, prompt));
    const columns = extras.model?.headers.length ?? 0;
    const mapping = askMapping && extras.guess ? mergeModelMapping(output.mapping, extras.guess.mapping, columns) : null;
    return { state: withFile(next, mapping, "ai"), notice: null };
  } catch (error) {
    console.error("[ai-builder] intake reading failed", error instanceof Error ? error.message : error);
    return fallback(aiErrorKind(error));
  }
}

// ── Starting ────────────────────────────────────────────────────────────────

export type StartResult = { ok: true; build: BuildRow; notice?: BuilderErrorCode | null } | { ok: false; error: BuilderErrorCode };

const v2Initial = (phone: string | null) => (state: BuilderState) =>
  withCard({ ...state, flow: "v2" as const, contact: { ...state.contact, phone: state.contact.phone ?? phone } });

/** A v2 conversation started in the dashboard: the first card asks the seller to describe the store. */
export async function startDashboardBuild(sellerId: string): Promise<StartResult> {
  const started = await startBuild(sellerId, v2Initial(await signupPhone(sellerId)));
  return started.ok ? { ok: true, build: started.build } : started;
}

const intakeFolderOk = (path: string, sellerId: string, intakeId: string) =>
  !path.includes("..") && (path.startsWith(`${sellerId}/${intakeId}/`) || path.startsWith(`guest/${intakeId}/`));

async function downloadIntake(path: string): Promise<Uint8Array | null> {
  const { data, error } = await getServiceClient().storage.from(STORE_BUILD_INTAKE_BUCKET).download(path);
  if (error || !data) return null;
  return new Uint8Array(await data.arrayBuffer());
}

/**
 * The build for a claimed hero intake (spec §3 step 5). The intake must be
 * this seller's (claimed at signup) and not expired; a build already made from
 * it is returned as it is. A conversation the seller left open is set aside (a
 * running build is never). The store made at signup is the build's store when
 * it is still this seller's and never published; else the build makes one.
 * The logo and the file come from the private bucket with the service role,
 * only from this intake's own folder. Then the one intake reading runs.
 */
export async function startBuildFromIntake(sellerId: string, intakeId: string): Promise<StartResult> {
  if (!isIntakeId(intakeId)) return { ok: false, error: "badInput" };
  const [intake] = await db
    .select()
    .from(storeBuildIntakes)
    .where(and(eq(storeBuildIntakes.id, intakeId), eq(storeBuildIntakes.sellerId, sellerId)))
    .limit(1);
  if (!intake?.claimedAt) return { ok: false, error: "notBuilding" };

  const [made] = await db
    .select({ id: storeBuilds.id })
    .from(storeBuilds)
    .where(and(eq(storeBuilds.sellerId, sellerId), eq(storeBuilds.intakeId, intakeId)))
    .orderBy(desc(storeBuilds.createdAt))
    .limit(1);
  if (made) {
    const build = await loadBuild(sellerId, made.id);
    if (build) return { ok: true, build };
  }
  if (new Date(intake.expiresAt).getTime() <= Date.now()) return { ok: false, error: "notBuilding" };

  const open = await loadOpenBuild(sellerId);
  if (open?.status === "building") return { ok: true, build: open };
  if (open) await abandonBuild(sellerId, open.id);

  const target = intake.storeId && (await boundStore(sellerId, intake.storeId)) === "ok" ? intake.storeId : null;
  const color = intake.primaryColor && /^#[0-9a-f]{6}$/i.test(intake.primaryColor) ? intake.primaryColor.toLowerCase() : null;
  const phone = await signupPhone(sellerId);
  const started = await startBuild(
    sellerId,
    (state) => ({
      ...state,
      flow: "v2",
      source: "hero",
      intakeId,
      about: intake.prompt.trim().slice(0, INTAKE_LIMITS.promptChars) || null,
      primaryColor: color,
      colorDone: Boolean(color),
      contact: { ...state.contact, phone: state.contact.phone ?? phone },
    }),
    { source: "hero", intakeId, targetStoreId: target },
  );
  if (!started.ok) return started;
  const build = started.build;
  // Another tab opened a different conversation at the same moment: that one stands.
  if (build.intakeId !== intakeId) return { ok: true, build };

  let state = build.state;
  const extras: IntakeExtras = { model: null, guess: null, logo: null };

  if (intake.logoPath && intakeFolderOk(intake.logoPath, sellerId, intakeId)) {
    const bytes = await downloadIntake(intake.logoPath).catch(() => null);
    const type = bytes && bytes.byteLength <= INTAKE_LIMITS.logoBytes ? imageTypeOf(bytes) : null;
    if (bytes && type) {
      // Into the public products bucket, under this seller's builder folder (the logo goes on the store).
      const path = `ai-builder/${sellerId}/${build.id}/logo.${type === "image/png" ? "png" : type === "image/webp" ? "webp" : "jpg"}`;
      const { error } = await getServiceClient().storage.from("products").upload(path, bytes, { contentType: type, cacheControl: "31536000", upsert: true });
      if (!error) {
        state = { ...state, logo: path, logoDone: true };
        extras.logo = { data: bytes, mediaType: type };
      }
    }
  }

  if (intake.filePath && intakeFolderOk(intake.filePath, sellerId, intakeId)) {
    const type = intakeTypeFromName(intake.filePath);
    const bytes = isIntakeFileType(type) ? await downloadIntake(intake.filePath).catch(() => null) : null;
    if (bytes && isIntakeFileType(type) && bytes.byteLength <= INTAKE_LIMITS.fileBytes && bytesMatchType(type, bytes)) {
      const model = await readSheetBytes(bytes, type).catch((error: unknown) => {
        console.error("[ai-builder] intake file unreadable", error instanceof Error ? error.message : error);
        return null;
      });
      if (model) {
        extras.model = model;
        extras.guess = readFileColumns(model);
      }
    }
  }

  const read = await runIntakeReading(build, state, extras);
  const next = settle(read.state, build.id);
  await saveBuild(sellerId, build.id, { state: next });
  return { ok: true, build: { ...build, state: next }, notice: read.notice };
}

/** Opening the chat: the card is brought up to date. Nothing is called here; a dashboard start waits for the seller's words. */
export async function refreshV2(ctx: ChatContext, build: BuildRow): Promise<ChatResult> {
  const state = settle(build.state, build.id);
  if (state !== build.state) await saveBuild(ctx.sellerId, build.id, { state });
  return { view: toView({ ...build, state }) };
}

// ── Answers ─────────────────────────────────────────────────────────────────

/** "Build and publish" (D1): the account's free build is taken here, or credits apply (as v1's brief confirmation). */
async function consent(ctx: ChatContext, build: BuildRow, state: BuilderState): Promise<ChatResult> {
  if (!ctx.emailConfirmed) return { view: toView(build), error: "emailNotConfirmed" };
  let paid = state.paid;
  let free = build.free;
  if (!paid && !free) {
    const claim = await claimFreeBuild({ sellerId: ctx.sellerId, buildId: build.id, phone: state.contact.phone, ip: ctx.ip });
    if (claim === "phoneUsed" || claim === "ipLimit" || claim === "platformBusy") return { view: toView(build), error: claim };
    if (claim === "already") {
      const billing = await getBillingState().catch(() => null);
      if (!billing?.usdLive) return { view: toView(build), error: "creditsNotLive" };
      paid = true;
    } else free = true;
  }
  const next = { ...withSellerMessage(state, "card:build:build"), paid, pendingQuestions: null };
  await saveBuild(ctx.sellerId, build.id, { state: next, status: "building" });
  return { view: toView({ ...build, state: next, free, status: "building" }) };
}

/** A whole card of answers in one request (spec §4.3). */
export async function answerCard(ctx: ChatContext, build: BuildRow, answers: Record<string, BuilderAnswerValue>): Promise<ChatResult> {
  const result = applyCardAnswers(build.state, answers);
  if (result.kind === "error") return { view: toView(build), error: result.error };
  if (result.kind === "build") return consent(ctx, build, result.state);

  // What the seller typed shows as their bubble; choices show as a short code the client labels.
  const typed = Object.values(answers).flatMap((answer) => (answer.text?.trim() ? [answer.text.trim()] : []));
  let state = withSellerMessage(result.state, typed.length ? typed.join("\n") : `card:${answerSummary(answers)}`);
  let notice: BuilderErrorCode | null = null;
  if (result.kind === "describe") {
    const read = await runIntakeReading(build, state, { model: null, guess: null, logo: null });
    state = read.state;
    notice = read.notice;
  }
  state = settle(state, build.id);
  await saveBuild(ctx.sellerId, build.id, { state });
  return { view: toView({ ...build, state }, notice) };
}

/**
 * Free text between the cards: read by `store_builder_chat` (capped turns,
 * free on a paid build) into state changes in code. On the describe card it is
 * the description itself.
 */
export async function editText(ctx: ChatContext, build: BuildRow, text: string): Promise<ChatResult> {
  const typed = text.trim();
  if (!typed) return { view: toView(build), error: "invalidAnswer" };
  if (typed.length > BUILDER_LIMITS.textMax) return { view: toView(build), error: "tooLong" };
  if (currentRound(build.state) === "describe") return answerCard(ctx, build, { describe: { text: typed } });

  let state = withSellerMessage(build.state, typed);
  let turns = build.chatTurns;
  let notice: BuilderErrorCode | null = null;
  if (!aiConfigured()) notice = "disabled";
  else if (build.chatTurns >= BUILDER_LIMITS.chatTurns) notice = "turnLimit";
  else {
    const gate = await checkModelCall(build, BUILDER_FEATURES.chat);
    if (!gate.ok) notice = gateError(gate);
    else {
      try {
        const { object, cached } = await generateStructured({
          feature: BUILDER_FEATURES.chat,
          sellerId: build.sellerId,
          refId: build.id,
          tier: "fast",
          schema: builderEditOutputSchema,
          system: EDIT_SYSTEM_RULES,
          content: [{ type: "text", text: chatRequestText(state, typed) }],
          thinkingLevel: "minimal",
          maxOutputTokens: 1500,
          cacheMs: RESULT_CACHE_MS,
        });
        state = applyEditReading(state, object, typed, () => randomUUID().slice(0, 12));
        turns += cached ? 0 : 1;
      } catch (error) {
        console.error("[ai-builder] edit reading failed", error instanceof Error ? error.message : error);
        turns += 1;
        notice = aiErrorKind(error);
      }
    }
  }
  state = settle(state, build.id);
  await saveBuild(ctx.sellerId, build.id, { state, chatTurns: turns });
  return { view: toView({ ...build, state, chatTurns: turns }, notice) };
}

/** The logo's main colours, read in the browser: they become the colour choices. */
export async function setLogoColors(ctx: ChatContext, build: BuildRow, colors: string[]): Promise<ChatResult> {
  const state = settle({ ...build.state, logoColors: [...new Set(colors.map((color) => color.toLowerCase()))].slice(0, 3) }, build.id);
  await saveBuild(ctx.sellerId, build.id, { state });
  return { view: toView({ ...build, state }) };
}

/**
 * A product file attached in the chat, read in the browser by the importer's
 * own parser (its reasons: big files, SheetJS advisories). The rows are checked
 * again here; the columns are read in code, else by the importer's mapping call
 * (`product_bulk_map`, free, its own daily cap).
 */
export async function attachFile(ctx: ChatContext, build: BuildRow, input: { headers: string[]; rows: { row: number; cells: string[] }[] }): Promise<ChatResult> {
  if (build.state.products.length) return { view: toView(build), error: "invalidAnswer" };
  const sheet = buildSheetModel([input.headers, ...input.rows.map((row) => row.cells)]);
  if (!sheet.rows.length) return { view: toView(build), error: "badFile" };
  const columns = readFileColumns(sheet);
  let { mapping, source } = columns;
  if (columns.needsModel) {
    const mapped = await mapColumns(ctx.sellerId, { fileBytes: 0, totalRows: sheet.rows.length, columns: columnSamples(sheet) });
    if (mapped.ok) ({ mapping, source } = mapped);
  }
  let state = fileState(build.state, build.id, sheet, mapping, source);
  if (!state.fileRows.length) return { view: toView(build), error: "badFile" };
  state = settle(state, build.id);
  await saveBuild(ctx.sellerId, build.id, { state });
  return { view: toView({ ...build, state }) };
}
