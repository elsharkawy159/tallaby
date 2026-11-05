import { cn } from "@/lib/utils";

/* Form fields: the design's `.fld`, `.in`, `.inx`, `.sel2`, `.r2`, `.tg`, `.ck`, `.opt`. Server-safe. */

/** The design's field look, for anything that isn't one of the inputs below (e.g. a Radix SelectTrigger). */
export const fieldClass =
  "h-[46px] w-full rounded-[14px] border-[1.5px] border-(--s-field) bg-(--s-surface) px-3.5 text-sm text-(--s-text) shadow-none outline-none transition-[border-color,box-shadow] duration-150 placeholder:text-(--s-placeholder) focus:border-(--s-primary) focus:shadow-[0_0_0_4px_var(--s-focus-soft)] focus-visible:ring-0 disabled:cursor-not-allowed disabled:opacity-60 aria-invalid:border-destructive";

/** Label, hint and error around one control. Pass `htmlFor` with the control's `id`. */
export function Field({
  label,
  hint,
  note,
  error,
  htmlFor,
  required,
  className,
  children,
}: {
  label?: React.ReactNode;
  /** Short text opposite the label, e.g. "optional" or a character count. */
  hint?: React.ReactNode;
  /** A line under the control. */
  note?: React.ReactNode;
  error?: React.ReactNode;
  htmlFor?: string;
  required?: boolean;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={cn("flex min-w-0 flex-col gap-2", className)}>
      {(label || hint) && (
        <div className="flex items-baseline justify-between gap-2">
          {label && (
            <label htmlFor={htmlFor} className="text-[13.5px] font-bold text-(--s-text)">
              {label}
              {required && (
                <span aria-hidden className="ms-0.5 text-destructive">
                  *
                </span>
              )}
            </label>
          )}
          {hint && <small className="text-xs font-medium text-(--s-faint)">{hint}</small>}
        </div>
      )}
      {children}
      {note && !error && <p className="text-pretty text-xs text-(--s-faint)">{note}</p>}
      {error && (
        <p role="alert" className="text-xs font-semibold text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}

/** Two equal fields that stack at 720px (`.r2`). */
export function FieldRow({ className, ...props }: React.ComponentProps<"div">) {
  return <div className={cn("grid grid-cols-2 gap-3 max-[720px]:grid-cols-1", className)} {...props} />;
}

/** Works with react-hook-form: `ref` is an ordinary prop in React 19. */
export function TextInput({ className, ...props }: React.ComponentProps<"input">) {
  return <input className={cn(fieldClass, className)} {...props} />;
}

export function TextArea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      className={cn(fieldClass, "h-auto min-h-24 resize-y py-3 leading-[1.8]", className)}
      {...props}
    />
  );
}

export function NativeSelect({ className, ...props }: React.ComponentProps<"select">) {
  return <select className={cn(fieldClass, className)} {...props} />;
}

/** An input with a fixed part such as a currency or `https://` (`.inx`). `start` and `end` hold the fixed parts. */
export function InputGroup({
  start,
  end,
  className,
  inputClassName,
  ...props
}: Omit<React.ComponentProps<"input">, "prefix"> & {
  start?: React.ReactNode;
  end?: React.ReactNode;
  inputClassName?: string;
}) {
  const addon =
    "flex h-full items-center whitespace-nowrap bg-(--s-surface-2) px-3 font-montserrat text-[13px] font-medium text-(--s-subtle)";
  return (
    <div
      className={cn(
        "flex h-[46px] items-center overflow-hidden rounded-[14px] border-[1.5px] border-(--s-field) bg-(--s-surface) transition-[border-color,box-shadow] duration-150 focus-within:border-(--s-primary) focus-within:shadow-[0_0_0_4px_var(--s-focus-soft)]",
        className,
      )}
    >
      {start && <span className={cn(addon, "border-e border-(--s-line-soft)")}>{start}</span>}
      <input
        className={cn(
          "h-full min-w-0 flex-1 border-0 bg-transparent px-3 text-sm text-(--s-text) outline-none placeholder:text-(--s-placeholder)",
          inputClassName,
        )}
        {...props}
      />
      {end && <span className={cn(addon, "border-s border-(--s-line-soft)")}>{end}</span>}
    </div>
  );
}

/**
 * On/off switch (`.tg`) over a real checkbox, so it also works in a plain form.
 * `<Toggle checked={on} onCheckedChange={setOn} label="Show on the store" />`
 */
export function Toggle({
  label,
  checked,
  onCheckedChange,
  onChange,
  className,
  ...props
}: Omit<React.ComponentProps<"input">, "type"> & {
  label?: React.ReactNode;
  onCheckedChange?: (checked: boolean) => void;
}) {
  return (
    // The ::before is the 40px phone touch target: it takes clicks without moving the layout.
    <label className={cn("relative inline-flex cursor-pointer items-center gap-2.5 text-[13px] text-(--s-muted) max-[600px]:before:absolute max-[600px]:before:inset-x-0 max-[600px]:before:top-1/2 max-[600px]:before:h-10 max-[600px]:before:-translate-y-1/2", className)}>
      <input
        type="checkbox"
        role="switch"
        className="peer absolute size-px opacity-0"
        checked={checked}
        // Only with a handler, so a server component can render it in a plain form (defaultChecked).
        onChange={
          onChange || onCheckedChange
            ? (event) => {
                onChange?.(event);
                onCheckedChange?.(event.target.checked);
              }
            : undefined
        }
        {...props}
      />
      <span
        aria-hidden
        className="relative h-[26px] w-11 shrink-0 rounded-full bg-(--s-field-strong) transition-colors duration-150 after:absolute after:start-[3px] after:top-[3px] after:size-5 after:rounded-full after:bg-white after:shadow-[0_1px_3px_rgb(0_0_0/0.2)] after:transition-[inset-inline-start] after:duration-150 peer-checked:bg-(--s-primary) peer-checked:after:start-[21px] peer-focus-visible:outline-[3px] peer-focus-visible:outline-offset-2 peer-focus-visible:outline-(--s-focus) peer-disabled:opacity-45"
      />
      {label}
    </label>
  );
}

/** A checkbox with its text (`.ck`). */
export function CheckRow({
  label,
  description,
  className,
  ...props
}: Omit<React.ComponentProps<"input">, "type"> & { label: React.ReactNode; description?: React.ReactNode }) {
  return (
    <label className={cn("flex cursor-pointer items-start gap-2.5 text-[13.5px] text-(--s-text)", className)}>
      <input type="checkbox" className="mt-0.5 size-5 shrink-0 accent-(--s-primary)" {...props} />
      <span className="min-w-0">
        {label}
        {description && <small className="block text-xs text-(--s-subtle)">{description}</small>}
      </span>
    </label>
  );
}

/** Grid for OptionCard (`.opts`). */
export function OptionCards({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div className={cn("grid grid-cols-[repeat(auto-fit,minmax(min(100%,200px),1fr))] gap-2", className)} {...props} />
  );
}

/** One choice with an explanation (`.opt`). Radio by default; pass the same `name` to a group. */
export function OptionCard({
  title,
  description,
  type = "radio",
  className,
  ...props
}: Omit<React.ComponentProps<"input">, "title"> & {
  title: React.ReactNode;
  description?: React.ReactNode;
  type?: "radio" | "checkbox";
}) {
  return (
    <label
      className={cn(
        "relative flex cursor-pointer items-start gap-2.5 rounded-2xl border-[1.5px] border-(--s-field) bg-(--s-surface) p-3.5 transition-[border-color,background-color,box-shadow] duration-150 hover:border-(--s-outline) has-checked:border-(--s-primary) has-checked:bg-(--s-tint) has-checked:shadow-[0_0_0_3px_var(--s-focus-soft)] has-focus-visible:outline-[3px] has-focus-visible:outline-offset-2 has-focus-visible:outline-(--s-focus) has-disabled:cursor-not-allowed has-disabled:opacity-60",
        className,
      )}
    >
      <input type={type} className="peer absolute size-px opacity-0" {...props} />
      <span
        aria-hidden
        className="mt-0.5 size-5 shrink-0 rounded-full border-2 border-(--s-field-strong) transition-all duration-150 peer-checked:border-[6px] peer-checked:border-(--s-primary)"
      />
      <span className="min-w-0">
        <b className="block text-[13.5px] font-bold text-(--s-ink)">{title}</b>
        {description && <small className="block text-xs leading-[1.6] text-(--s-subtle)">{description}</small>}
      </span>
    </label>
  );
}
