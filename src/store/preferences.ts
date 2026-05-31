import { create } from "zustand";
import { persist } from "zustand/middleware";

export type BillingInterval = "month" | "year";
export type SortDirection = "ascending" | "descending";

interface PreferencesStore {
  displayCurrency: string;
  language: string;
  billingInterval: BillingInterval;
  sortPlan: string;
  sortDirection: SortDirection;
  theme: "light" | "dark" | "system";
  setDisplayCurrency: (c: string) => void;
  setLanguage: (l: string) => void;
  setBillingInterval: (i: BillingInterval) => void;
  setSortPlan: (p: string) => void;
  setSortDirection: (d: SortDirection) => void;
  setTheme: (t: "light" | "dark" | "system") => void;
}

export const usePreferences = create<PreferencesStore>()(
  persist(
    (set) => ({
      displayCurrency: "USD",
      language: "en",
      billingInterval: "month",
      sortPlan: "plus",
      sortDirection: "ascending",
      theme: "system",
      setDisplayCurrency: (displayCurrency) => set({ displayCurrency }),
      setLanguage: (language) => set({ language }),
      setBillingInterval: (billingInterval) => set({ billingInterval }),
      setSortPlan: (sortPlan) => set({ sortPlan }),
      setSortDirection: (sortDirection) => set({ sortDirection }),
      setTheme: (theme) => set({ theme }),
    }),
    { name: "openai-price-preferences" }
  )
);
