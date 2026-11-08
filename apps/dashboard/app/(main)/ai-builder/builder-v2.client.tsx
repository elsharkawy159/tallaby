"use client";

import { ArrowRight, FileSpreadsheet, ImagePlus, Loader2, Sparkles } from "lucide-react";
import { useRef, useState, type ReactNode } from "react";
import { useLocale, useTranslations } from "next-intl";
import { dominantColorsFromPixels } from "@workspace/store-sections/logo-colors";
import { Note, PageHeader, SellerButton, SellerCard, Tag, TextAction, TextArea, TextInput } from "@/components/seller-ui";
import { STORE_INDUSTRIES } from "@/lib/stores/industries.lib";
import { readSheetFile } from "@/app/(main)/products/add/from-file/from-file-parse.client";
import { updateBuildFileRow } from "./builder.actions";
import { BUILDER_LIMITS, type BuilderAnswerValue, type BuilderErrorCode, type BuilderQuestion, type BuilderQuestionOption, type BuilderView } from "./builder.dto";

/**
 * A minimal client for the v2 question cards (ROADMAP.md F-82e) until the chat
 * UI v2 (F-82i) replaces it: messages, the card, the file uploader and the
 * inline fix table, and a composer for free-text edits. Every text is an i18n
 * key; the server decides what is asked.
 */

type Send = (body: unknown) => Promise<boolean>;

/** The logo's 3 main colours, read on a canvas (no model). */
async function logoColorsOf(file: File): Promise<string[]> {
  const url = URL.createObjectURL(file);
  try {
    const image = await new Promise<HTMLImageElement>((resolve, reject) => {
      const img = new window.Image();
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error("image"));
      img.src = url;
    });
    const side = 64;
    const canvas = document.createElement("canvas");
    canvas.width = side;
    canvas.height = side;
    const context = canvas.getContext("2d");
    if (!context) return [];
    context.drawImage(image, 0, 0, side, side);
    return dominantColorsFromPixels(context.getImageData(0, 0, side, side).data).slice(0, 3);
  } catch {
    return [];
  } finally {
    URL.revokeObjectURL(url);
  }
}

export function BuilderV2Chat({
  view,
  busy,
  error,
  send,
  setView,
  onUploadLogo,
  onRestart,
  products,
  templatesBaseUrl,
}: {
  view: BuilderView;
  busy: boolean;
  error: BuilderErrorCode | null;
  send: Send;
  setView: (view: BuilderView) => void;
  onUploadLogo: (file: File) => Promise<void>;
  onRestart: () => void;
  /** The v1 product form, for "add by photos" and "type a few". */
  products: ReactNode;
  templatesBaseUrl: string;
}) {
  const t = useTranslations("aiBuilder");
  const locale = useLocale();
  const [answers, setAnswers] = useState<Record<string, BuilderAnswerValue>>({});
  const [text, setText] = useState("");
  const [fileError, setFileError] = useState<string | null>(null);
  const logoInput = useRef<HTMLInputElement>(null);
  const fileInput = useRef<HTMLInputElement>(null);
  const { card, state } = view;

  const set = (id: string, value: BuilderAnswerValue) => setAnswers((current) => ({ ...current, [id]: { ...current[id], ...value } }));
  const submit = async () => {
    const ok = await send({ action: "answers", answers });
    if (ok) setAnswers({});
  };

  const optionLabel = (question: BuilderQuestion, option: BuilderQuestionOption) => {
    if (option.label) return option.label;
    if (option.key) return t(`v2.options.${option.key}` as never, option.params as never);
    if (question.id === "industry") {
      const industry = STORE_INDUSTRIES.find((i) => i.id === option.value);
      if (industry) return locale === "en" ? industry.en : industry.ar;
    }
    const template = view.templates.find((item) => item.key === option.value);
    if (template) return (locale === "en" ? template.name.en : template.name.ar) ?? option.value;
    return option.value;
  };

  const readFile = async (file: File) => {
    setFileError(null);
    try {
      const { model } = await readSheetFile(file, await file.arrayBuffer());
      await send({
        action: "attachFile",
        headers: model.headers.slice(0, 40).map((header) => header.slice(0, 80)),
        rows: model.rows.slice(0, 500).map((row) => ({ row: row.row, cells: row.cells.slice(0, 40).map((cell) => cell.slice(0, 2000)) })),
      });
    } catch {
      setFileError(t("v2.fileUnreadable"));
    }
  };

  const fixRow = async (row: number, patch: { price?: string; stock?: number; unlimited?: boolean }) => {
    const result = await updateBuildFileRow(view.id, row, patch);
    if (result.ok) setView(result.view);
  };

  return (
    <>
      <PageHeader
        title={t("title")}
        actions={
          <SellerButton variant="mini" size="sm" onClick={onRestart} disabled={busy}>
            {t("restart")}
          </SellerButton>
        }
      />
      <SellerCard className="flex flex-col gap-4 p-5 max-[720px]:p-4">
        <ol className="flex flex-col gap-3" aria-live="polite">
          {state.messages.map((message, index) =>
            message.role === "assistant" ? (
              <li key={index} className="max-w-[85%] self-start rounded-[16px] bg-(--s-tint) px-3.5 py-2.5 text-[13.5px] leading-[1.7] text-(--s-text)">
                {t.has(message.key as never) ? t(message.key as never, message.params as never) : t.has(`q.${message.key}` as never) ? t(`q.${message.key}` as never) : ""}
              </li>
            ) : (
              <li key={index} className="max-w-[85%] self-end whitespace-pre-wrap rounded-[16px] bg-(--s-solid) px-3.5 py-2.5 text-[13.5px] leading-[1.7] text-(--s-solid-fg)">
                {message.text.startsWith("card:") || message.text.startsWith("chip:") ? t("v2.answered") : message.text}
              </li>
            ),
          )}
        </ol>

        {card?.round === "brand" && !state.logo && (
          <div>
            <input
              ref={logoInput}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              onChange={async (event) => {
                const file = event.target.files?.[0];
                event.target.value = "";
                if (!file) return;
                const colors = await logoColorsOf(file);
                await onUploadLogo(file);
                if (colors.length) await send({ action: "logoColors", colors });
              }}
            />
            <SellerButton variant="outline" size="sm" disabled={busy} onClick={() => logoInput.current?.click()}>
              <ImagePlus aria-hidden />
              {t("logoUpload")}
            </SellerButton>
          </div>
        )}

        {card?.round === "products" && state.productsChoice === "file" && !state.fileRows.length && (
          <div className="flex flex-col gap-2">
            <input
              ref={fileInput}
              type="file"
              accept=".xlsx,.xls,.csv"
              className="hidden"
              onChange={(event) => {
                const file = event.target.files?.[0];
                event.target.value = "";
                if (file) void readFile(file);
              }}
            />
            <SellerButton className="self-start" disabled={busy} onClick={() => fileInput.current?.click()}>
              <FileSpreadsheet aria-hidden />
              {t("v2.uploadFile")}
            </SellerButton>
            {fileError && <Note tone="danger">{fileError}</Note>}
          </div>
        )}
        {card?.round === "products" && (state.productsChoice === "photos" || state.productsChoice === "type") && products}

        {card?.round === "products" && view.fileProblems.length > 0 && (
          <div className="flex flex-col gap-2 rounded-2xl border border-(--s-line) bg-(--s-surface) p-3.5 text-[13.5px]">
            <p className="font-medium text-(--s-ink)">{t("v2.fixRows", { count: view.fileProblems.length })}</p>
            {view.fileProblems.map((problem) => (
              <div key={problem.row} className="flex flex-wrap items-center gap-2">
                <span className="min-w-0 flex-1 truncate">{problem.name}</span>
                {problem.missing.includes("price") && (
                  <TextInput
                    className="w-28"
                    inputMode="decimal"
                    placeholder={t("product.price")}
                    aria-label={t("product.price")}
                    onBlur={(event) => event.target.value.trim() && void fixRow(problem.row, { price: event.target.value.trim() })}
                  />
                )}
                {problem.missing.includes("stock") && (
                  <>
                    <TextInput
                      className="w-24"
                      inputMode="numeric"
                      placeholder={t("product.stock")}
                      aria-label={t("product.stock")}
                      onBlur={(event) => {
                        const stock = Number(event.target.value);
                        if (event.target.value.trim() && Number.isInteger(stock) && stock >= 0) void fixRow(problem.row, { stock });
                      }}
                    />
                    <SellerButton variant="mini" size="sm" disabled={busy} onClick={() => void fixRow(problem.row, { unlimited: true })}>
                      {t("product.unlimited")}
                    </SellerButton>
                  </>
                )}
              </div>
            ))}
          </div>
        )}

        {card && card.questions.length > 0 && (
          <div className="flex flex-col gap-4 rounded-2xl border border-(--s-line) bg-(--s-surface) p-4 text-[13.5px] text-(--s-body)">
            {card.questions.map((question) => {
              const answer = answers[question.id] ?? {};
              const chosen = (value: string) => (question.kind === "multi" ? (answer.choices ?? []).includes(value) : answer.choice === value);
              const pick = (value: string) => {
                if (question.kind === "multi") {
                  const current = answer.choices ?? [];
                  const next = current.includes(value) ? current.filter((v) => v !== value) : [...current, value].slice(0, question.maxChoices ?? 6);
                  set(question.id, { choices: next, skip: undefined });
                } else set(question.id, { choice: value, skip: undefined });
              };
              return (
                <fieldset key={question.id} className="flex flex-col gap-2">
                  <legend className="mb-1 font-medium text-(--s-ink)">{t(`v2.questions.${question.key}` as never)}</legend>
                  {question.kind === "templates" ? (
                    <div className="grid grid-cols-3 gap-2.5 max-[720px]:grid-cols-1">
                      {question.options.map((option) => {
                        const template = view.templates.find((item) => item.key === option.value);
                        return (
                          <div key={option.value} className="flex flex-col gap-2 rounded-2xl border border-(--s-line) p-3.5">
                            <div className="flex items-center gap-2 font-bold text-(--s-ink)">
                              {optionLabel(question, option)}
                              {option.recommended && <Tag tone="warning">{t("recommended")}</Tag>}
                            </div>
                            {template && <p className="line-clamp-3 text-xs text-(--s-subtle)">{locale === "en" ? template.description.en : template.description.ar}</p>}
                            <TextAction asChild className="min-h-10 self-start">
                              <a href={`${templatesBaseUrl}/${option.value}`} target="_blank" rel="noreferrer">
                                {t("templatePreview")}
                              </a>
                            </TextAction>
                            <SellerButton variant={chosen(option.value) ? "solid" : "outline"} size="sm" className="mt-auto" disabled={busy} onClick={() => pick(option.value)}>
                              {t("templateUse")}
                            </SellerButton>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {question.options.map((option) => (
                        <SellerButton key={option.value} variant={chosen(option.value) ? "solid" : "mini"} size="sm" disabled={busy} onClick={() => pick(option.value)}>
                          {option.color && <span className="size-4 rounded-full border border-(--s-line)" style={{ backgroundColor: option.color }} />}
                          {optionLabel(question, option)}
                          {option.recommended && <Tag tone="warning">{t("recommended")}</Tag>}
                        </SellerButton>
                      ))}
                      {question.optional && (
                        <SellerButton variant={answer.skip ? "solid" : "mini"} size="sm" disabled={busy} onClick={() => setAnswers((current) => ({ ...current, [question.id]: { skip: true } }))}>
                          {t("chips.skip")}
                        </SellerButton>
                      )}
                    </div>
                  )}
                  {(question.allowOther || question.options.some((option) => option.needsText && chosen(option.value))) && (
                    <TextInput
                      value={answer.text ?? ""}
                      type={question.kind === "color" ? "color" : "text"}
                      className={question.kind === "color" ? "h-10 w-16 p-1" : undefined}
                      maxLength={BUILDER_LIMITS.textMax}
                      placeholder={t.has(`v2.placeholders.${question.id}` as never) ? t(`v2.placeholders.${question.id}` as never) : undefined}
                      aria-label={t(`v2.questions.${question.key}` as never)}
                      onChange={(event) => set(question.id, { text: event.target.value, skip: undefined, ...(question.kind === "color" ? { choice: undefined } : {}) })}
                    />
                  )}
                </fieldset>
              );
            })}
            <div className="flex flex-wrap items-center gap-2">
              <SellerButton disabled={busy || !Object.keys(answers).length} onClick={() => void submit()}>
                {busy ? <Loader2 className="animate-spin" aria-hidden /> : <Sparkles aria-hidden />}
                {card.round === "summary" ? t("v2.buildAndPublish") : t("v2.sendCard")}
              </SellerButton>
              {card.round === "design" && view.moreTemplates && (
                <SellerButton variant="outline" size="sm" disabled={busy} onClick={() => void send({ action: "moreTemplates" })}>
                  {t("v2.moreTemplates")}
                </SellerButton>
              )}
            </div>
          </div>
        )}

        {error && <Note tone="danger">{t(`errors.${error}`)}</Note>}

        {card?.round !== "describe" && (
          <form
            className="flex items-end gap-2"
            onSubmit={async (event) => {
              event.preventDefault();
              if (!text.trim() || busy) return;
              if (await send({ action: "edit", text })) setText("");
            }}
          >
            <TextArea
              className="min-h-[46px] flex-1"
              value={text}
              rows={2}
              maxLength={BUILDER_LIMITS.textMax}
              placeholder={t("v2.placeholders.edit")}
              aria-label={t("answer")}
              onChange={(event) => setText(event.target.value)}
            />
            <SellerButton type="submit" className="w-[46px] px-0" disabled={busy || !text.trim()} aria-label={t("send")}>
              {busy ? <Loader2 className="animate-spin" aria-hidden /> : <ArrowRight className="rtl:rotate-180" aria-hidden />}
            </SellerButton>
          </form>
        )}
      </SellerCard>
    </>
  );
}
