"use client";

import { Check, Eye, Loader2, Palette, Sparkles } from "lucide-react";
import { useEffect, useId, useRef, useState, type KeyboardEvent } from "react";
import { useLocale, useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import { SellerButton, Tag, TextArea, TextInput } from "@/components/seller-ui";
import { BUILDER_LIMITS, type BuilderAnswerValue, type BuilderQuestion, type BuilderQuestionCard, type BuilderQuestionOption, type BuilderView } from "@/app/(main)/ai-builder/builder.dto";
import { buildCardAnswers, normalizeHex, pickOption } from "./workspace.lib";

/**
 * One question card (spec §4.3, §10, §15): up to 3 questions answered with one
 * Send. Chips with a "recommended" tag, "Other…" text, a colour picker, the
 * template choice (synced with the preview pane) and Skip where the server
 * allows it. Keyboard: arrows move between chips, Enter/Space picks; every
 * target is at least 44 px.
 */

export type OptionLabel = (question: BuilderQuestion, option: BuilderQuestionOption) => string;

const OTHER_VALUE = "other";

/** Brand swatches offered beside the logo's own colours. */
export const BRAND_SWATCHES = ["#145163", "#1e5bb8", "#0f766e", "#15803d", "#b45309", "#b91c1c", "#be185d", "#7c3aed", "#111827", "#a16207"] as const;

const chipClass =
  "inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-full border border-(--s-field) bg-(--s-surface) px-4 text-[13.5px] font-semibold text-(--s-body) transition-colors duration-150 hover:border-(--tallaby-teal-300) aria-checked:border-(--s-solid) aria-checked:bg-(--s-solid) aria-checked:text-(--s-solid-fg) aria-pressed:border-(--s-solid) aria-pressed:bg-(--s-solid) aria-pressed:text-(--s-solid-fg) disabled:cursor-default disabled:opacity-50";

/** Arrow keys move focus between the chips of a group (both directions), Home/End to the ends. */
function moveFocus(event: KeyboardEvent<HTMLElement>) {
  const keys = ["ArrowRight", "ArrowLeft", "ArrowDown", "ArrowUp", "Home", "End"];
  if (!keys.includes(event.key)) return;
  const items = Array.from(event.currentTarget.querySelectorAll<HTMLButtonElement>("[data-chip]:not(:disabled)"));
  const at = items.indexOf(document.activeElement as HTMLButtonElement);
  if (at < 0 || !items.length) return;
  event.preventDefault();
  const rtl = getComputedStyle(event.currentTarget).direction === "rtl";
  const forward = event.key === "ArrowDown" || (event.key === "ArrowRight" && !rtl) || (event.key === "ArrowLeft" && rtl);
  const next = event.key === "Home" ? 0 : event.key === "End" ? items.length - 1 : (at + (forward ? 1 : -1) + items.length) % items.length;
  items[next]!.focus();
}

export function QuestionCard({
  view,
  card,
  draft,
  onDraft,
  busy,
  onSend,
  optionLabel,
  focusSignal,
  previewTemplate,
  onPreviewTemplate,
  onMoreTemplates,
}: {
  view: BuilderView;
  card: BuilderQuestionCard;
  draft: Record<string, BuilderAnswerValue>;
  onDraft: (id: string, value: BuilderAnswerValue | undefined) => void;
  busy: boolean;
  onSend: (answers: Record<string, BuilderAnswerValue>) => void;
  optionLabel: OptionLabel;
  /** Bumped after the seller sends something: the new card takes focus. */
  focusSignal: number;
  previewTemplate: string | null;
  onPreviewTemplate: (key: string) => void;
  onMoreTemplates: () => void;
}) {
  const t = useTranslations("aiBuilder");
  const heading = useRef<HTMLHeadingElement>(null);
  const titleId = useId();
  const { answers, missing } = buildCardAnswers(card.questions, draft);

  useEffect(() => {
    if (focusSignal > 0) heading.current?.focus();
  }, [focusSignal, card.round, card.questions.length]);

  return (
    <li className="ms-10 motion-safe:animate-[ai-fade-up_.3s_ease-out]">
      <section aria-labelledby={titleId} className="flex flex-col gap-5 rounded-[20px] border border-(--s-line) bg-(--s-surface) p-4 shadow-(--s-shadow-card)">
        <h2 id={titleId} ref={heading} tabIndex={-1} className="sr-only">
          {t(`ws.rounds.${card.round}`)}
        </h2>
        {card.questions.map((question) => (
          <QuestionField
            key={question.id}
            view={view}
            question={question}
            value={draft[question.id]}
            onChange={(value) => onDraft(question.id, value)}
            busy={busy}
            optionLabel={optionLabel}
            previewTemplate={previewTemplate}
            onPreviewTemplate={onPreviewTemplate}
          />
        ))}
        <div className="flex flex-wrap items-center gap-2 border-t border-(--s-line-soft) pt-4">
          <SellerButton disabled={busy || missing.length > 0} onClick={() => onSend(answers)}>
            {busy ? <Loader2 className="animate-spin" aria-hidden /> : <Sparkles aria-hidden />}
            {t("v2.sendCard")}
          </SellerButton>
          {card.round === "design" && view.moreTemplates && (
            <SellerButton variant="mini" size="sm" className="min-h-11" disabled={busy} onClick={onMoreTemplates}>
              {t("v2.moreTemplates")}
            </SellerButton>
          )}
          {missing.length > 0 && card.questions.length > 1 && <span className="text-[12px] text-(--s-subtle)">{t("ws.card.missing", { count: missing.length })}</span>}
        </div>
      </section>
    </li>
  );
}

function QuestionField({
  view,
  question,
  value,
  onChange,
  busy,
  optionLabel,
  previewTemplate,
  onPreviewTemplate,
}: {
  view: BuilderView;
  question: BuilderQuestion;
  value: BuilderAnswerValue | undefined;
  onChange: (value: BuilderAnswerValue | undefined) => void;
  busy: boolean;
  optionLabel: OptionLabel;
  previewTemplate: string | null;
  onPreviewTemplate: (key: string) => void;
}) {
  const t = useTranslations("aiBuilder");
  const locale = useLocale();
  const legend = t(`v2.questions.${question.key}` as never);
  const placeholder = t.has(`v2.placeholders.${question.id}` as never) ? t(`v2.placeholders.${question.id}` as never) : t("ws.card.otherPlaceholder");
  const chosenOption = question.options.find((option) => option.value === value?.choice);
  const [otherOpen, setOtherOpen] = useState(Boolean(value?.text) && !chosenOption);
  const multi = question.kind === "multi";
  const selected = (option: string) => (multi ? (value?.choices ?? []).includes(option) : value?.choice === option);
  const textInput = question.options.length === 0 || otherOpen || Boolean(chosenOption?.needsText);
  const keepsChoice = Boolean(chosenOption?.needsText) || chosenOption?.value === OTHER_VALUE;
  const setText = (text: string) => onChange({ ...(keepsChoice && chosenOption ? { choice: chosenOption.value } : {}), text });

  if (question.kind === "templates") {
    return (
      <fieldset className="flex flex-col gap-2.5">
        <legend className="mb-2 text-[14px] font-bold text-(--s-ink)">{legend}</legend>
        <div role="radiogroup" aria-label={legend} className="flex flex-col gap-2" onKeyDown={moveFocus}>
          {question.options.map((option) => {
            const template = view.templates.find((item) => item.key === option.value);
            const on = selected(option.value);
            return (
              <div
                key={option.value}
                className={cn(
                  "flex items-center gap-3 rounded-2xl border p-2.5 transition-colors",
                  on ? "border-(--s-solid) bg-(--s-tint)" : "border-(--s-line)",
                  previewTemplate === option.value && !on && "border-(--tallaby-teal-300)",
                )}
              >
                <button
                  type="button"
                  role="radio"
                  data-chip
                  aria-checked={on}
                  disabled={busy}
                  onClick={() => {
                    onChange(pickOption(question, value, option.value));
                    onPreviewTemplate(option.value);
                  }}
                  className="flex min-h-11 min-w-0 flex-1 cursor-pointer items-center gap-3 rounded-xl text-start"
                >
                  <span className={cn("grid size-5 shrink-0 place-items-center rounded-full border-2", on ? "border-(--s-solid) bg-(--s-solid) text-(--s-solid-fg)" : "border-(--s-field-strong)")}>
                    {on && <Check className="size-3" aria-hidden />}
                  </span>
                  <span className="flex shrink-0 -space-x-1 rtl:space-x-reverse" aria-hidden>
                    {(template?.palette ?? []).slice(0, 4).map((color) => (
                      <span key={color} className="size-4 rounded-full ring-2 ring-(--s-surface)" style={{ backgroundColor: color }} />
                    ))}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center gap-2 text-[13.5px] font-bold text-(--s-ink)">
                      {optionLabel(question, option)}
                      {option.recommended && <Tag tone="warning">{t("recommended")}</Tag>}
                    </span>
                    {template && <span className="line-clamp-1 text-[12px] font-normal text-(--s-subtle)">{(locale === "en" ? template.description.en : template.description.ar) ?? ""}</span>}
                    {template?.edition && (
                      <span className="line-clamp-1 text-[12px] font-bold text-(--s-primary)">
                        {t("ws.card.editionPicked", { niche: locale === "en" ? template.edition.name.en : template.edition.name.ar })}
                      </span>
                    )}
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => onPreviewTemplate(option.value)}
                  className="inline-flex min-h-11 shrink-0 cursor-pointer items-center gap-1.5 rounded-xl px-3 text-[12.5px] font-bold text-(--s-link) hover:bg-(--s-hover)"
                  aria-label={t("ws.card.previewTemplate", { name: optionLabel(question, option) })}
                >
                  <Eye className="size-4" aria-hidden />
                  <span className="max-[420px]:hidden">{t("ws.card.preview")}</span>
                </button>
              </div>
            );
          })}
        </div>
      </fieldset>
    );
  }

  if (question.kind === "color") {
    const typed = normalizeHex(value?.text ?? "");
    return (
      <fieldset className="flex flex-col gap-2.5">
        <legend className="mb-2 text-[14px] font-bold text-(--s-ink)">{legend}</legend>
        <div role="radiogroup" aria-label={legend} className="flex flex-wrap gap-2" onKeyDown={moveFocus}>
          {question.options.map((option) => (
            <button
              key={option.value}
              type="button"
              role="radio"
              data-chip
              aria-checked={selected(option.value)}
              disabled={busy}
              className={chipClass}
              onClick={() => onChange(pickOption(question, value, option.value))}
            >
              {option.color ? (
                <span className="size-5 rounded-full ring-1 ring-black/10" style={{ backgroundColor: option.color }} aria-hidden />
              ) : (
                <Palette className="size-4" aria-hidden />
              )}
              {optionLabel(question, option)}
              {option.color && <span className="font-montserrat text-[11.5px] opacity-70" dir="ltr">{option.color}</span>}
              {option.recommended && <Tag tone="warning">{t("recommended")}</Tag>}
            </button>
          ))}
        </div>
        {question.allowOther && (
          <div className="flex flex-col gap-2">
            <p className="text-[12px] font-semibold text-(--s-subtle)">{t("ws.card.swatches")}</p>
            <div role="radiogroup" aria-label={t("ws.card.swatches")} className="flex flex-wrap gap-1.5" onKeyDown={moveFocus}>
              {BRAND_SWATCHES.map((color) => (
                <button
                  key={color}
                  type="button"
                  role="radio"
                  data-chip
                  aria-checked={!value?.choice && typed === color}
                  aria-label={color}
                  disabled={busy}
                  onClick={() => onChange({ text: color })}
                  className="grid size-11 cursor-pointer place-items-center rounded-full"
                >
                  <span
                    className={cn("size-8 rounded-full ring-1 ring-black/10 transition-shadow", !value?.choice && typed === color && "ring-[3px] ring-(--s-solid) ring-offset-2 ring-offset-(--s-surface)")}
                    style={{ backgroundColor: color }}
                  />
                </button>
              ))}
            </div>
            <div className="flex items-center gap-2">
              <label className="relative grid size-11 shrink-0 cursor-pointer place-items-center overflow-hidden rounded-full ring-1 ring-(--s-field)">
                <span className="sr-only">{t("ws.card.pickColor")}</span>
                <span className="size-8 rounded-full" style={{ backgroundColor: typed ?? "#ffffff" }} aria-hidden />
                <input
                  type="color"
                  className="absolute inset-0 cursor-pointer opacity-0"
                  value={typed ?? "#145163"}
                  disabled={busy}
                  onChange={(event) => onChange({ text: event.target.value })}
                />
              </label>
              <TextInput
                dir="ltr"
                className="w-36 font-montserrat"
                value={value?.choice ? "" : (value?.text ?? "")}
                maxLength={7}
                placeholder="#1e5bb8"
                aria-label={t("ws.card.hex")}
                aria-invalid={Boolean(value?.text) && !typed ? true : undefined}
                onChange={(event) => onChange({ text: event.target.value })}
              />
            </div>
          </div>
        )}
      </fieldset>
    );
  }

  const groupRole = multi ? "group" : "radiogroup";
  return (
    <fieldset className="flex flex-col gap-2.5">
      <legend className="mb-2 flex items-center gap-2 text-[14px] font-bold text-(--s-ink)">
        {legend}
        {question.optional && <span className="text-[11.5px] font-semibold text-(--s-faint)">{t("ws.card.optional")}</span>}
      </legend>
      {(question.options.length > 0 || question.optional || question.allowOther) && question.kind !== "text" ? (
        <div role={groupRole} aria-label={legend} className="flex flex-wrap gap-2" onKeyDown={moveFocus}>
          {question.options.map((option) => (
            <button
              key={option.value}
              type="button"
              data-chip
              {...(multi ? { "aria-pressed": selected(option.value) } : { role: "radio", "aria-checked": selected(option.value) })}
              disabled={busy}
              className={chipClass}
              onClick={() => {
                // The server's own "other" option (industry) opens the text field, as "Other…" does.
                const opensText = question.allowOther && option.value === OTHER_VALUE;
                setOtherOpen(opensText);
                onChange(pickOption(question, value, option.value));
              }}
            >
              {optionLabel(question, option)}
              {option.recommended && <Tag tone="warning">{t("recommended")}</Tag>}
            </button>
          ))}
          {question.allowOther && question.options.length > 0 && !question.options.some((option) => option.value === OTHER_VALUE) && (
            <button
              type="button"
              data-chip
              {...(multi ? { "aria-pressed": otherOpen } : { role: "radio", "aria-checked": otherOpen })}
              disabled={busy}
              className={chipClass}
              onClick={() => {
                setOtherOpen(true);
                onChange({ text: value?.text ?? "" });
              }}
            >
              {t("ws.card.other")}
            </button>
          )}
          {question.optional && (
            <button
              type="button"
              data-chip
              {...(multi ? { "aria-pressed": Boolean(value?.skip) } : { role: "radio", "aria-checked": Boolean(value?.skip) })}
              disabled={busy}
              className={cn(chipClass, "border-dashed text-(--s-subtle)")}
              onClick={() => {
                setOtherOpen(false);
                onChange({ skip: true });
              }}
            >
              {t("chips.skip")}
            </button>
          )}
        </div>
      ) : null}
      {question.kind === "text" && question.options.length > 0 && (
        <div role="radiogroup" aria-label={legend} className="flex flex-wrap gap-2" onKeyDown={moveFocus}>
          {question.options.map((option) => (
            <button key={option.value} type="button" role="radio" data-chip aria-checked={selected(option.value)} disabled={busy} className={chipClass} onClick={() => onChange(pickOption(question, value, option.value))}>
              {optionLabel(question, option)}
              {option.recommended && <Tag tone="warning">{t("recommended")}</Tag>}
            </button>
          ))}
          {question.optional && (
            <button type="button" role="radio" data-chip aria-checked={Boolean(value?.skip)} disabled={busy} className={cn(chipClass, "border-dashed text-(--s-subtle)")} onClick={() => onChange({ skip: true })}>
              {t("chips.skip")}
            </button>
          )}
        </div>
      )}
      {(textInput || question.kind === "text") &&
        (question.id === "describe" ? (
          <TextArea
            rows={4}
            value={value?.text ?? ""}
            maxLength={BUILDER_LIMITS.textMax}
            placeholder={placeholder}
            aria-label={legend}
            disabled={busy}
            onChange={(event) => onChange({ text: event.target.value })}
          />
        ) : (
          <TextInput
            value={value?.text ?? ""}
            inputMode={question.id === "whatsapp" || chosenOption?.needsText ? (question.id === "whatsapp" ? "tel" : "decimal") : undefined}
            dir={question.id === "whatsapp" ? "ltr" : undefined}
            maxLength={question.id === "shipping" ? BUILDER_LIMITS.shippingTextMax : BUILDER_LIMITS.textMax}
            placeholder={placeholder}
            aria-label={chosenOption?.needsText ? optionLabel(question, chosenOption) : legend}
            disabled={busy}
            onChange={(event) => (question.kind === "text" ? onChange({ text: event.target.value }) : setText(event.target.value))}
          />
        ))}
    </fieldset>
  );
}
