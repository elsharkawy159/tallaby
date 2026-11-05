"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { useDropzone } from "react-dropzone";
import { ArrowLeft, ChevronDown, Download, FileSpreadsheet, HardDrive, RotateCcw, Sparkles, UploadCloud, X } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@workspace/ui/components/select";
import { cn } from "@workspace/ui/lib/utils";
import { formatNumber } from "@/lib/i18n/format";
import { downloadXlsx, PRODUCT_EXCEL_COLUMNS, PRODUCT_EXCEL_TEMPLATE_ROW, todayStamp } from "@/lib/product-excel";
import { IconButton, Note, SellerButton } from "@/components/seller-ui";
import { BackIcon, backClassName, FlowIntro, FlowOrb, FlowStage, GenCard, GenFoot, PILL_BUTTON_CLASS, type GenStep } from "../add-flow.client";
import {
  BULK_CREDITS_PER_AI_PRODUCT,
  BULK_FIELDS,
  BULK_LIMITS,
  type BulkErrorCode,
  type BulkField,
  type BulkNote,
  type BulkProblem,
  type BulkRowResult,
  type BulkSource,
  type BulkStatus,
  type BulkStop,
  type ColumnMapping,
  type MappedRow,
  type MappingSource,
} from "./from-file.dto";
import {
  applyMapping,
  columnSamples,
  countVariantLikeRows,
  estimateCredits,
  importSku,
  needsAiCopy,
  orderForRun,
  summarizeRows,
  willBeDraft,
  type SheetModel,
  type ValidRow,
} from "./from-file.lib";
import {
  ACCEPTED_FILE_TYPES,
  checkPickedFile,
  FileReadError,
  hashFile,
  isPdfFile,
  PdfReadFailure,
  readPdfRows,
  readSheetFile,
  type PdfProgress,
} from "./from-file-parse.client";
import { addBatchAction, findExistingSkusAction, getBulkStatusAction, mapColumnsAction } from "./from-file.server";

/**
 * Add many products from a file (PLAN.md AI-3). One screen to confirm, one button
 * to add them all, then a progress bar. Sends a few rows at a time, so closing
 * the page loses nothing already added, and the same file uploaded again carries
 * on where it stopped.
 */

type Stage = "pick" | "reading" | "confirm" | "running" | "done";

type FileInfo = { name: string; bytes: number; key: string; source: BulkSource; sheetCount: number };

/** How many times one batch or row is sent before the run stops and asks. */
const BATCH_TRIES = 3;
const RETRYABLE: readonly BulkErrorCode[] = ["busy", "timeout", "failed", "rateLimited"];

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const REVIEWED_FIELDS: readonly BulkField[] = ["name", "price", "salePrice", "stock", "sku", "category", "brand", "description", "images"];
const OTHER_FIELDS = BULK_FIELDS.filter((field) => !REVIEWED_FIELDS.includes(field));

function Stat({ label, value, tone }: { label: string; value: string; tone?: "good" | "warn" | "bad" }) {
  return (
    <div className="bg-(--s-surface) px-[18px] py-3.5 max-[640px]:p-3">
      <b
        className={cn(
          "block font-montserrat text-[22px] leading-[1.3] font-extrabold tabular-nums text-(--s-ink) max-[640px]:text-lg",
          tone === "good" && "text-success",
          tone === "warn" && "text-accent-ink",
          tone === "bad" && "text-destructive",
        )}
      >
        {value}
      </b>
      <small className="text-xs text-(--s-muted)">{label}</small>
    </div>
  );
}

const fileSize = (bytes: number) => (bytes > 1e6 ? `${(bytes / 1e6).toFixed(1)} MB` : `${Math.max(1, Math.round(bytes / 1e3))} KB`);

const NONE = "none";

/** A <details> summary in the design's look: the label, then a chevron that turns when open. */
const SUMMARY_CLASS =
  "flex min-h-10 cursor-pointer list-none items-center justify-between gap-2 text-sm font-medium text-(--s-ink) [&::-webkit-details-marker]:hidden";
const SUMMARY_CHEVRON_CLASS = "size-4 shrink-0 text-(--s-faint) transition-transform duration-200 group-open/details:rotate-180";

function FieldSelect({
  field,
  mapping,
  model,
  onChange,
}: {
  field: BulkField;
  mapping: ColumnMapping;
  model: SheetModel;
  onChange: (field: BulkField, column: number | null) => void;
}) {
  const t = useTranslations("bulkFileImport");
  const samples = useMemo(() => columnSamples(model), [model]);
  const id = `bulk-field-${field}`;
  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={id} className="text-xs font-medium">
        {t(`fields.${field}`)}
      </label>
      <Select value={mapping[field] === null ? NONE : String(mapping[field])} onValueChange={(value) => onChange(field, value === NONE ? null : Number(value))}>
        <SelectTrigger id={id} className="h-9 w-full">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={NONE}>{t("notInFile")}</SelectItem>
          {samples.map((column) => (
            <SelectItem key={column.index} value={String(column.index)}>
              {column.header || t("columnNumber", { number: column.index + 1 })}
              {column.samples[0] ? ` (${column.samples[0].slice(0, 24)})` : ""}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

export function FromFile({ aiEnabled }: { aiEnabled: boolean }) {
  const t = useTranslations("bulkFileImport");
  const locale = useLocale();
  const number = useCallback((value: number) => formatNumber(value, locale), [locale]);

  const [stage, setStage] = useState<Stage>("pick");
  const [readError, setReadError] = useState<string | null>(null);
  const [pdfProgress, setPdfProgress] = useState<PdfProgress | null>(null);
  const [picked, setPicked] = useState<{ name: string; bytes: number } | null>(null);
  const [readPhase, setReadPhase] = useState<"read" | "map">("read");

  const [file, setFile] = useState<FileInfo | null>(null);
  const [model, setModel] = useState<SheetModel | null>(null);
  const [pdfRows, setPdfRows] = useState<MappedRow[]>([]);
  const [mapping, setMapping] = useState<ColumnMapping | null>(null);
  const [mappingSource, setMappingSource] = useState<MappingSource | null>(null);
  const [status, setStatus] = useState<Extract<BulkStatus, { ok: true }> | null>(null);
  const [existing, setExisting] = useState<ReadonlySet<string>>(new Set());

  const [results, setResults] = useState<BulkRowResult[]>([]);
  const [creditsUsed, setCreditsUsed] = useState(0);
  const [stop, setStop] = useState<BulkStop | null>(null);
  const [pausedOn, setPausedOn] = useState<BulkErrorCode | null>(null);
  const [total, setTotal] = useState(0);
  const pending = useRef<MappedRow[]>([]);
  const tries = useRef(new Map<number, number>());

  const rows = useMemo(() => (model && mapping ? applyMapping(model, mapping) : pdfRows), [model, mapping, pdfRows]);
  const summary = useMemo(() => summarizeRows(rows), [rows]);
  const skuOf = useCallback((row: ValidRow) => (file ? importSku(file.key, file.source, row) : ""), [file]);
  const toAdd = useMemo(() => summary.ready.filter((row) => !existing.has(skuOf(row))), [summary, existing, skuOf]);
  const alreadyAdded = summary.ready.length - toAdd.length;
  const credits = useMemo(() => estimateCredits(toAdd), [toAdd]);
  const aiRows = useMemo(() => toAdd.filter(needsAiCopy).length, [toAdd]);
  const drafts = useMemo(() => toAdd.filter(willBeDraft).length, [toAdd]);
  const variantLikeRows = useMemo(() => countVariantLikeRows(toAdd), [toAdd]);
  const rowByNumber = useMemo(() => new Map(rows.map((row) => [row.row, row])), [rows]);

  // Rows an earlier run of this file already added, so they don't count here. It changes with the mapping.
  const skuKey = useMemo(() => summary.ready.map(skuOf).join("|"), [summary, skuOf]);
  useEffect(() => {
    if (stage !== "confirm" || !skuKey) return;
    let cancelled = false;
    void findExistingSkusAction({ skus: skuKey.split("|") })
      .then((found) => {
        if (!cancelled && found.ok) setExisting(new Set(found.existing));
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [skuKey, stage]);

  // Closing the page mid-run loses nothing, but the seller should know it stops.
  useEffect(() => {
    if (stage !== "running") return;
    const warn = (event: BeforeUnloadEvent) => event.preventDefault();
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [stage]);

  const reset = () => {
    setStage("pick");
    setReadError(null);
    setPdfProgress(null);
    setPicked(null);
    setReadPhase("read");
    setFile(null);
    setModel(null);
    setPdfRows([]);
    setMapping(null);
    setMappingSource(null);
    setStatus(null);
    setExisting(new Set());
    setResults([]);
    setCreditsUsed(0);
    setStop(null);
    setPausedOn(null);
    setTotal(0);
    pending.current = [];
    tries.current = new Map();
  };

  const readFile = async (chosen: File) => {
    setReadError(null);
    try {
      checkPickedFile(chosen);
      setPicked({ name: chosen.name, bytes: chosen.size });
      setReadPhase("read");
      setStage("reading");
      const buffer = await chosen.arrayBuffer();
      const key = await hashFile(buffer);
      const loaded = await getBulkStatusAction();
      if (loaded.ok) setStatus(loaded);

      if (isPdfFile(chosen)) {
        const read = await readPdfRows(chosen, buffer, setPdfProgress);
        setFile({ name: chosen.name, bytes: chosen.size, key, source: "pdf", sheetCount: 1 });
        setPdfRows(read);
        setStage("confirm");
        return;
      }

      const sheet = await readSheetFile(chosen, buffer);
      setReadPhase("map");
      const mapped = await mapColumnsAction({
        fileBytes: chosen.size,
        totalRows: sheet.model.rows.length,
        columns: columnSamples(sheet.model),
      });
      if (!mapped.ok) throw new PdfReadFailure(mapped.error);
      setFile({ name: chosen.name, bytes: chosen.size, key, source: "sheet", sheetCount: sheet.sheetCount });
      setModel(sheet.model);
      setMapping(mapped.mapping);
      setMappingSource(mapped.source);
      setStage("confirm");
    } catch (error) {
      const code = error instanceof FileReadError || error instanceof PdfReadFailure ? error.code : "failed";
      setReadError(t(`errors.${code}`));
      setStage("pick");
    }
  };

  const dropzone = useDropzone({
    multiple: false,
    noClick: false,
    onDrop: (accepted) => {
      if (accepted[0]) void readFile(accepted[0]);
    },
  });

  const changeMapping = (field: BulkField, column: number | null) => {
    setMapping((current) => {
      if (!current) return current;
      const next = { ...current };
      // A column belongs to one field: picking it here takes it from the other one.
      if (column !== null) {
        for (const other of BULK_FIELDS) if (next[other] === column) next[other] = null;
      }
      next[field] = column;
      return next;
    });
  };

  const run = async () => {
    if (!file) return;
    setStage("running");
    setStop(null);
    setPausedOn(null);

    while (pending.current.length > 0) {
      const batch = pending.current.slice(0, BULK_LIMITS.batchSize);
      let answer;
      try {
        answer = await addBatchAction({ fileKey: file.key, source: file.source, rows: batch });
      } catch {
        answer = { ok: false as const, error: "failed" as const };
      }

      if (!answer.ok) {
        const key = batch[0]!.row;
        const attempt = (tries.current.get(key) ?? 0) + 1;
        tries.current.set(key, attempt);
        if (RETRYABLE.includes(answer.error) && attempt < BATCH_TRIES) {
          await wait(2000 * attempt);
          continue;
        }
        // Everything added so far stays; the seller decides when to try again.
        tries.current.delete(key);
        setPausedOn(answer.error);
        setStage("done");
        return;
      }

      setCreditsUsed((used) => used + answer.creditsUsed);
      const again: MappedRow[] = [];
      const finished: BulkRowResult[] = [];
      const left: MappedRow[] = [];
      for (const result of answer.results) {
        const source = rowByNumber.get(result.row);
        if (result.outcome === "remaining" && source) {
          left.push(source);
        } else if (result.outcome === "failed" && source && (tries.current.get(result.row) ?? 0) + 1 < BATCH_TRIES) {
          tries.current.set(result.row, (tries.current.get(result.row) ?? 0) + 1);
          again.push(source);
        } else {
          finished.push(result);
        }
      }
      setResults((all) => [...all, ...finished]);
      pending.current = [...again, ...left, ...pending.current.slice(batch.length)];
      if (again.length) await wait(2000);

      if (answer.stop) {
        setStop(answer.stop);
        setStage("done");
        return;
      }
    }
    setStage("done");
  };

  const start = () => {
    const wanted = new Set(toAdd.map((row) => row.row));
    const queue = orderForRun(rows.filter((row) => wanted.has(row.row)));
    pending.current = queue;
    tries.current = new Map();
    setResults([]);
    setCreditsUsed(0);
    setTotal(queue.length);
    void run();
  };

  const count = (outcome: BulkRowResult["outcome"]) => results.filter((result) => result.outcome === outcome).length;
  const processed = results.length;
  const remaining = pending.current.length;

  const skipped = useMemo(() => {
    const fromRun = results.filter((result) => result.outcome === "skipped" || result.outcome === "failed");
    return [
      ...summary.problems.map((problem) => ({ row: problem.row, reason: t(`problems.${problem.problem}`) })),
      ...fromRun.map((result) => ({
        row: result.row,
        reason: result.problem ? t(`problems.${result.problem as BulkProblem}`) : t("problems.failed"),
      })),
    ].sort((a, b) => a.row - b.row);
  }, [results, summary, t]);

  const toCheck = useMemo(
    () => results.filter((result) => result.productId && (result.notes?.includes("checkCategory") || result.notes?.includes("checkName"))),
    [results],
  );

  const noteCounts = useMemo(() => {
    const counts = new Map<BulkNote, number>();
    for (const result of results) {
      if (result.outcome !== "draft" && result.outcome !== "live") continue;
      for (const note of result.notes ?? []) counts.set(note, (counts.get(note) ?? 0) + 1);
    }
    return [...counts.entries()];
  }, [results]);

  const downloadSkipped = async () => {
    const lines = skipped.map(({ row, reason }) => {
      const source = rowByNumber.get(row) ?? { row };
      const cells: Record<string, string | number> = { [t("download.row")]: row, [t("download.reason")]: reason };
      for (const field of BULK_FIELDS) cells[t(`fields.${field}`)] = source[field] ?? "";
      return cells;
    });
    const stillPending = pending.current.map((source) => {
      const cells: Record<string, string | number> = { [t("download.row")]: source.row, [t("download.reason")]: t("problems.notAdded") };
      for (const field of BULK_FIELDS) cells[t(`fields.${field}`)] = source[field] ?? "";
      return cells;
    });
    await downloadXlsx([...lines, ...stillPending], { fileName: `tallaby-rows-to-fix-${todayStamp()}.xlsx` });
  };

  const creditsShort = status?.creditsLive && status.creditsLeft !== null && credits > status.creditsLeft;
  const dailyShort = status && !status.creditsLive && Math.ceil(aiRows / BULK_LIMITS.batchSize) > status.callsLeftToday;
  const canAddProducts = toAdd.length > 0 && (aiEnabled || aiRows === 0);

  const shown = file ?? picked;
  const fileRow = shown && (
    <div className="flex items-center gap-3 rounded-2xl border border-(--s-line) bg-(--s-surface) px-3.5 py-3 shadow-(--s-shadow-card) motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-2">
      <span className="grid size-10 shrink-0 place-items-center rounded-[10px] bg-success-soft text-success">
        <FileSpreadsheet className="size-[18px]" aria-hidden />
      </span>
      <div className="min-w-0 flex-1">
        <b className="block truncate font-sans text-sm text-(--s-ink) rtl:text-right" dir="ltr">
          {shown.name}
        </b>
        <small className="text-xs text-(--s-muted)">
          <span dir="ltr">{fileSize(shown.bytes)}</span>
          {stage !== "reading" && <> · {t("stage.rowCount", { count: rows.length })}</>}
        </small>
      </div>
      {stage !== "reading" && stage !== "running" && (
        <IconButton type="button" onClick={reset} aria-label={t("anotherFile")} title={t("anotherFile")}>
          <X aria-hidden />
        </IconButton>
      )}
    </div>
  );

  const stageShell = (children: React.ReactNode, running = true) => (
    <FlowStage
      back={
        <Link href="/products/add?method=choose" className={backClassName}>
          <BackIcon />
          {t("stage.back")}
        </Link>
      }
      icon={FileSpreadsheet}
      label={t("stage.mode")}
      running={running}
    >
      {children}
    </FlowStage>
  );

  if (stage === "pick") {
    return stageShell(
      <>
        <FlowIntro orb={<FlowOrb icon={FileSpreadsheet} />} title={t("stage.title")}>
          <ul className="mt-0.5 flex flex-col gap-1 text-sm text-pretty text-(--s-muted)">
            <li>
              <Sparkles className="me-2 inline size-4 align-[-3px] text-primary-ink" aria-hidden />
              {t("stage.noteAi")}
            </li>
            <li>
              <HardDrive className="me-2 inline size-4 align-[-3px] text-primary-ink" aria-hidden />
              {t("stage.noteLimit", { bytes: BULK_LIMITS.maxFileBytes / (1024 * 1024), products: BULK_LIMITS.maxProducts })}
            </li>
          </ul>
        </FlowIntro>
        {!aiEnabled && <Note>{t("aiOff")}</Note>}
        <div
          {...dropzone.getRootProps()}
          className={cn(
            "flex cursor-pointer flex-col items-center gap-2 rounded-[24px] border-2 border-dashed border-(--s-field-strong) bg-(--s-surface) px-6 py-11 text-center transition-colors duration-150 hover:border-(--s-primary) hover:bg-primary-soft focus-visible:outline-[3px] focus-visible:outline-offset-2 focus-visible:outline-(--s-focus) max-[640px]:py-8 motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-2 motion-safe:duration-500",
            dropzone.isDragActive && "border-(--s-primary) bg-primary-soft",
            readError && "border-destructive bg-destructive-soft",
          )}
        >
          <input {...dropzone.getInputProps()} accept={ACCEPTED_FILE_TYPES} aria-label={t("pickButton")} />
          <span className={cn("mb-1.5 grid size-14 place-items-center rounded-2xl bg-primary-soft text-primary-ink", dropzone.isDragActive && "bg-(--s-surface)")}>
            <UploadCloud className="size-[26px]" aria-hidden />
          </span>
          <b className="text-base font-semibold text-(--s-ink)">{t("stage.drop")}</b>
          <small className="text-xs text-(--s-faint)">{t("stage.dropTypes", { pages: BULK_LIMITS.maxPdfPages })}</small>
          {readError && (
            <span className="text-[13px] font-medium text-destructive" role="alert">
              {readError}
            </span>
          )}
          <SellerButton type="button" variant="outline" className="pointer-events-none mt-2" tabIndex={-1}>
            {t("pickButton")}
          </SellerButton>
        </div>
        <div className="flex flex-wrap justify-center gap-2">
          <button type="button" className={PILL_BUTTON_CLASS} onClick={() => void downloadXlsx([PRODUCT_EXCEL_TEMPLATE_ROW], { fileName: "tallaby-products-template.xlsx", header: PRODUCT_EXCEL_COLUMNS })}>
            <Download aria-hidden />
            {t("stage.template")}
          </button>
        </div>
      </>,
      false,
    );
  }

  // What the file showed once read; the same list stays on every later screen.
  const matched = mapping ? BULK_FIELDS.filter((field) => mapping[field] !== null).map((field) => t(`fields.${field}`)) : [];
  const analysis: GenStep[] = [
    {
      key: "read",
      label: t("stage.read"),
      state: "done",
      output: model
        ? t("stage.readDone", { rows: model.rows.length, cols: columnSamples(model).length })
        : t("stage.readDonePdf", { rows: pdfRows.length }),
    },
    ...(model
      ? [{ key: "map", label: t("stage.map"), state: "done" as const, output: matched.join(locale === "ar" ? "، " : ", ") || t("mappingNeeded") }]
      : []),
    {
      key: "check",
      label: t("stage.check"),
      state: "done",
      output: summary.problems.length
        ? t("stage.checkProblems", { ready: number(toAdd.length), problems: number(summary.problems.length) })
        : t("stage.checkDone", { ready: number(toAdd.length) }),
    },
  ];

  if (stage === "reading") {
    const pdfPercent = pdfProgress ? Math.round((pdfProgress.doneCalls / Math.max(1, pdfProgress.totalCalls)) * 100) : null;
    return stageShell(
      <div className="flex flex-col gap-4">
        {fileRow}
        <GenCard
          icon={Sparkles}
          title={t("stage.analyzing")}
          subtitle={pdfProgress ? t("readingPdf") : t("reading")}
          percent={pdfPercent}
          steps={[
            { key: "read", label: t("stage.read"), state: readPhase === "read" ? "run" : "done" },
            ...(pdfProgress ? [] : [{ key: "map", label: t("stage.map"), state: readPhase === "map" ? ("run" as const) : ("wait" as const) }]),
            { key: "check", label: t("stage.check"), state: "wait" },
          ]}
        />
      </div>,
    );
  }

  if (stage === "running") {
    const percent = Math.round((processed / Math.max(1, total)) * 100);
    return stageShell(
      <div className="flex flex-col gap-4">
        {fileRow}
        <GenCard
          icon={Sparkles}
          title={t("running")}
          subtitle={t("runningCount", { done: number(processed), total: number(total) })}
          percent={percent}
          steps={[...analysis, { key: "add", label: t("stage.add"), state: "run" }]}
        >
          <p className="border-t border-(--s-line) px-[18px] py-3 text-xs text-(--s-muted)">{t("runningNote")}</p>
        </GenCard>
      </div>,
    );
  }

  if (stage === "done") {
    const live = count("live");
    const draft = count("draft");
    const added = live + draft;
    const interrupted = Boolean(stop || pausedOn);
    const actions = (
      <div className="flex flex-wrap gap-2">
        {interrupted && remaining > 0 && (
          <SellerButton type="button" onClick={() => void run()}>
            <RotateCcw aria-hidden />
            {t("continue", { count: number(remaining) })}
          </SellerButton>
        )}
        {stop === "noCredits" && (
          <SellerButton variant="outline" asChild>
            <Link href="/settings/plan" target="_blank">
              {t("getCredits")}
            </Link>
          </SellerButton>
        )}
        {(skipped.length > 0 || remaining > 0) && (
          <SellerButton type="button" variant="outline" onClick={() => void downloadSkipped()}>
            <Download aria-hidden />
            {t("downloadProblems")}
          </SellerButton>
        )}
        <SellerButton type="button" variant="outline" onClick={reset}>
          {t("anotherFile")}
        </SellerButton>
        <SellerButton variant={interrupted ? "outline" : "amber"} asChild>
          <Link href="/products">
            {t("viewProducts")}
            <ArrowLeft className="ltr:rotate-180" aria-hidden />
          </Link>
        </SellerButton>
      </div>
    );

    return stageShell(
      <div className="flex flex-col gap-4">
        {fileRow}
        <GenCard
          icon={Sparkles}
          title={stop ? t(`stopped.${stop}.title`) : pausedOn ? t("paused.title") : t("doneTitle")}
          subtitle={interrupted ? undefined : t("stage.doneBody")}
          percent={interrupted ? Math.round((processed / Math.max(1, total)) * 100) : 100}
          finished={!interrupted}
          steps={[
            ...analysis,
            interrupted
              ? { key: "add", label: t("stage.add"), state: "skip", output: t("stage.addPartly", { count: added, remaining }) }
              : { key: "add", label: t("stage.add"), state: "done", output: t("stage.addDone", { count: added }) },
          ]}
        >
          <div className="grid grid-cols-2 gap-px border-t border-(--s-line) bg-(--s-line) sm:grid-cols-4">
            <Stat label={t("result.live")} value={number(live)} tone="good" />
            <Stat label={t("result.drafts")} value={number(draft)} tone={draft ? "warn" : undefined} />
            <Stat label={t("result.skipped")} value={number(skipped.length + count("already"))} tone={skipped.length ? "bad" : undefined} />
            <Stat label={t("result.credits")} value={number(creditsUsed)} />
          </div>

          {interrupted && (
            <div className="border-t border-(--s-line) p-[18px]">
              <Note tone="amber">
                {stop ? t(`stopped.${stop}.body`, { remaining: number(remaining) }) : t("paused.body", { remaining: number(remaining), reason: t(`errors.${pausedOn!}`) })}
              </Note>
            </div>
          )}

          {count("already") > 0 && <p className="border-t border-(--s-line) px-[18px] py-3 text-sm text-(--s-muted)">{t("result.already", { count: number(count("already")) })}</p>}

          {noteCounts.length > 0 && (
            <div className="border-t border-(--s-line) px-[18px] py-3.5 text-sm">
              <div className="mb-1 text-[13px] font-bold text-(--s-ink)">{t("result.notesTitle")}</div>
              <ul className="list-inside list-disc space-y-0.5 text-(--s-muted)">
                {noteCounts.map(([note, total]) => (
                  <li key={note}>{t(`notes.${note}`, { count: number(total) })}</li>
                ))}
              </ul>
            </div>
          )}

          {toCheck.length > 0 && (
            <div className="border-t border-(--s-line) bg-accent-soft/60 px-[18px] py-3.5 text-sm">
              <div className="mb-1 text-[13px] font-bold text-(--s-ink)">{t("check.title")}</div>
              <p className="mb-2 text-xs text-(--s-muted)">{t("check.body")}</p>
              <ul className="max-h-72 space-y-1.5 overflow-auto">
                {toCheck.slice(0, 100).map((result) => (
                  <li key={result.row} className="flex flex-wrap items-center justify-between gap-x-3 gap-y-0.5">
                    <span className="min-w-0 truncate" dir="auto">
                      {result.title}
                    </span>
                    <span className="flex shrink-0 items-center gap-3 text-xs text-(--s-muted)">
                      {result.categoryName && <span dir="auto">{result.categoryName}</span>}
                      <Link href={`/products/${result.productId}/edit`} target="_blank" className="font-medium text-primary-ink underline underline-offset-2">
                        {t("check.fix")}
                      </Link>
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {skipped.length > 0 && (
            <div className="border-t border-(--s-line)">
              <div className="px-[18px] pt-3.5 text-[13px] font-bold text-(--s-ink)">{t("problemsTitle")}</div>
              <ul className="flex max-h-72 flex-col overflow-auto px-[18px] pt-1.5 pb-3.5">
                {skipped.slice(0, 100).map(({ row, reason }) => {
                  const source = rowByNumber.get(row);
                  return (
                    <li key={`${row}-${reason}`} className="flex flex-wrap items-center gap-2.5 border-b border-(--s-line) py-2.5 text-[13px] last:border-b-0">
                      <span className="shrink-0 rounded-md border border-(--s-line) bg-(--s-surface-2) px-1.5 font-sans text-[11px] text-(--s-faint)" dir="ltr">
                        #{row}
                      </span>
                      <span className="min-w-0 flex-1 truncate" dir="auto">
                        {source?.name ?? source?.nameAr ?? source?.nameEn ?? ""}
                      </span>
                      <span className="max-w-full rounded-full bg-accent-soft px-2.5 text-xs leading-[22px] text-accent-ink">{reason}</span>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}

          {interrupted ? (
            <div className="border-t border-(--s-line) px-[18px] py-3.5">{actions}</div>
          ) : (
            <GenFoot title={t("stage.footTitle", { count: added })} body={t("stage.footBody")}>
              {actions}
            </GenFoot>
          )}
        </GenCard>
      </div>,
    );
  }

  // Confirm
  const hasName = !model || (mapping && (mapping.name !== null || mapping.nameAr !== null || mapping.nameEn !== null));
  const hasPrice = !model || (mapping && (mapping.price !== null || mapping.salePrice !== null));
  return stageShell(
    <div className="flex flex-col gap-4">
      {fileRow}
      <GenCard icon={Sparkles} title={t("stage.confirmTitle")} subtitle={t("stage.confirmBody")} percent={null} finished steps={analysis}>
        <div className="grid grid-cols-2 gap-px border-t border-(--s-line) bg-(--s-line) sm:grid-cols-4">
          <Stat label={t("found")} value={number(summary.found)} />
          <Stat label={t("ready")} value={number(toAdd.length)} tone="good" />
          <Stat label={t("problemsCount")} value={number(summary.problems.length)} tone={summary.problems.length ? "bad" : undefined} />
          <Stat label={t("willBeDrafts")} value={number(drafts)} tone={drafts ? "warn" : undefined} />
        </div>

        <div className="flex flex-col gap-3 border-t border-(--s-line) p-[18px] max-[600px]:p-3.5">
          {file && file.sheetCount > 1 && <p className="text-xs text-(--s-muted)">{t("firstSheetOnly")}</p>}
          {alreadyAdded > 0 && <p className="text-sm text-(--s-muted)">{t("alreadyAdded", { count: number(alreadyAdded) })}</p>}
          {drafts > 0 && <p className="text-sm text-(--s-muted)">{t("draftsNote")}</p>}
          {model && mapping && mapping.cost !== null && <p className="text-sm text-(--s-muted)">{t("costNotSaved")}</p>}
          {variantLikeRows > 0 && <p className="text-sm text-accent-ink">{t("variantRowsWarning", { count: number(variantLikeRows) })}</p>}

          {(!hasName || !hasPrice) && <Note tone="danger">{t("mappingNeeded")}</Note>}

          <div className="flex items-start gap-2 rounded-2xl border border-(--s-line) bg-(--s-tint) p-3 text-sm">
            <Sparkles className="mt-0.5 size-4 shrink-0 text-primary-ink" aria-hidden />
            <div>
              {aiRows === 0
                ? t("estimate.none")
                : status?.creditsLive
                  ? t("estimate.credits", { rows: number(aiRows), credits: number(credits), left: number(status.creditsLeft ?? 0), each: number(BULK_CREDITS_PER_AI_PRODUCT) })
                  : t("estimate.free", { rows: number(aiRows) })}
              {creditsShort && <div className="mt-1 text-destructive">{t("estimate.short", { covered: number(Math.floor((status?.creditsLeft ?? 0) / BULK_CREDITS_PER_AI_PRODUCT)) })}</div>}
              {dailyShort && <div className="mt-1 text-destructive">{t("estimate.dailyShort", { covered: number((status?.callsLeftToday ?? 0) * BULK_LIMITS.batchSize) })}</div>}
            </div>
          </div>

          {summary.problems.length > 0 && (
            <details className="group/details rounded-2xl border border-(--s-line) bg-(--s-surface) px-3 py-1 text-sm">
              <summary className={SUMMARY_CLASS}>
                {t("problemsTitle")}
                <ChevronDown className={SUMMARY_CHEVRON_CLASS} aria-hidden />
              </summary>
              <ul className="mb-2 max-h-48 space-y-0.5 overflow-auto text-(--s-muted)">
                {summary.problems.slice(0, 100).map(({ row, problem }) => (
                  <li key={`${row}-${problem}`}>{t("problemLine", { row: number(row), reason: t(`problems.${problem}`) })}</li>
                ))}
              </ul>
            </details>
          )}

          {model && mapping && (
            <details className="group/details rounded-2xl border border-(--s-line) bg-(--s-surface) px-3 py-1" open={mappingSource === "fallback" || !hasName || !hasPrice}>
              <summary className={SUMMARY_CLASS}>
                {t("mappingTitle")}
                <ChevronDown className={SUMMARY_CHEVRON_CLASS} aria-hidden />
              </summary>
              {mappingSource && <p className="text-xs text-(--s-muted)">{t(`mappingSource.${mappingSource}`)}</p>}
              <div className="mt-3 mb-2 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {[...REVIEWED_FIELDS, ...OTHER_FIELDS].map((field) => (
                  <FieldSelect key={field} field={field} mapping={mapping} model={model} onChange={changeMapping} />
                ))}
              </div>
            </details>
          )}

          {toAdd.length > 0 && (
            <>
            {/* Phones: rows, not a table that scrolls sideways. */}
            <ul className="hidden flex-col rounded-2xl border border-(--s-line) bg-(--s-surface) max-[600px]:flex">
              {toAdd.slice(0, 5).map((row) => (
                <li key={row.row} className="flex items-start gap-2.5 border-b border-(--s-line) px-3 py-2.5 text-[13px] last:border-b-0">
                  <span className="mt-0.5 shrink-0 rounded-md border border-(--s-line) bg-(--s-surface-2) px-1.5 font-montserrat text-[11px] text-(--s-faint) tabular-nums" dir="ltr">
                    #{row.row}
                  </span>
                  <div className="min-w-0 flex-1">
                    <b className="block truncate font-medium text-(--s-ink)" dir="auto">
                      {row.name.ar ?? row.name.en}
                    </b>
                    <small className="block text-xs text-(--s-muted)">
                      {t("sample.price")} <span className="tabular-nums">{number((row.salePiastres ?? row.listPiastres) / 100)}</span>
                      {" · "}
                      {t("sample.stock")} <span className="tabular-nums">{row.stock === null ? "—" : number(row.stock)}</span>
                      {" · "}
                      {t("sample.photos")} <span className="tabular-nums">{number(row.images.length)}</span>
                    </small>
                    <small className="block text-xs text-(--s-faint)">
                      {row.flagged ? t("sample.flagged") : needsAiCopy(row) ? t("sample.ai") : t("sample.fromFile")}
                    </small>
                  </div>
                </li>
              ))}
            </ul>
            <div className="overflow-x-auto rounded-2xl border border-(--s-line) bg-(--s-surface) max-[600px]:hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-(--s-surface-2) text-start">
                    <th className="p-2 text-start text-xs font-medium whitespace-nowrap text-(--s-muted)">{t("sample.row")}</th>
                    <th className="p-2 text-start text-xs font-medium whitespace-nowrap text-(--s-muted)">{t("sample.name")}</th>
                    <th className="p-2 text-start text-xs font-medium whitespace-nowrap text-(--s-muted)">{t("sample.price")}</th>
                    <th className="p-2 text-start text-xs font-medium whitespace-nowrap text-(--s-muted)">{t("sample.stock")}</th>
                    <th className="p-2 text-start text-xs font-medium whitespace-nowrap text-(--s-muted)">{t("sample.photos")}</th>
                    <th className="p-2 text-start text-xs font-medium whitespace-nowrap text-(--s-muted)">{t("sample.copy")}</th>
                  </tr>
                </thead>
                <tbody>
                  {toAdd.slice(0, 5).map((row) => (
                    <tr key={row.row} className="border-t border-(--s-line)">
                      <td className="p-2 tabular-nums">{number(row.row)}</td>
                      <td className="max-w-56 truncate p-2" dir="auto">
                        {row.name.ar ?? row.name.en}
                      </td>
                      <td className="p-2 tabular-nums">{number((row.salePiastres ?? row.listPiastres) / 100)}</td>
                      <td className="p-2 tabular-nums">{row.stock === null ? "—" : number(row.stock)}</td>
                      <td className="p-2 tabular-nums">{number(row.images.length)}</td>
                      <td className="p-2 text-xs whitespace-nowrap text-(--s-muted)">{row.flagged ? t("sample.flagged") : needsAiCopy(row) ? t("sample.ai") : t("sample.fromFile")}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            </>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2 border-t border-(--s-line) bg-(--s-surface-2) px-[18px] py-3.5 max-[600px]:p-3.5">
          <SellerButton type="button" onClick={start} disabled={!canAddProducts} className="max-[600px]:w-full">
            <Sparkles aria-hidden />
            {t("addAll", { count: number(toAdd.length) })}
          </SellerButton>
          <SellerButton type="button" variant="outline" onClick={reset} className="max-[600px]:w-full">
            {t("anotherFile")}
          </SellerButton>
        </div>
      </GenCard>
    </div>,
  );
}
