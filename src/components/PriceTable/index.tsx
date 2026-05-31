import { useMemo } from "react";
import { Button, Chip } from "@heroui/react";
import { ArrowUp, ArrowDown } from "@phosphor-icons/react";
import { useTranslation } from "react-i18next";
import type { CountryConfig, PlanKey } from "../../types/pricing";
import type { ExchangeRateData } from "../../services/exchange-rates";
import {
  PLAN_ORDER,
  PLAN_LABEL_KEYS,
  getPlanAmount,
} from "../../utils/plans";
import { convertPrice } from "../../utils/currency";
import { usePreferences } from "../../store/preferences";
import { PlanCell } from "./PlanCell";

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
    billingInterval,
    setBillingInterval,
    sortPlan,
    sortDirection,
    setSortPlan,
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

      const plans = Object.fromEntries(
        PLAN_ORDER.map((planKey) => {
          const originalAmount = getPlanAmount(
            currency_config,
            planKey,
            billingInterval
          );
          const convertedAmount =
            originalAmount !== null && exchangeRates
              ? convertPrice(originalAmount, localCurrency, displayCurrency, rates)
              : null;
          return [planKey, { originalAmount, convertedAmount }];
        })
      ) as Record<
        PlanKey,
        { originalAmount: number | null; convertedAmount: number | null }
      >;

      let name = cc;
      try {
        name = countryNames?.of(cc) ?? cc;
      } catch {
        // Non-standard codes like "US2", "EU", "XK" throw RangeError
      }

      return {
        countryCode: cc,
        countryName: name,
        flag: getCountryFlag(cc),
        currencyCode: localCurrency,
        currencySymbol: currency_config.symbol,
        plans,
      };
    });
  }, [configs, exchangeRates, displayCurrency, billingInterval, i18n.language]);

  const sortedRows = useMemo(() => {
    const sorted = [...rows].sort((a, b) => {
      if (sortPlan === "country") {
        return a.countryName.localeCompare(b.countryName);
      }
      if (sortPlan === "currency") {
        return a.currencyCode.localeCompare(b.currencyCode);
      }
      const planKey = sortPlan as PlanKey;
      const aVal =
        a.plans[planKey]?.convertedAmount ??
        a.plans[planKey]?.originalAmount ??
        Infinity;
      const bVal =
        b.plans[planKey]?.convertedAmount ??
        b.plans[planKey]?.originalAmount ??
        Infinity;
      return aVal - bVal;
    });
    if (sortDirection === "descending") sorted.reverse();
    return sorted.map((row, idx) => ({ ...row, rank: idx + 1 }));
  }, [rows, sortPlan, sortDirection]);

  const handleSort = (column: string) => {
    if (column === "rank") return;
    if (sortPlan === column) {
      setSortDirection(sortDirection === "ascending" ? "descending" : "ascending");
    } else {
      setSortPlan(column);
      setSortDirection("ascending");
    }
  };

  const columns = [
    { key: "rank", label: t("columns.rank"), sortable: false },
    { key: "country", label: t("columns.country"), sortable: true },
    { key: "currency", label: t("columns.currency"), sortable: true },
    ...PLAN_ORDER.map((planKey) => ({
      key: planKey,
      label: t(PLAN_LABEL_KEYS[planKey]),
      sortable: true,
    })),
  ];

  return (
    <div className="flex flex-col gap-3">
      {exchangeRateError && (
        <Chip color="warning" variant="soft" size="sm">
          {t("ui.exchangeRateError")}
        </Chip>
      )}
      <div className="flex items-center gap-2">
        <span className="text-xs text-zinc-500 dark:text-zinc-400">
          {t("billing.label")}:
        </span>
        <div className="inline-flex rounded-lg border border-zinc-200 dark:border-zinc-700 overflow-hidden">
          <Button
            variant={billingInterval === "month" ? "primary" : "tertiary"}
            size="sm"
            onPress={() => setBillingInterval("month")}
          >
            {t("billing.monthly")}
          </Button>
          <Button
            variant={billingInterval === "year" ? "primary" : "tertiary"}
            size="sm"
            onPress={() => setBillingInterval("year")}
          >
            {t("billing.annual")}
          </Button>
        </div>
      </div>
      <div className="overflow-x-auto rounded-xl border border-zinc-200 dark:border-zinc-800">
        <table className="w-full text-sm" aria-label={t("app.title")}>
          <thead className="sticky top-0 z-10 bg-zinc-100 dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800">
            <tr>
              {columns.map((col) => (
                <th
                  key={col.key}
                  className={`px-3 py-2.5 text-left text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400 whitespace-nowrap ${
                    col.sortable
                      ? "cursor-pointer select-none hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
                      : ""
                  } ${sortPlan === col.key ? "text-zinc-900 dark:text-zinc-100" : ""}`}
                  onClick={() => col.sortable && handleSort(col.key)}
                  aria-sort={
                    sortPlan === col.key
                      ? sortDirection === "ascending"
                        ? "ascending"
                        : "descending"
                      : undefined
                  }
                >
                  <span className="inline-flex items-center gap-1">
                    {col.label}
                    {sortPlan === col.key && (
                      sortDirection === "ascending"
                        ? <ArrowUp size={11} weight="bold" />
                        : <ArrowDown size={11} weight="bold" />
                    )}
                  </span>
                </th>
              ))}
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
                <td className="px-3 py-2">
                  <span className="font-mono text-xs text-zinc-400 dark:text-zinc-500">
                    {row.rank}
                  </span>
                </td>
                <td className="px-3 py-2">
                  <span className="whitespace-nowrap text-sm font-medium text-zinc-800 dark:text-zinc-200">
                    {row.flag} {row.countryName}
                  </span>
                </td>
                <td className="px-3 py-2">
                  <span className="font-mono text-xs text-zinc-500 dark:text-zinc-400">
                    {row.currencyCode}
                  </span>
                </td>
                {PLAN_ORDER.map((planKey) => {
                  const planData = row.plans[planKey];
                  return (
                    <td key={planKey} className="px-3 py-2">
                      <PlanCell
                        convertedAmount={planData?.convertedAmount ?? null}
                        originalAmount={planData?.originalAmount ?? null}
                        displayCurrency={displayCurrency}
                        localCurrency={row.currencyCode}
                        localSymbol={row.currencySymbol}
                        locale={i18n.language}
                      />
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
