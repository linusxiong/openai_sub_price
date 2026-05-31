import { useTranslation } from "react-i18next";
import { formatCurrency } from "../../utils/currency";

interface PlanCellProps {
  convertedAmount: number | null;
  originalAmount: number | null;
  displayCurrency: string;
  localCurrency: string;
  localSymbol: string;
  locale: string;
}

export function PlanCell({
  convertedAmount,
  originalAmount,
  displayCurrency,
  localCurrency,
  localSymbol,
  locale,
}: PlanCellProps) {
  const { t } = useTranslation();

  if (originalAmount === null) {
    return (
      <span className="text-zinc-400 dark:text-zinc-500 text-xs">
        {t("ui.unavailable")}
      </span>
    );
  }

  const showConverted =
    convertedAmount !== null &&
    displayCurrency.toLowerCase() !== localCurrency.toLowerCase();

  return (
    <div className="flex flex-col gap-0.5">
      <span className="font-mono font-semibold text-sm text-zinc-900 dark:text-zinc-50">
        {showConverted
          ? formatCurrency(convertedAmount, displayCurrency, locale)
          : formatCurrency(originalAmount, localCurrency, locale)}
      </span>
      {showConverted && (
        <span className="font-mono text-xs text-zinc-500 dark:text-zinc-400">
          {localSymbol}
          {originalAmount.toFixed(2)}
        </span>
      )}
    </div>
  );
}
