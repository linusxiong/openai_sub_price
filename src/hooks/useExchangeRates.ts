import { useQuery } from "@tanstack/react-query";
import { fetchExchangeRates } from "../services/exchange-rates";

export function useExchangeRates(baseCurrency: string) {
  return useQuery({
    queryKey: ["exchangeRates", baseCurrency],
    queryFn: () => fetchExchangeRates(baseCurrency),
    staleTime: 60 * 60 * 1000,
    retry: 2,
  });
}
