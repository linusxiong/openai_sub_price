import { Header } from "./components/Header";
import { LoadingProgress } from "./components/LoadingProgress";
import { PriceTable } from "./components/PriceTable";
import { SkeletonTable } from "./components/PriceTable/SkeletonTable";
import { ErrorState } from "./components/PriceTable/ErrorState";
import { usePricing } from "./hooks/usePricing";
import { useExchangeRates } from "./hooks/useExchangeRates";
import { usePreferences } from "./store/preferences";

export default function App() {
  const { displayCurrency } = usePreferences();
  const { configs, isLoading, isError, refetch, progress } = usePricing();
  const exchangeRates = useExchangeRates(displayCurrency);

  const hasData = configs.size > 0;

  return (
    <div className="min-h-[100dvh] flex flex-col">
      <Header />
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 py-6">
        {isLoading && !hasData && (
          <>
            <LoadingProgress
              completed={progress.completed}
              total={progress.total}
            />
            <SkeletonTable />
          </>
        )}
        {isError && !hasData && <ErrorState onRetry={refetch} />}
        {hasData && (
          <PriceTable
            configs={configs}
            exchangeRates={exchangeRates.data}
            exchangeRateError={exchangeRates.isError}
          />
        )}
      </main>
    </div>
  );
}
