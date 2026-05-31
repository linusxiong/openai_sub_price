import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { formatCurrency } from "../../utils/currency";

interface DistributionRow {
  countryCode: string;
  flag: string;
  convertedPrice: number;
}

interface PriceDistributionProps {
  rows: DistributionRow[];
  displayCurrency: string;
  locale: string;
  maxRows?: number;
}

export function PriceDistribution({
  rows,
  displayCurrency,
  locale,
  maxRows = 30,
}: PriceDistributionProps) {
  const { t } = useTranslation();

  const sorted = useMemo(() => {
    return [...rows]
      .sort((a, b) => a.convertedPrice - b.convertedPrice)
      .slice(0, maxRows);
  }, [rows, maxRows]);

  const maxPrice = sorted[sorted.length - 1]?.convertedPrice ?? 1;
  const minPrice = sorted[0]?.convertedPrice ?? 0;

  if (sorted.length === 0) return null;

  return (
    <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4 flex flex-col gap-3">
      <p className="text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
        {t("sidebar.priceDistribution")}
      </p>
      <div className="flex flex-col gap-1.5">
        {sorted.map((row, idx) => {
          const pct =
            maxPrice > minPrice
              ? ((row.convertedPrice - minPrice) / (maxPrice - minPrice)) * 80 + 10
              : 50;
          const isLowest = idx === 0;
          return (
            <div key={row.countryCode} className="flex items-center gap-2">
              <span className="font-mono text-[11px] text-zinc-500 dark:text-zinc-400 w-6 shrink-0">
                {row.flag || row.countryCode}
              </span>
              <div className="flex-1 h-2 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-300 ${
                    isLowest
                      ? "bg-emerald-500 dark:bg-emerald-400"
                      : "bg-zinc-300 dark:bg-zinc-600"
                  }`}
                  style={{ width: `${pct}%` }}
                />
              </div>
              <span className="font-mono text-[11px] text-zinc-600 dark:text-zinc-400 w-16 text-right shrink-0 tabular-nums">
                {formatCurrency(row.convertedPrice, displayCurrency, locale)}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
