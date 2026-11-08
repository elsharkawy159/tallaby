"use client";

import { Check, FileSpreadsheet, Loader2, Package, Palette, RotateCcw, Sparkles, Truck, Undo2 } from "lucide-react";
import { useState, type ReactNode } from "react";
import { useLocale, useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import { SellerButton, TextAction, TextInput } from "@/components/seller-ui";
import type { BuilderFileProblem, BuilderProgress, BuilderView } from "@/app/(main)/ai-builder/builder.dto";
import { buildItemKeys, fileRowsToAdd } from "@/app/(main)/ai-builder/builder.lib";
import { buildChecklist } from "./workspace.lib";

/**
 * The cards between the messages (spec §10): the inline fix table for file
 * rows missing a price or stock (F-82f), the file drop zone, the summary with
 * "Build and publish", and the live build checklist.
 */

function Card({ children, className, label }: { children: ReactNode; className?: string; label?: string }) {
  return (
    <li className="ms-10 motion-safe:animate-[ai-fade-up_.3s_ease-out]">
      <section aria-label={label} className={cn("flex flex-col gap-3 rounded-[20px] border border-(--s-line) bg-(--s-surface) p-4 shadow-(--s-shadow-card)", className)}>
        {children}
      </section>
    </li>
  );
}

// ── The fix table ───────────────────────────────────────────────────────────

type RowPatch = { price?: string; stock?: number; unlimited?: boolean };

export function FileFixCard({ problems, busy, onFix }: { problems: BuilderFileProblem[]; busy: boolean; onFix: (row: number, patch: RowPatch) => Promise<boolean> }) {
  const t = useTranslations("aiBuilder");
  if (!problems.length) return null;
  return (
    <Card label={t("v2.fixRows", { count: problems.length })}>
      <p className="text-[13.5px] font-bold text-(--s-ink)">{t("v2.fixRows", { count: problems.length })}</p>
      <div className="overflow-hidden rounded-xl border border-(--s-line)">
        <table className="w-full border-collapse text-[13px]">
          <thead className="bg-(--s-tint) text-[12px] text-(--s-subtle)">
            <tr>
              <th scope="col" className="px-3 py-2 text-start font-semibold">{t("product.name")}</th>
              <th scope="col" className="px-2 py-2 text-start font-semibold">{t("product.price")}</th>
              <th scope="col" className="px-2 py-2 text-start font-semibold">{t("product.stock")}</th>
            </tr>
          </thead>
          <tbody>
            {problems.map((problem) => (
              <FixRow key={problem.row} problem={problem} busy={busy} onFix={onFix} />
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

function FixRow({ problem, busy, onFix }: { problem: BuilderFileProblem; busy: boolean; onFix: (row: number, patch: RowPatch) => Promise<boolean> }) {
  const t = useTranslations("aiBuilder");
  const [price, setPrice] = useState("");
  const [stock, setStock] = useState("");
  const [state, setState] = useState<"idle" | "saving" | "error">("idle");
  const save = async (patch: RowPatch) => {
    setState("saving");
    setState((await onFix(problem.row, patch)) ? "idle" : "error");
  };
  const needsPrice = problem.missing.includes("price");
  const needsStock = problem.missing.includes("stock");
  return (
    <tr className="border-t border-(--s-line-soft) align-middle">
      <th scope="row" className="max-w-0 px-3 py-1.5 text-start font-medium text-(--s-text)">
        <span className="block truncate" title={problem.name}>
          {problem.name}
        </span>
        {state === "error" && <span className="text-[11.5px] font-semibold text-destructive">{t("ws.fix.invalid")}</span>}
      </th>
      <td className="w-28 px-1.5 py-1.5">
        {needsPrice ? (
          <TextInput
            className="h-11 w-full"
            inputMode="decimal"
            value={price}
            placeholder={t("ws.fix.pricePlaceholder")}
            aria-label={t("ws.fix.priceFor", { name: problem.name })}
            disabled={busy || state === "saving"}
            onChange={(event) => setPrice(event.target.value)}
            onBlur={() => price.trim() && void save({ price: price.trim() })}
            onKeyDown={(event) => event.key === "Enter" && price.trim() && void save({ price: price.trim() })}
          />
        ) : (
          <Check className="size-4 text-(--s-primary)" aria-label={t("ws.fix.ok")} />
        )}
      </td>
      <td className="w-40 px-1.5 py-1.5">
        {needsStock ? (
          <div className="flex items-center gap-1">
            <TextInput
              className="h-11 w-16"
              inputMode="numeric"
              value={stock}
              placeholder="0"
              aria-label={t("ws.fix.stockFor", { name: problem.name })}
              disabled={busy || state === "saving"}
              onChange={(event) => setStock(event.target.value)}
              onBlur={() => {
                const value = Number(stock);
                if (stock.trim() && Number.isInteger(value) && value >= 0) void save({ stock: value });
              }}
            />
            <SellerButton variant="mini" size="xs" className="min-h-11" disabled={busy || state === "saving"} onClick={() => void save({ unlimited: true })}>
              {t("ws.fix.unlimited")}
            </SellerButton>
          </div>
        ) : (
          <Check className="size-4 text-(--s-primary)" aria-label={t("ws.fix.ok")} />
        )}
      </td>
    </tr>
  );
}

// ── The file drop zone ──────────────────────────────────────────────────────

export function FileDropCard({ busy, reading, error, onPick }: { busy: boolean; reading: boolean; error: string | null; onPick: (file: File) => void }) {
  const t = useTranslations("aiBuilder");
  const [over, setOver] = useState(false);
  return (
    <Card label={t("v2.uploadFile")}>
      <label
        onDragOver={(event) => {
          event.preventDefault();
          setOver(true);
        }}
        onDragLeave={() => setOver(false)}
        onDrop={(event) => {
          event.preventDefault();
          setOver(false);
          const file = event.dataTransfer.files[0];
          if (file) onPick(file);
        }}
        className={cn(
          "flex min-h-32 cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed px-4 py-6 text-center transition-colors focus-within:border-(--s-solid)",
          over ? "border-(--s-solid) bg-(--s-tint)" : "border-(--s-field)",
        )}
      >
        {reading ? <Loader2 className="size-6 animate-spin text-(--s-primary)" aria-hidden /> : <FileSpreadsheet className="size-6 text-(--s-primary)" aria-hidden />}
        <span className="text-[13.5px] font-bold text-(--s-ink)">{reading ? t("ws.chat.readingFile") : t("ws.products.drop")}</span>
        <span className="text-[12px] text-(--s-subtle)">{t("ws.products.fileHint")}</span>
        <input
          type="file"
          accept=".xlsx,.xls,.csv"
          className="sr-only"
          disabled={busy || reading}
          onChange={(event) => {
            const file = event.target.files?.[0];
            event.target.value = "";
            if (file) onPick(file);
          }}
        />
      </label>
      {error && <p className="text-[12.5px] font-semibold text-destructive">{error}</p>}
    </Card>
  );
}

// ── The summary ─────────────────────────────────────────────────────────────

export function SummaryCard({ view, busy, onBuild }: { view: BuilderView; busy: boolean; onBuild: () => void }) {
  const t = useTranslations("aiBuilder");
  const locale = useLocale();
  const { state } = view;
  const template = view.templates.find((item) => item.key === state.templateKey);
  const products = fileRowsToAdd(state.fileRows).length + state.products.length;
  const shipping =
    !state.shipping || state.shipping.mode === "skip"
      ? t("ws.summary.notSet")
      : state.shipping.mode === "text"
        ? state.shipping.text
        : state.shipping.template === "egypt_flat"
          ? t("ws.summary.flat", { price: state.shipping.price ?? 0 })
          : t(`chips.${state.shipping.template}`);
  const returns =
    !state.returns || state.returns.kind === "skip"
      ? t("ws.summary.notSet")
      : state.returns.kind === "days"
        ? t("returnsDays", { days: state.returns.days })
        : state.returns.kind === "none"
          ? t("chips.none")
          : state.returns.text;
  const rows: { icon: typeof Package; label: string; value: ReactNode }[] = [
    { icon: Sparkles, label: t("ws.summary.name"), value: state.name ?? "—" },
    { icon: Palette, label: t("ws.summary.design"), value: template ? ((locale === "en" ? template.name.en : template.name.ar) ?? template.key) : "—" },
    {
      icon: Palette,
      label: t("ws.summary.color"),
      value: state.primaryColor ? (
        <span className="inline-flex items-center gap-1.5">
          <span className="size-3.5 rounded-full ring-1 ring-black/10" style={{ backgroundColor: state.primaryColor }} aria-hidden />
          <span className="font-montserrat" dir="ltr">
            {state.primaryColor}
          </span>
        </span>
      ) : (
        t("ws.summary.templateColors")
      ),
    },
    { icon: Package, label: t("ws.summary.products"), value: products ? t("ws.summary.productsCount", { count: products }) : t("ws.summary.noProducts") },
    { icon: Truck, label: t("ws.summary.shipping"), value: shipping },
    { icon: Undo2, label: t("ws.summary.returns"), value: returns },
  ];
  return (
    <Card label={t("ws.summary.title")}>
      <h2 className="text-[15px] font-bold text-(--s-ink)">{t("ws.summary.title")}</h2>
      <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-2 text-[13.5px]">
        {rows.map((row) => (
          <div key={row.label} className="contents">
            <dt className="flex items-center gap-2 text-(--s-subtle)">
              <row.icon className="size-4" aria-hidden />
              {row.label}
            </dt>
            <dd className="min-w-0 truncate font-semibold text-(--s-text)">{row.value}</dd>
          </div>
        ))}
      </dl>
      <p className="text-[12.5px] leading-[1.7] text-(--s-subtle)">{t("ws.summary.consent")}</p>
      <SellerButton className="self-start max-[480px]:w-full" disabled={busy} onClick={onBuild}>
        {busy ? <Loader2 className="animate-spin" aria-hidden /> : <Sparkles aria-hidden />}
        {t("v2.buildAndPublish")}
      </SellerButton>
    </Card>
  );
}

// ── The build ───────────────────────────────────────────────────────────────

export function BuildProgressCard({ view, progress, error, onRetry }: { view: BuilderView; progress: BuilderProgress | null; error: string | null; onRetry: () => void }) {
  const t = useTranslations("aiBuilder");
  const keys = buildItemKeys(view.state);
  const rows = buildChecklist(keys, progress ? progress.current : keys[0]!, fileRowsToAdd(view.state.fileRows).length);
  const percent = progress?.total ? Math.round((progress.done / progress.total) * 100) : 0;
  return (
    <Card label={t("ws.progress.title")}>
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-[15px] font-bold text-(--s-ink)">{t("ws.progress.title")}</h2>
        <span className="font-montserrat text-[12.5px] font-bold text-(--s-subtle) tabular-nums">{percent}%</span>
      </div>
      <div
        className="h-1.5 overflow-hidden rounded-full bg-(--s-fill)"
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={percent}
        aria-label={t("ws.progress.title")}
      >
        <div className="h-full rounded-full bg-(--s-primary) transition-[width] duration-500" style={{ width: `${Math.max(4, percent)}%` }} />
      </div>
      <ul className="flex flex-col gap-1">
        {rows.map((row) => (
          <li key={row.phase} className="flex min-h-9 items-center gap-2.5 text-[13.5px]">
            <span
              className={cn(
                "grid size-5 shrink-0 place-items-center rounded-full",
                row.status === "done" ? "bg-(--s-primary) text-white" : row.status === "running" ? "text-(--s-primary)" : "ring-1 ring-(--s-field-strong)",
              )}
            >
              {row.status === "done" ? <Check className="size-3" aria-hidden /> : row.status === "running" ? <Loader2 className="size-4 animate-spin" aria-hidden /> : null}
            </span>
            <span className={cn("flex-1", row.status === "pending" ? "text-(--s-faint)" : "text-(--s-text)", row.status === "running" && "font-semibold")}>
              {t(`ws.progress.phases.${row.phase}`)}
              <span className="sr-only"> · {t(`ws.progress.status.${row.status}`)}</span>
            </span>
            {row.total ? (
              <span className="font-montserrat text-[12px] text-(--s-subtle) tabular-nums">{t("ws.progress.count", { done: row.done ?? 0, total: row.total })}</span>
            ) : null}
          </li>
        ))}
      </ul>
      <p className="text-[12px] text-(--s-faint)">{t("buildingResume")}</p>
      {error && (
        <div className="flex flex-wrap items-center gap-2 rounded-xl bg-destructive-soft px-3 py-2 text-[12.5px] text-destructive">
          <span className="flex-1">{error}</span>
          <TextAction onClick={onRetry}>
            <RotateCcw aria-hidden />
            {t("retry")}
          </TextAction>
        </div>
      )}
    </Card>
  );
}


