import { create } from "zustand";
import { persist } from "zustand/middleware";
import { useState, useEffect } from "react";
import type { PlanKey } from "../types/pricing";

export type BillingInterval = "month" | "year";
export type SortDirection = "ascending" | "descending";

interface PreferencesStore {
  displayCurrency: string;
  language: string;
  activePlan: PlanKey;
  billingInterval: BillingInterval;
  sortDirection: SortDirection;
  theme: "light" | "dark" | "system";
  setDisplayCurrency: (c: string) => void;
  setLanguage: (l: string) => void;
  setActivePlan: (p: PlanKey) => void;
  setBillingInterval: (i: BillingInterval) => void;
  setSortDirection: (d: SortDirection) => void;
  setTheme: (t: "light" | "dark" | "system") => void;
}

export const usePreferences = create<PreferencesStore>()(
  persist(
    (set) => ({
      displayCurrency: "USD",
      language: "en",
      activePlan: "plus",
      billingInterval: "month",
      sortDirection: "ascending",
      theme: "system",
      setDisplayCurrency: (displayCurrency) => set({ displayCurrency }),
      setLanguage: (language) => set({ language }),
      setActivePlan: (activePlan) => set({ activePlan }),
      setBillingInterval: (billingInterval) => set({ billingInterval }),
      setSortDirection: (sortDirection) => set({ sortDirection }),
      setTheme: (theme) => set({ theme }),
    }),
    { name: "openai-price-preferences" }
  )
);

// Initialise synchronously — Zustand persist with localStorage hydrates
// synchronously, so hasHydrated() is true on the very first render.
// Using a lazy initialiser avoids the false→true flash that caused sort flicker.
export function useHydrated() {
  const [hydrated, setHydrated] = useState(
    () => usePreferences.persist.hasHydrated()
  );
  useEffect(() => {
    if (hydrated) return;
    const unsub = usePreferences.persist.onFinishHydration(() =>
      setHydrated(true)
    );
    return unsub;
  }, [hydrated]);
  return hydrated;
}
