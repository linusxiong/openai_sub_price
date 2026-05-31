import { useTranslation } from "react-i18next";
import { TrendDown } from "@phosphor-icons/react";
import { formatCurrency } from "../../utils/currency";

interface LowestPriceCardProps {
  lowestPrice: number;
  lowestCountryName: string;
  lowestFlag: string;
  highestPrice: number;
  displayCurrency: string;
  locale: string;
}

export function LowestPriceCard({
  lowestPrice,
  lowestCountryName,
  lowestFlag,
  highestPrice,
  displayCurrency,
  locale,
}: LowestPriceCardProps) {
  const { t } = useTranslation();
  const savingsPct =
    highestPrice > 0
      ? Math.round(((highestPrice - lowestPrice) / highestPrice) * 100)
      : 0;

  return (
    <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4 flex flex-col gap-3">
      <p className="text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
        {t("sidebar.lowestPrice")}
      </p>
      <div className="flex flex-col gap-1">
        <span className="text-3xl font-semibold font-mono text-zinc-900 dark:text-zinc-50 tabular-nums">
          {formatCurrency(lowestPrice, displayCurrency, locale)}
        </span>
        <span className="text-sm text-zinc-600 dark:text-zinc-400">
          {lowestFlag} {lowestCountryName}
        </span>
      </div>
      {savingsPct > 0 && (
        <div className="flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400">
          <TrendDown size={14} weight="bold" />
          <span>
            {t("sidebar.savingsVsHighest", { pct: savingsPct })}
          </span>
        </div>
      )}
    </div>
  );
}
