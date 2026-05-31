import { useTranslation } from "react-i18next";
import { usePreferences } from "../store/preferences";
import { CURRENCY_OPTIONS } from "../utils/currency";

export function CurrencySelector() {
  const { t } = useTranslation();
  const { displayCurrency, setDisplayCurrency } = usePreferences();

  return (
    <select
      aria-label={t("ui.currencyLabel")}
      value={displayCurrency}
      onChange={(e) => setDisplayCurrency(e.target.value)}
      className="h-8 px-2 text-sm rounded-md border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
    >
      {CURRENCY_OPTIONS.map((code) => (
        <option key={code} value={code}>
          {code}
        </option>
      ))}
    </select>
  );
}
