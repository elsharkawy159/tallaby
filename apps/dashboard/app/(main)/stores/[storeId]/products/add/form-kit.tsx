"use client";

import { cloneElement, isValidElement, type ReactElement } from "react";
import type { LucideIcon } from "lucide-react";
import { Minus, Plus } from "lucide-react";
import { Switch } from "@workspace/ui/components/switch";
import { fieldClass } from "@/components/seller-ui";
import { toAsciiDigits } from "@/components/form/form-ui";
import { cn } from "@/lib/utils";

export { FieldError, LengthCount, LengthMeter, toAsciiDigits } from "@/components/form/form-ui";

/*
 * The product pages' form pieces in the seller design (docs/seller-dashboard-design.md).
 * Same names and props as components/form/form-ui, which the other pages still share.
 */

export const FIELD_CLASS = fieldClass;
export const TEXTAREA_CLASS = cn(fieldClass, "h-auto min-h-[104px] py-3 leading-relaxed");

const GROUP_CLASS =
  "flex items-stretch overflow-hidden rounded-[14px] border-[1.5px] border-(--s-field) bg-(--s-surface) transition-[border-color,box-shadow] duration-150 focus-within:border-(--s-primary) focus-within:shadow-[0_0_0_3px_var(--s-focus-soft)]";

export const INVALID_FIELD_CLASS = "border-destructive focus-within:border-destructive";

export const GROUP_SELECT_CLASS =
  "h-full cursor-pointer border-0 border-s border-(--s-line-soft) bg-(--s-surface-2) px-2.5 text-xs font-medium text-(--s-subtle) outline-none";

export const SMALL_BUTTON_CLASS =
  "h-9 rounded-full px-3.5 text-[13px] font-semibold rtl:flex-row max-[600px]:h-10";

export const BUTTON_CLASS = "h-[42px] px-5 font-bold rtl:flex-row";

export type SectionIconProp = LucideIcon | ReactElement<{ className?: string }>;

export function SectionIcon({ icon: Icon }: { icon: SectionIconProp; compact?: boolean }) {
  const className = "size-[18px]";
  return (
    <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-primary-soft text-primary-ink max-[600px]:size-8 max-[600px]:rounded-[10px]">
      {isValidElement(Icon) ? cloneElement(Icon, { className }) : <Icon className={className} />}
    </span>
  );
}

/** A topic of the form: the system's card (`.sec`/`.shd`), with room for the section's error ring. */
export function SectionCard({
  id,
  icon,
  title,
  description,
  action,
  invalid = false,
  children,
  className,
}: {
  id: string;
  icon: SectionIconProp;
  title: React.ReactNode;
  description: React.ReactNode;
  tag?: React.ReactNode;
  action?: React.ReactNode;
  divided?: boolean;
  invalid?: boolean;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section
      id={id}
      className={cn(
        "flex flex-col gap-4 rounded-[24px] border border-(--s-line) bg-(--s-glass) p-[22px] shadow-(--s-shadow-card) transition-colors max-[600px]:gap-3.5 max-[600px]:rounded-[20px] max-[600px]:p-3.5",
        invalid && "border-destructive/45",
        className,
      )}
    >
      <header className="flex flex-wrap items-start gap-3 max-[600px]:gap-2.5">
        <SectionIcon icon={icon} />
        <div className="min-w-0 flex-1 basis-40">
          <h2 className="text-[16.5px] font-bold leading-normal text-(--s-ink) max-[600px]:text-[15px]">{title}</h2>
          <p className="mt-0.5 text-pretty text-[13px] leading-relaxed text-(--s-muted) max-[600px]:text-[12.5px] max-[600px]:leading-normal">{description}</p>
        </div>
        {action ? <div className="shrink-0">{action}</div> : null}
      </header>
      {children}
    </section>
  );
}

export function LabelNote({ children }: { children: React.ReactNode }) {
  return <span className="whitespace-nowrap text-xs font-medium text-(--s-faint)">{children}</span>;
}

export function FieldHint({ children, className, ...props }: React.ComponentProps<"p">) {
  return (
    <p className={cn("text-pretty text-xs leading-relaxed text-(--s-faint)", className)} {...props}>
      {children}
    </p>
  );
}

export function LocaleTag({ locale }: { locale: string }) {
  return (
    <span className="rounded-[5px] bg-primary-soft px-[5px] font-montserrat text-[10px] font-bold leading-[18px] text-primary-ink">
      {locale.toUpperCase()}
    </span>
  );
}

export function FieldLabel({
  htmlFor,
  required,
  locale,
  note,
  children,
  className,
}: {
  htmlFor?: string;
  required?: boolean;
  locale?: string;
  note?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  const Comp = htmlFor ? "label" : "span";
  return (
    <Comp htmlFor={htmlFor} className={cn("flex items-center gap-1.5 whitespace-nowrap text-[13.5px] font-bold text-(--s-text)", className)}>
      {children}
      {required && (
        <span aria-hidden className="text-destructive">
          *
        </span>
      )}
      {locale && <LocaleTag locale={locale} />}
      {note != null && (
        <span className="ms-auto">
          <LabelNote>{note}</LabelNote>
        </span>
      )}
    </Comp>
  );
}

export function InputGroup({ invalid, className, ...props }: React.ComponentProps<"div"> & { invalid?: boolean }) {
  return <div className={cn(GROUP_CLASS, "h-[46px]", invalid && INVALID_FIELD_CLASS, className)} {...props} />;
}

export function InputAddon({
  position = "end",
  className,
  ...props
}: React.ComponentProps<"span"> & { position?: "start" | "end" }) {
  return (
    <span
      className={cn(
        "flex items-center whitespace-nowrap bg-(--s-surface-2) px-3 text-xs font-medium text-(--s-subtle)",
        position === "start" ? "border-e border-(--s-line-soft)" : "border-s border-(--s-line-soft)",
        className,
      )}
      {...props}
    />
  );
}

export function GroupInput({ className, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      className={cn(
        "h-full min-w-0 flex-1 bg-transparent px-3.5 text-sm text-(--s-text) outline-none placeholder:text-(--s-placeholder) disabled:cursor-not-allowed disabled:opacity-60",
        className,
      )}
      {...props}
    />
  );
}

/** − value + for whole numbers. The number is a normal input: click it and type. */
export function NumberStepper({
  id,
  value,
  onChange,
  onBlur,
  min = 0,
  max,
  suffix,
  disabled,
  invalid,
  decrementLabel,
  incrementLabel,
  inputLabel,
  size = "default",
}: {
  id?: string;
  value: number | undefined;
  onChange: (value: number | undefined) => void;
  onBlur?: () => void;
  min?: number;
  max?: number;
  suffix?: React.ReactNode;
  disabled?: boolean;
  invalid?: boolean;
  decrementLabel: string;
  incrementLabel: string;
  inputLabel?: string;
  size?: "default" | "sm";
}) {
  const current = typeof value === "number" && !Number.isNaN(value) ? value : undefined;
  const clamp = (n: number) => Math.max(min, max != null ? Math.min(max, n) : n);
  const bump = (delta: number) => onChange(clamp((current ?? min) + delta));
  const small = size === "sm";
  const buttonClass = cn(
    "grid shrink-0 cursor-pointer place-items-center bg-(--s-surface-2) text-(--s-subtle) transition-colors hover:text-(--s-primary) disabled:cursor-not-allowed disabled:opacity-50",
    small ? "w-9 max-[600px]:w-10" : "w-11",
  );

  return (
    <div className={cn(GROUP_CLASS, small ? "h-10" : "h-[46px]", disabled && "opacity-60", invalid && INVALID_FIELD_CLASS)}>
      <button
        type="button"
        onClick={() => bump(-1)}
        disabled={disabled || (current ?? min) <= min}
        aria-label={decrementLabel}
        className={buttonClass}
      >
        <Minus className="size-4" />
      </button>
      <input
        id={id}
        dir="ltr"
        inputMode="numeric"
        aria-label={inputLabel}
        value={current ?? ""}
        disabled={disabled}
        onFocus={(e) => e.currentTarget.select()}
        onChange={(e) => {
          const digits = toAsciiDigits(e.target.value).replace(/\D/g, "");
          onChange(digits === "" ? undefined : clamp(Number(digits)));
        }}
        onBlur={onBlur}
        className={cn(
          "min-w-0 flex-1 bg-transparent text-center font-montserrat font-semibold tabular-nums text-(--s-text) outline-none disabled:cursor-not-allowed",
          small && "text-[13px]",
        )}
      />
      {suffix && (
        <span className="flex items-center border-s border-(--s-line-soft) px-3 text-xs text-(--s-subtle)">{suffix}</span>
      )}
      <button
        type="button"
        onClick={() => bump(1)}
        disabled={disabled || (max != null && (current ?? min) >= max)}
        aria-label={incrementLabel}
        className={buttonClass}
      >
        <Plus className="size-4" />
      </button>
    </div>
  );
}

/** A switch with a title and one line of explanation; `boxed` is the option tile. */
export function ToggleRow({
  id,
  checked,
  onCheckedChange,
  title,
  description,
  boxed = false,
  disabled,
  className,
}: {
  id: string;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  title: React.ReactNode;
  description?: React.ReactNode;
  boxed?: boolean;
  disabled?: boolean;
  className?: string;
}) {
  return (
    <label
      htmlFor={id}
      className={cn(
        "flex cursor-pointer items-center gap-3",
        boxed && "rounded-2xl border-[1.5px] border-(--s-field) bg-(--s-surface) px-4 py-3.5",
        disabled && "cursor-not-allowed opacity-60",
        className,
      )}
    >
      <Switch id={id} checked={checked} onCheckedChange={onCheckedChange} disabled={disabled} />
      <span className="min-w-0">
        <span className="block text-[13.5px] font-bold text-(--s-ink)">{title}</span>
        {description && <span className="block text-xs leading-[1.6] text-(--s-subtle)">{description}</span>}
      </span>
    </label>
  );
}

/** Heading inside a section body, trailed by a hairline. */
export function SubHeading({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2 pt-1 text-[13.5px] font-bold text-(--s-ink) after:h-px after:flex-1 after:bg-(--s-line-soft)">
      {children}
    </div>
  );
}
