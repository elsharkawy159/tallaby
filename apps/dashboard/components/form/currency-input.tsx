import { useLocale } from "next-intl";
import { SAUDI_RIYAL_LABEL, currencyLabelText } from "@workspace/lib";
import { RiyalSymbol } from "@/components/money";
import { moneyLabel, type MoneyUnit } from "@/lib/i18n/format";
import { cn } from "@/lib/utils";
import { GroupInput, InputAddon, InputGroup } from "./form-ui";

/** The currency of Tallaby's own Egyptian screens (the top-up amount). A store's amounts use its own currency. */
export const CURRENCY_CODE = "EGP";

function AddonLabel({ unit }: { unit: MoneyUnit }) {
  const locale = useLocale();
  const label = moneyLabel(unit);
  return label === SAUDI_RIYAL_LABEL ? <RiyalSymbol locale={locale} /> : currencyLabelText(label, locale);
}

/**
 * The static currency addon, for inputs composed by hand (react-hook-form fields).
 * Pass the store's `currency` and `label` wherever the amount is a store's;
 * leaving them out means EGP, which wallet screens rely on.
 */
export function CurrencyAddon({ className, currency, label }: { className?: string } & MoneyUnit) {
  return (
    <InputAddon position="start" className={cn("font-mono text-[13px]", className)}>
      {currency && currency !== CURRENCY_CODE ? <AddonLabel unit={{ currency, label }} /> : CURRENCY_CODE}
    </InputAddon>
  );
}

/**
 * Amount input with a static currency addon. The group is always LTR, so the
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
  currency,
  label,
  ...props
}: Omit<React.ComponentProps<"input">, "value" | "onChange" | "type"> & {
  value: string;
  onChange: (value: string) => void;
  decimals?: boolean;
  invalid?: boolean;
  /** For a larger amount field (e.g. the top-up dialog). */
  inputClassName?: string;
  addonClassName?: string;
} & MoneyUnit) {
  return (
    <InputGroup dir="ltr" invalid={invalid} className={cn(props.disabled && "opacity-60", className)}>
      <CurrencyAddon className={addonClassName} currency={currency} label={label} />
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
