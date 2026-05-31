import { useState, useEffect, useCallback, useRef } from "react";
import { fetchCountries, fetchCountryConfig } from "../services/pricing-api";
import type { CountryConfig } from "../types/pricing";

export interface PricingProgress {
  completed: number;
  total: number;
}

const CACHE_KEY = "pricing-cache";
const CACHE_TTL = 10 * 60 * 1000;

interface CacheEntry {
  data: Record<string, CountryConfig>;
  timestamp: number;
}

function loadCache(): Map<string, CountryConfig> | null {
  try {
    const raw = sessionStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const entry: CacheEntry = JSON.parse(raw);
    if (Date.now() - entry.timestamp > CACHE_TTL) {
      sessionStorage.removeItem(CACHE_KEY);
      return null;
    }
    return new Map(Object.entries(entry.data));
  } catch {
    return null;
  }
}

function saveCache(configs: Map<string, CountryConfig>) {
  try {
    const entry: CacheEntry = {
      data: Object.fromEntries(configs),
      timestamp: Date.now(),
    };
    sessionStorage.setItem(CACHE_KEY, JSON.stringify(entry));
  } catch {
    // sessionStorage full or unavailable
  }
}

export function usePricing() {
  const [configs, setConfigs] = useState<Map<string, CountryConfig>>(() => {
    return loadCache() ?? new Map();
  });
  const [progress, setProgress] = useState<PricingProgress>({ completed: 0, total: 0 });
  const [isLoading, setIsLoading] = useState(() => !loadCache());
  const [isError, setIsError] = useState(false);
  const abortRef = useRef(false);

  const fetchData = useCallback(async () => {
    abortRef.current = false;
    setIsError(false);
    setIsLoading(true);
    setConfigs(new Map());
    setProgress({ completed: 0, total: 0 });

    try {
      const countries = await fetchCountries();
      if (abortRef.current) return;

      setProgress({ completed: 0, total: countries.length });
      const batchSize = 20;

      for (let i = 0; i < countries.length; i += batchSize) {
        if (abortRef.current) return;

        const batch = countries.slice(i, i + batchSize);
        const settled = await Promise.allSettled(
          batch.map((cc) => fetchCountryConfig(cc))
        );

        if (abortRef.current) return;

        setConfigs((prev) => {
          const next = new Map(prev);
          settled.forEach((result, idx) => {
            if (result.status === "fulfilled") {
              next.set(batch[idx], result.value);
            }
          });
          return next;
        });

        const completed = Math.min(i + batchSize, countries.length);
        setProgress({ completed, total: countries.length });
      }

      setIsLoading(false);
      setConfigs((final) => {
        saveCache(final);
        return final;
      });
    } catch {
      if (!abortRef.current) {
        setIsError(true);
        setIsLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    const cached = loadCache();
    if (cached && cached.size > 0) {
      setConfigs(cached);
      setIsLoading(false);
      return;
    }
    fetchData();
    return () => {
      abortRef.current = true;
    };
  }, [fetchData]);

  const refetch = useCallback(() => {
    sessionStorage.removeItem(CACHE_KEY);
    fetchData();
  }, [fetchData]);

  return {
    configs,
    isLoading,
    isError,
    refetch,
    progress,
  };
}
