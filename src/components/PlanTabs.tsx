import { useTranslation } from "react-i18next";
import { usePreferences } from "../store/preferences";
import { PLAN_ORDER, PLAN_LABEL_KEYS, ANNUAL_PLANS } from "../utils/plans";

export function PlanTabs() {
  const { t } = useTranslation();
  const { activePlan, setActivePlan, billingInterval, setBillingInterval } =
    usePreferences();

  return (
    <div className="flex flex-col gap-3">
      {/* Plan tabs — horizontal scroll on mobile */}
      <div className="flex gap-1 overflow-x-auto pb-1 scrollbar-none">
        {PLAN_ORDER.map((planKey) => {
          const isActive = activePlan === planKey;
          return (
            <button
              key={planKey}
              onClick={() => setActivePlan(planKey)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-colors shrink-0 ${
                isActive
                  ? "bg-zinc-900 text-white dark:bg-zinc-50 dark:text-zinc-900"
                  : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800"
              }`}
              aria-pressed={isActive}
            >
              {t(PLAN_LABEL_KEYS[planKey])}
              {ANNUAL_PLANS.includes(planKey) && billingInterval === "year" && (
                <span
                  className={`text-[10px] px-1 py-0.5 rounded font-semibold ${
                    isActive
                      ? "bg-white/20 text-white dark:bg-black/20 dark:text-zinc-900"
                      : "bg-zinc-200 dark:bg-zinc-700 text-zinc-600 dark:text-zinc-300"
                  }`}
                >
                  {t("billing.annualShort")}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Billing interval toggle */}
      <div className="flex items-center gap-2">
        <span className="text-xs text-zinc-500 dark:text-zinc-400">
          {t("billing.label")}:
        </span>
        <div className="inline-flex rounded-lg border border-zinc-200 dark:border-zinc-700 overflow-hidden text-xs">
          <button
            onClick={() => setBillingInterval("month")}
            className={`px-3 py-1.5 font-medium transition-colors ${
              billingInterval === "month"
                ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900"
                : "bg-white dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800"
            }`}
          >
            {t("billing.monthly")}
          </button>
          <button
            onClick={() => setBillingInterval("year")}
            className={`px-3 py-1.5 font-medium transition-colors ${
              billingInterval === "year"
                ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900"
                : "bg-white dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800"
            }`}
          >
            {t("billing.annual")}
          </button>
        </div>
      </div>
    </div>
  );
}
