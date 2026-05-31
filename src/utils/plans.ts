import type { PlanKey, BillingInterval, CurrencyConfig } from "../types/pricing";

export const PLAN_ORDER: PlanKey[] = [
  "free",
  "go",
  "plus",
  "prolite",
  "pro",
  "business",
  "business_non_profit",
];

export const PLAN_LABEL_KEYS: Record<PlanKey, string> = {
  free: "plans.free",
  go: "plans.go",
  plus: "plans.plus",
  prolite: "plans.prolite",
  pro: "plans.pro",
  business: "plans.business",
  business_non_profit: "plans.nonProfit",
};

export const ANNUAL_PLANS: PlanKey[] = ["plus", "business", "business_non_profit"];

export function getPlanAmount(
  currencyConfig: CurrencyConfig,
  planKey: PlanKey,
  interval: BillingInterval
): number | null {
  const plan = currencyConfig[planKey];
  if (!plan) return null;
  const intervalData = plan[interval] ?? plan.month;
  if (!intervalData) return null;
  return intervalData.amount;
}
