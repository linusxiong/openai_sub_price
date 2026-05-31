import { useQuery } from "@tanstack/react-query";
import { useState, useCallback } from "react";
import { fetchCountries, fetchAllConfigs } from "../services/pricing-api";
import type { CountryConfig } from "../types/pricing";

export interface PricingProgress {
  completed: number;
  total: number;
}

export function usePricing() {
  const [progress, setProgress] = useState<PricingProgress>({
    completed: 0,
    total: 0,
  });

  const handleProgress = useCallback((completed: number, total: number) => {
    setProgress({ completed, total });
  }, []);

  const countriesQuery = useQuery({
    queryKey: ["countries"],
    queryFn: fetchCountries,
    staleTime: 5 * 60 * 1000,
  });

  const configsQuery = useQuery({
    queryKey: ["configs", countriesQuery.data],
    queryFn: async () => {
      if (!countriesQuery.data) return new Map<string, CountryConfig>();
      setProgress({ completed: 0, total: countriesQuery.data.length });
      return fetchAllConfigs(countriesQuery.data, handleProgress);
    },
    enabled: !!countriesQuery.data,
    staleTime: 5 * 60 * 1000,
  });

  return {
    configs: configsQuery.data ?? new Map<string, CountryConfig>(),
    countries: countriesQuery.data ?? [],
    isLoading: countriesQuery.isLoading || configsQuery.isLoading,
    isError: countriesQuery.isError || configsQuery.isError,
    error: countriesQuery.error ?? configsQuery.error,
    refetch: () => {
      countriesQuery.refetch();
      configsQuery.refetch();
    },
    progress,
  };
}
