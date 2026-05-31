import { useQuery } from "@tanstack/react-query";
import { useRef, useCallback } from "react";
import { fetchCountries, fetchAllConfigs } from "../services/pricing-api";
import type { CountryConfig } from "../types/pricing";

export interface PricingProgress {
  completed: number;
  total: number;
}

export function usePricing() {
  const progressRef = useRef<PricingProgress>({ completed: 0, total: 0 });

  const handleProgress = useCallback((completed: number, total: number) => {
    progressRef.current = { completed, total };
  }, []);

  const countriesQuery = useQuery({
    queryKey: ["countries"],
    queryFn: fetchCountries,
    staleTime: 10 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
  });

  const configsQuery = useQuery({
    queryKey: ["configs"],
    queryFn: async () => {
      const countries = countriesQuery.data;
      if (!countries) return new Map<string, CountryConfig>();
      progressRef.current = { completed: 0, total: countries.length };
      return fetchAllConfigs(countries, handleProgress);
    },
    enabled: !!countriesQuery.data,
    staleTime: 10 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
  });

  return {
    configs: configsQuery.data ?? new Map<string, CountryConfig>(),
    countries: countriesQuery.data ?? [],
    isLoading: countriesQuery.isLoading || configsQuery.isLoading,
    isFetching: countriesQuery.isFetching || configsQuery.isFetching,
    isError: countriesQuery.isError || configsQuery.isError,
    error: countriesQuery.error ?? configsQuery.error,
    refetch: () => {
      countriesQuery.refetch();
      configsQuery.refetch();
    },
    progress: progressRef.current,
  };
}
