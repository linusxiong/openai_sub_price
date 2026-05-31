import { Spinner } from "@heroui/react";
import { useTranslation } from "react-i18next";
import { Header } from "./components/Header";
import { LoadingProgress } from "./components/LoadingProgress";
import { PlanTabs } from "./components/PlanTabs";
import { PriceTable } from "./components/PriceTable";
import { SkeletonTable } from "./components/PriceTable/SkeletonTable";
import { ErrorState } from "./components/PriceTable/ErrorState";
import { PriceSidebar } from "./components/PriceSidebar";
import { usePricing } from "./hooks/usePricing";
import { useExchangeRates } from "./hooks/useExchangeRates";
import { usePreferences, useHydrated } from "./store/preferences";

export default function App() {
  const { t } = useTranslation();
  const hydrated = useHydrated();
  const { displayCurrency } = usePreferences();
  const { configs, isLoading, isError, refetch, progress } = usePricing();
  const exchangeRates = useExchangeRates(displayCurrency);

  const hasData = configs.size > 0;

  if (!hydrated) {
    return (
      <div className="min-h-[100dvh] flex items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] flex flex-col bg-zinc-50 dark:bg-zinc-950">
      <Header isRefreshing={isLoading} onRefresh={refetch} />
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-5">

        {/* Initial load — no data yet */}
        {isLoading && !hasData && (
          <div className="flex flex-col items-center justify-center gap-4 py-16">
            <Spinner size="lg" />
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              {t("ui.loading")}
            </p>
          </div>
        )}

        {isError && !hasData && <ErrorState onRetry={refetch} />}

        {/* Data available (streaming or complete) */}
        {hasData && (
          <div className="flex flex-col gap-4">
            <PlanTabs />

            {/* Progress bar during streaming */}
            {isLoading && (
              <LoadingProgress
                completed={progress.completed}
                total={progress.total}
              />
            )}

            {/* Table + sidebar layout */}
            <div className="flex flex-col md:flex-row gap-4 items-start">
              <div className="flex-1 min-w-0">
                <PriceTable
                  configs={configs}
                  exchangeRates={exchangeRates.data}
                  exchangeRateError={exchangeRates.isError}
                />
              </div>
              <div className="w-full md:w-72 shrink-0">
                <PriceSidebar
                  configs={configs}
                  exchangeRates={exchangeRates.data}
                />
              </div>
            </div>
          </div>
        )}

        {/* Skeleton while first batch loads */}
        {isLoading && !hasData && configs.size === 0 && (
          <div className="mt-4">
            <SkeletonTable />
          </div>
        )}
      </main>
    </div>
  );
}
