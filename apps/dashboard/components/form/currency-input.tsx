import { cn } from "@/lib/utils";
import { GroupInput, InputAddon, InputGroup } from "./form-ui";

/** Every amount a seller types is in Egyptian pounds. */
export const CURRENCY_CODE = "EGP";

/** The static "EGP" addon, for inputs composed by hand (react-hook-form fields). */
export function CurrencyAddon({ className }: { className?: string }) {
  return (
    <InputAddon position="start" className={cn("font-mono text-[13px]", className)}>
      {CURRENCY_CODE}
    </InputAddon>
  );
}

/**
 * Amount input with a static "EGP" addon. The group is always LTR, so the
 * addon sits on the left in Arabic and English alike and digits read naturally.
 * Keeps only digits (and one dot when `decimals`), so the value is always a
 * plain number string or "".
 */
export function CurrencyInput({
  value,
  onChange,
  decimals = true,
  invalid,
  className,
  inputClassName,
  addonClassName,
  ...props
}: Omit<React.ComponentProps<"input">, "value" | "onChange" | "type"> & {
  value: string;
  onChange: (value: string) => void;
  decimals?: boolean;
  invalid?: boolean;
  /** For a larger amount field (e.g. the top-up dialog). */
  inputClassName?: string;
  addonClassName?: string;
}) {
  return (
    <InputGroup dir="ltr" invalid={invalid} className={cn(props.disabled && "opacity-60", className)}>
      <CurrencyAddon className={addonClassName} />
      <GroupInput
        {...props}
        className={inputClassName}
        inputMode={decimals ? "decimal" : "numeric"}
        aria-invalid={invalid || undefined}
        value={value}
        onChange={(e) => {
          let next = e.target.value.replace(decimals ? /[^\d.]/g : /\D/g, "");
          if (decimals) next = next.replace(/(\..*)\./g, "$1");
          onChange(next);
        }}
      />
    </InputGroup>
  );
}
