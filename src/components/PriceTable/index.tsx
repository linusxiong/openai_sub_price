import { useMemo, useState, useCallback } from "react";
import { ArrowUp, ArrowDown, Check, Copy } from "@phosphor-icons/react";
import { useTranslation } from "react-i18next";
import type { CountryConfig } from "../../types/pricing";
import type { ExchangeRateData } from "../../services/exchange-rates";
import { getPlanAmount } from "../../utils/plans";
import { convertPrice, formatCurrency } from "../../utils/currency";
import { usePreferences } from "../../store/preferences";
import { StatusBadge } from "./StatusBadge";
import { formatCountryCurrencyCode } from "./copyPayload";

interface PriceTableProps {
  configs: Map<string, CountryConfig>;
  exchangeRates: ExchangeRateData | undefined;
  exchangeRateError: boolean;
}

function getCountryFlag(code: string): string {
  if (code.length !== 2) return "";
  const offset = 127397;
  return String.fromCodePoint(
    code.charCodeAt(0) + offset,
    code.charCodeAt(1) + offset
  );
}

export function PriceTable({
  configs,
  exchangeRates,
  exchangeRateError,
}: PriceTableProps) {
  const { t, i18n } = useTranslation();
  const {
    displayCurrency,
    activePlan,
    billingInterval,
    sortDirection,
    setSortDirection,
  } = usePreferences();

  const rows = useMemo(() => {
    let countryNames: Intl.DisplayNames | null = null;
    try {
      countryNames = new Intl.DisplayNames([i18n.language], { type: "region" });
    } catch {
      countryNames = new Intl.DisplayNames(["en"], { type: "region" });
    }

    return Array.from(configs.entries()).map(([cc, config]) => {
      const { currency_config } = config;
      const localCurrency = currency_config.symbol_code;
      const rates = exchangeRates?.rates ?? {};

      const originalAmount = getPlanAmount(currency_config, activePlan, billingInterval);
      const convertedAmount =
        originalAmount !== null && exchangeRates
          ? convertPrice(originalAmount, localCurrency, displayCurrency, rates)
          : null;

      let name = cc;
      try {
        name = countryNames?.of(cc) ?? cc;
      } catch {
        // Non-standard codes like US2, EU, XK
      }

      return {
        countryCode: cc,
        countryName: name,
        flag: getCountryFlag(cc),
        currencyCode: localCurrency,
        currencySymbol: currency_config.symbol,
        originalAmount,
        convertedAmount,
      };
    });
  }, [configs, exchangeRates, displayCurrency, activePlan, billingInterval, i18n.language]);

  const sortedRows = useMemo(() => {
    const sorted = [...rows].sort((a, b) => {
      const aVal = a.convertedAmount ?? a.originalAmount ?? Infinity;
      const bVal = b.convertedAmount ?? b.originalAmount ?? Infinity;
      return aVal - bVal;
    });
    if (sortDirection === "descending") sorted.reverse();
    return sorted.map((row, idx) => ({ ...row, rank: idx + 1 }));
  }, [rows, sortDirection]);

  const toggleSort = () => {
    setSortDirection(sortDirection === "ascending" ? "descending" : "ascending");
  };

  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const copyCountryCurrencyCode = useCallback((countryCode: string, currencyCode: string) => {
    const payload = formatCountryCurrencyCode(countryCode, currencyCode);
    navigator.clipboard.writeText(payload).then(() => {
      setCopiedCode(payload);
      setTimeout(() => setCopiedCode(null), 1500);
    }).catch(() => {});
  }, []);

  return (
    <div className="flex flex-col gap-2">
      {exchangeRateError && (
        <div className="px-3 py-2 text-xs text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/30 rounded-lg border border-amber-200 dark:border-amber-800">
          {t("ui.exchangeRateError")}
        </div>
      )}
      <div className="overflow-x-auto rounded-xl border border-zinc-200 dark:border-zinc-800">
        <table className="w-full text-sm" aria-label={t("app.title")}>
          <thead className="sticky top-0 z-10 bg-zinc-100 dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800">
            <tr>
              <th className="px-3 py-2.5 text-left text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400 w-10">
                {t("columns.rank")}
              </th>
              <th className="px-3 py-2.5 text-left text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                {t("columns.country")}
              </th>
              <th className="px-3 py-2.5 text-left text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                {t("columns.originalPrice")}
              </th>
              <th
                className="px-3 py-2.5 text-left text-xs font-medium uppercase tracking-wide text-zinc-900 dark:text-zinc-100 cursor-pointer select-none hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors"
                onClick={toggleSort}
                aria-sort={sortDirection === "ascending" ? "ascending" : "descending"}
              >
                <span className="inline-flex items-center gap-1">
                  {displayCurrency}
                  {sortDirection === "ascending" ? (
                    <ArrowUp size={11} weight="bold" />
                  ) : (
                    <ArrowDown size={11} weight="bold" />
                  )}
                </span>
              </th>
              <th className="px-3 py-2.5 text-left text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                {t("columns.status")}
              </th>
            </tr>
          </thead>
          <tbody>
            {sortedRows.map((row, idx) => (
              <tr
                key={row.countryCode}
                className={`border-b border-zinc-100 dark:border-zinc-800/50 hover:bg-zinc-50 dark:hover:bg-zinc-900/60 transition-colors ${
                  idx % 2 === 1 ? "bg-zinc-50/60 dark:bg-zinc-900/30" : ""
                }`}
              >
                <td className="px-3 py-2.5">
                  <span className="font-mono text-xs text-zinc-400 dark:text-zinc-500">
                    {row.rank}
                  </span>
                </td>
                <td className="px-3 py-2.5">
                  <button
                    onClick={() => copyCountryCurrencyCode(row.countryCode, row.currencyCode)}
                    className="group inline-flex items-center gap-1.5 whitespace-nowrap text-sm font-medium text-zinc-800 dark:text-zinc-200 hover:text-zinc-600 dark:hover:text-zinc-400 transition-colors cursor-pointer"
                    title={`Copy ${formatCountryCurrencyCode(row.countryCode, row.currencyCode)}`}
                    aria-label={`Copy country and currency codes ${formatCountryCurrencyCode(row.countryCode, row.currencyCode)}`}
                  >
                    {row.flag} {row.countryName}
                    <span className="opacity-0 group-hover:opacity-100 transition-opacity text-zinc-400 dark:text-zinc-500">
                      {copiedCode === formatCountryCurrencyCode(row.countryCode, row.currencyCode)
                        ? <Check size={12} weight="bold" className="text-emerald-500" />
                        : <Copy size={12} />}
                    </span>
                  </button>
                </td>
                <td className="px-3 py-2.5">
                  {row.originalAmount !== null ? (
                    <span className="font-mono text-sm text-zinc-600 dark:text-zinc-400">
                      {row.currencySymbol}{row.originalAmount.toFixed(2)}{" "}
                      <span className="text-xs text-zinc-400 dark:text-zinc-500">
                        {row.currencyCode}
                      </span>
                    </span>
                  ) : (
                    <span className="text-xs text-zinc-400 dark:text-zinc-500">
                      {t("ui.unavailable")}
                    </span>
                  )}
                </td>
                <td className="px-3 py-2.5">
                  {row.convertedAmount !== null ? (
                    <span className="font-mono font-semibold text-sm text-zinc-900 dark:text-zinc-50">
                      {formatCurrency(row.convertedAmount, displayCurrency, i18n.language)}
                    </span>
                  ) : row.originalAmount !== null ? (
                    <span className="font-mono text-sm text-zinc-600 dark:text-zinc-400">
                      {row.currencySymbol}{row.originalAmount.toFixed(2)}
                    </span>
                  ) : (
                    <span className="text-xs text-zinc-400 dark:text-zinc-500">
                      {t("ui.unavailable")}
                    </span>
                  )}
                </td>
                <td className="px-3 py-2.5">
                  <StatusBadge rank={row.rank} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
