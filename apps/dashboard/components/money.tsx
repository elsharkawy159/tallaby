import { Children, Fragment, type ReactNode } from "react";
import { PRICE_SYMBOL_MARK, saudiRiyalSvg } from "@workspace/lib";
import { formatMoneyMarked, type MoneyUnit } from "@/lib/i18n/format";
import { cn } from "@workspace/ui/lib/utils";

/** The Saudi Riyal symbol (a fixed string, so safe as HTML), sized to the text around it. */
export function RiyalSymbol({ locale }: { locale: string }) {
  return <span dangerouslySetInnerHTML={{ __html: saudiRiyalSvg(locale) }} />;
}

/**
 * Draws text holding `formatMoneyMarked` amounts, or a translated sentence around
 * one, with the symbol in place of each mark. Everything else stays escaped text.
 * Takes the children `t.rich` gives too. Server or client.
 */
export function MoneyText({ children, locale }: { children: ReactNode; locale: string }) {
  return (
    <>
      {Children.map(children, (child) => {
        if (typeof child !== "string") return child;
        return child.split(PRICE_SYMBOL_MARK).map((part, index) => (
          <Fragment key={index}>
            {index > 0 && <RiyalSymbol locale={locale} />}
            {part}
          </Fragment>
        ));
      })}
    </>
  );
}

/** One amount per currency, one per line: totals across stores never add different currencies. */
export function MoneyLines({
  totals,
  locale,
  className,
}: {
  totals: readonly { currency: string; total: number }[];
  locale: string;
  className?: string;
}) {
  return totals.map(({ currency, total }) => (
    <span key={currency} className={cn("block", className)}>
      <Money value={total} locale={locale} unit={{ currency }} />
    </span>
  ));
}

/** One amount with its currency, as the screen shows it. Server or client. */
export function Money({ value, locale, unit }: { value: string | number | null | undefined; locale: string; unit?: MoneyUnit }) {
  return <MoneyText locale={locale}>{formatMoneyMarked(value, locale, unit)}</MoneyText>;
}
