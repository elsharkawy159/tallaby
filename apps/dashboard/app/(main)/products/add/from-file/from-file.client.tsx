"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { useDropzone } from "react-dropzone";
import { CircleAlert, CircleCheck, Download, FileSpreadsheet, LoaderCircle, RotateCcw, Sparkles, Upload } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@workspace/ui/components/alert";
import { Button } from "@workspace/ui/components/button";
import { Progress } from "@workspace/ui/components/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@workspace/ui/components/select";
import { cn } from "@workspace/ui/lib/utils";
import { formatNumber } from "@/lib/i18n/format";
import { downloadXlsx, todayStamp } from "@/lib/product-excel";
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

function Tile({ label, value, tone }: { label: string; value: string; tone?: "good" | "warn" | "bad" }) {
  return (
    <div className="rounded-lg border bg-card p-3">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div
        className={cn(
          "mt-1 text-2xl font-semibold tabular-nums",
          tone === "good" && "text-emerald-600 dark:text-emerald-400",
          tone === "warn" && "text-amber-600 dark:text-amber-400",
          tone === "bad" && "text-destructive",
        )}
      >
        {value}
      </div>
    </div>
  );
}

const NONE = "none";

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

  const readFile = async (picked: File) => {
    setReadError(null);
    try {
      checkPickedFile(picked);
      setStage("reading");
      const buffer = await picked.arrayBuffer();
      const key = await hashFile(buffer);
      const loaded = await getBulkStatusAction();
      if (loaded.ok) setStatus(loaded);

      if (isPdfFile(picked)) {
        const read = await readPdfRows(picked, buffer, setPdfProgress);
        setFile({ name: picked.name, bytes: picked.size, key, source: "pdf", sheetCount: 1 });
        setPdfRows(read);
        setStage("confirm");
        return;
      }

      const sheet = await readSheetFile(picked, buffer);
      const mapped = await mapColumnsAction({
        fileBytes: picked.size,
        totalRows: sheet.model.rows.length,
        columns: columnSamples(sheet.model),
      });
      if (!mapped.ok) throw new PdfReadFailure(mapped.error);
      setFile({ name: picked.name, bytes: picked.size, key, source: "sheet", sheetCount: sheet.sheetCount });
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

  if (stage === "pick") {
    return (
      <div className="flex flex-col gap-4">
        {!aiEnabled && (
          <Alert>
            <CircleAlert />
            <AlertDescription>{t("aiOff")}</AlertDescription>
          </Alert>
        )}
        <div
          {...dropzone.getRootProps()}
          className={cn(
            "flex cursor-pointer flex-col items-center gap-3 rounded-xl border-2 border-dashed p-10 text-center transition-colors hover:bg-muted/50 focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:outline-none",
            dropzone.isDragActive && "border-primary bg-primary/5",
          )}
        >
          <input {...dropzone.getInputProps()} accept={ACCEPTED_FILE_TYPES} aria-label={t("pickButton")} />
          <FileSpreadsheet className="size-10 text-muted-foreground" aria-hidden />
          <div className="font-medium">{t("pickTitle")}</div>
          <p className="max-w-md text-sm text-muted-foreground">{t("pickBody")}</p>
          <Button type="button" variant="default" className="mt-1">
            <Upload aria-hidden />
            {t("pickButton")}
          </Button>
          <p className="text-xs text-muted-foreground">
            {t("limits", { bytes: BULK_LIMITS.maxFileBytes / (1024 * 1024), products: BULK_LIMITS.maxProducts, pages: BULK_LIMITS.maxPdfPages })}
          </p>
        </div>
        {readError && (
          <Alert variant="destructive">
            <CircleAlert />
            <AlertDescription>{readError}</AlertDescription>
          </Alert>
        )}
      </div>
    );
  }

  if (stage === "reading") {
    return (
      <div className="flex flex-col items-center gap-3 rounded-xl border p-10 text-center" role="status">
        <LoaderCircle className="size-8 animate-spin text-primary" aria-hidden />
        <div className="font-medium">{pdfProgress ? t("readingPdf") : t("reading")}</div>
        {pdfProgress && <Progress value={(pdfProgress.doneCalls / Math.max(1, pdfProgress.totalCalls)) * 100} className="h-2 w-64 max-w-full" />}
      </div>
    );
  }

  if (stage === "running") {
    const done = processed;
    return (
      <div className="flex flex-col gap-4 rounded-xl border p-6">
        <div className="flex items-center gap-2 font-medium">
          <LoaderCircle className="size-5 animate-spin text-primary" aria-hidden />
          {t("running")}
        </div>
        <Progress value={(done / Math.max(1, total)) * 100} className="h-3" aria-label={t("running")} />
        <div className="text-sm text-muted-foreground tabular-nums">{t("runningCount", { done: number(done), total: number(total) })}</div>
        <p className="text-xs text-muted-foreground">{t("runningNote")}</p>
      </div>
    );
  }

  if (stage === "done") {
    const live = count("live");
    const draft = count("draft");
    return (
      <div className="flex flex-col gap-4">
        <Alert variant={stop || pausedOn ? "default" : undefined}>
          {stop || pausedOn ? <CircleAlert /> : <CircleCheck />}
          <AlertTitle>{stop ? t(`stopped.${stop}.title`) : pausedOn ? t("paused.title") : t("doneTitle")}</AlertTitle>
          {(stop || pausedOn) && (
            <AlertDescription>
              {stop ? t(`stopped.${stop}.body`, { remaining: number(remaining) }) : t("paused.body", { remaining: number(remaining), reason: t(`errors.${pausedOn!}`) })}
            </AlertDescription>
          )}
        </Alert>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Tile label={t("result.live")} value={number(live)} tone="good" />
          <Tile label={t("result.drafts")} value={number(draft)} tone={draft ? "warn" : undefined} />
          <Tile label={t("result.skipped")} value={number(skipped.length + count("already"))} tone={skipped.length ? "bad" : undefined} />
          <Tile label={t("result.credits")} value={number(creditsUsed)} />
        </div>

        {count("already") > 0 && <p className="text-sm text-muted-foreground">{t("result.already", { count: number(count("already")) })}</p>}

        {noteCounts.length > 0 && (
          <div className="rounded-lg border p-3 text-sm">
            <div className="mb-1 font-medium">{t("result.notesTitle")}</div>
            <ul className="list-inside list-disc space-y-0.5 text-muted-foreground">
              {noteCounts.map(([note, total]) => (
                <li key={note}>{t(`notes.${note}`, { count: number(total) })}</li>
              ))}
            </ul>
          </div>
        )}

        {toCheck.length > 0 && (
          <div className="rounded-lg border border-amber-500/50 p-3 text-sm">
            <div className="mb-1 font-medium">{t("check.title")}</div>
            <p className="mb-2 text-xs text-muted-foreground">{t("check.body")}</p>
            <ul className="max-h-72 space-y-1.5 overflow-auto">
              {toCheck.slice(0, 100).map((result) => (
                <li key={result.row} className="flex flex-wrap items-center justify-between gap-x-3 gap-y-0.5">
                  <span className="min-w-0 truncate" dir="auto">
                    {result.title}
                  </span>
                  <span className="flex shrink-0 items-center gap-3 text-xs text-muted-foreground">
                    {result.categoryName && <span dir="auto">{result.categoryName}</span>}
                    <Link href={`/products/${result.productId}/edit`} target="_blank" className="font-medium text-primary underline underline-offset-2">
                      {t("check.fix")}
                    </Link>
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {skipped.length > 0 && (
          <div className="rounded-lg border p-3 text-sm">
            <div className="mb-1 font-medium">{t("problemsTitle")}</div>
            <ul className="max-h-48 space-y-0.5 overflow-auto text-muted-foreground">
              {skipped.slice(0, 100).map(({ row, reason }) => (
                <li key={`${row}-${reason}`}>{t("problemLine", { row: number(row), reason })}</li>
              ))}
            </ul>
          </div>
        )}

        <div className="flex flex-wrap gap-2">
          {(stop || pausedOn) && remaining > 0 && (
            <Button onClick={() => void run()}>
              <RotateCcw aria-hidden />
              {t("continue", { count: number(remaining) })}
            </Button>
          )}
          {stop === "noCredits" && (
            <Button asChild variant="outline">
              <Link href="/settings/plan" target="_blank">
                {t("getCredits")}
              </Link>
            </Button>
          )}
          <Button asChild variant={stop || pausedOn ? "outline" : "default"}>
            <Link href="/products">{t("viewProducts")}</Link>
          </Button>
          {(skipped.length > 0 || remaining > 0) && (
            <Button variant="outline" onClick={() => void downloadSkipped()}>
              <Download aria-hidden />
              {t("downloadProblems")}
            </Button>
          )}
          <Button variant="ghost" onClick={reset}>
            {t("anotherFile")}
          </Button>
        </div>
      </div>
    );
  }

  // Confirm
  const hasName = !model || (mapping && (mapping.name !== null || mapping.nameAr !== null || mapping.nameEn !== null));
  const hasPrice = !model || (mapping && (mapping.price !== null || mapping.salePrice !== null));
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
        <div className="flex min-w-0 items-center gap-2">
          <FileSpreadsheet className="size-4 shrink-0 text-muted-foreground" aria-hidden />
          <span className="truncate font-medium" dir="auto">
            {file?.name}
          </span>
        </div>
        <Button variant="ghost" size="sm" onClick={reset}>
          {t("anotherFile")}
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Tile label={t("found")} value={number(summary.found)} />
        <Tile label={t("ready")} value={number(toAdd.length)} tone="good" />
        <Tile label={t("problemsCount")} value={number(summary.problems.length)} tone={summary.problems.length ? "bad" : undefined} />
        <Tile label={t("willBeDrafts")} value={number(drafts)} tone={drafts ? "warn" : undefined} />
      </div>

      {file && file.sheetCount > 1 && <p className="text-xs text-muted-foreground">{t("firstSheetOnly")}</p>}
      {alreadyAdded > 0 && <p className="text-sm text-muted-foreground">{t("alreadyAdded", { count: number(alreadyAdded) })}</p>}
      {drafts > 0 && <p className="text-sm text-muted-foreground">{t("draftsNote")}</p>}
      {model && mapping && mapping.cost !== null && <p className="text-sm text-muted-foreground">{t("costNotSaved")}</p>}
      {variantLikeRows > 0 && <p className="text-sm text-amber-700 dark:text-amber-400">{t("variantRowsWarning", { count: number(variantLikeRows) })}</p>}

      {(!hasName || !hasPrice) && (
        <Alert variant="destructive">
          <CircleAlert />
          <AlertDescription>{t("mappingNeeded")}</AlertDescription>
        </Alert>
      )}

      <div className="flex items-start gap-2 rounded-lg border bg-muted/30 p-3 text-sm">
        <Sparkles className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden />
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
        <details className="rounded-lg border p-3 text-sm">
          <summary className="cursor-pointer font-medium">{t("problemsTitle")}</summary>
          <ul className="mt-2 max-h-48 space-y-0.5 overflow-auto text-muted-foreground">
            {summary.problems.slice(0, 100).map(({ row, problem }) => (
              <li key={`${row}-${problem}`}>{t("problemLine", { row: number(row), reason: t(`problems.${problem}`) })}</li>
            ))}
          </ul>
        </details>
      )}

      {model && mapping && (
        <details className="rounded-lg border p-3" open={mappingSource === "fallback" || !hasName || !hasPrice}>
          <summary className="cursor-pointer text-sm font-medium">{t("mappingTitle")}</summary>
          {mappingSource && <p className="mt-2 text-xs text-muted-foreground">{t(`mappingSource.${mappingSource}`)}</p>}
          <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {[...REVIEWED_FIELDS, ...OTHER_FIELDS].map((field) => (
              <FieldSelect key={field} field={field} mapping={mapping} model={model} onChange={changeMapping} />
            ))}
          </div>
        </details>
      )}

      {toAdd.length > 0 && (
        <div className="overflow-x-auto rounded-lg border">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-muted text-start">
                <th className="p-2 text-start font-medium">{t("sample.row")}</th>
                <th className="p-2 text-start font-medium">{t("sample.name")}</th>
                <th className="p-2 text-start font-medium">{t("sample.price")}</th>
                <th className="p-2 text-start font-medium">{t("sample.stock")}</th>
                <th className="p-2 text-start font-medium">{t("sample.photos")}</th>
                <th className="p-2 text-start font-medium">{t("sample.copy")}</th>
              </tr>
            </thead>
            <tbody>
              {toAdd.slice(0, 5).map((row) => (
                <tr key={row.row} className="border-t">
                  <td className="p-2 tabular-nums">{number(row.row)}</td>
                  <td className="max-w-56 truncate p-2" dir="auto">
                    {row.name.ar ?? row.name.en}
                  </td>
                  <td className="p-2 tabular-nums">{number((row.salePiastres ?? row.listPiastres) / 100)}</td>
                  <td className="p-2 tabular-nums">{row.stock === null ? "—" : number(row.stock)}</td>
                  <td className="p-2 tabular-nums">{number(row.images.length)}</td>
                  <td className="p-2 text-xs text-muted-foreground">{row.flagged ? t("sample.flagged") : needsAiCopy(row) ? t("sample.ai") : t("sample.fromFile")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div>
        <Button size="lg" onClick={start} disabled={!canAddProducts}>
          <Sparkles aria-hidden />
          {t("addAll", { count: number(toAdd.length) })}
        </Button>
      </div>
    </div>
  );
}
