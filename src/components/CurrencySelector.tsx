import { useTranslation } from "react-i18next";
import { usePreferences } from "../store/preferences";
import { CURRENCY_OPTIONS, CURRENCY_META } from "../utils/currency";

export function CurrencySelector() {
  const { t } = useTranslation();
  const { displayCurrency, setDisplayCurrency } = usePreferences();

  const meta = CURRENCY_META[displayCurrency];

  return (
    <div className="relative flex items-center">
      {/* Trigger button showing selected currency with flag */}
      <div className="relative">
        {meta && (
          <span className="absolute left-2 top-1/2 -translate-y-1/2 text-base pointer-events-none select-none">
            {meta.flag}
          </span>
        )}
        <select
          aria-label={t("ui.currencyLabel")}
          value={displayCurrency}
          onChange={(e) => setDisplayCurrency(e.target.value)}
          className={`h-8 pr-2 text-sm rounded-md border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none cursor-pointer ${meta ? "pl-8" : "pl-2"}`}
        >
          {CURRENCY_OPTIONS.map((code) => {
            const m = CURRENCY_META[code];
            return (
              <option key={code} value={code}>
                {m ? `${m.flag} ${m.name} (${code})` : code}
              </option>
            );
          })}
        </select>
      </div>
    </div>
  );
}
