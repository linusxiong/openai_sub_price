import { Spinner } from "@heroui/react";
import { useTranslation } from "react-i18next";
import { Header } from "./components/Header";
import { LoadingProgress } from "./components/LoadingProgress";
import { PriceTable } from "./components/PriceTable";
import { ErrorState } from "./components/PriceTable/ErrorState";
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
    <div className="min-h-[100dvh] flex flex-col">
      <Header />
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 py-6">
        {isLoading && !hasData && (
          <div className="flex flex-col items-center justify-center gap-4 py-24">
            <Spinner size="lg" />
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              {t("ui.loading")}
            </p>
          </div>
        )}
        {isError && !hasData && <ErrorState onRetry={refetch} />}
        {hasData && (
          <>
            {isLoading && (
              <LoadingProgress
                completed={progress.completed}
                total={progress.total}
              />
            )}
            <PriceTable
              configs={configs}
              exchangeRates={exchangeRates.data}
              exchangeRateError={exchangeRates.isError}
            />
          </>
        )}
      </main>
    </div>
  );
}
