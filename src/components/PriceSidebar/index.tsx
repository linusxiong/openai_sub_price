import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import type { CountryConfig } from "../../types/pricing";
import type { ExchangeRateData } from "../../services/exchange-rates";
import { getPlanAmount } from "../../utils/plans";
import { convertPrice } from "../../utils/currency";
import { usePreferences } from "../../store/preferences";
import { LowestPriceCard } from "./LowestPriceCard";
import { PriceDistribution } from "./PriceDistribution";

interface PriceSidebarProps {
  configs: Map<string, CountryConfig>;
  exchangeRates: ExchangeRateData | undefined;
}

function getCountryFlag(code: string): string {
  if (code.length !== 2) return "";
  const offset = 127397;
  return String.fromCodePoint(
    code.charCodeAt(0) + offset,
    code.charCodeAt(1) + offset
  );
}

export function PriceSidebar({ configs, exchangeRates }: PriceSidebarProps) {
  const { i18n } = useTranslation();
  const { displayCurrency, activePlan, billingInterval } = usePreferences();

  const priceRows = useMemo(() => {
    let countryNames: Intl.DisplayNames | null = null;
    try {
      countryNames = new Intl.DisplayNames([i18n.language], { type: "region" });
    } catch {
      countryNames = new Intl.DisplayNames(["en"], { type: "region" });
    }

    const rates = exchangeRates?.rates ?? {};
    const rows: {
      countryCode: string;
      countryName: string;
      flag: string;
      convertedPrice: number;
    }[] = [];

    configs.forEach((config, cc) => {
      const { currency_config } = config;
      const localCurrency = currency_config.symbol_code;
      const originalAmount = getPlanAmount(currency_config, activePlan, billingInterval);
      if (originalAmount === null) return;

      const convertedPrice = exchangeRates
        ? convertPrice(originalAmount, localCurrency, displayCurrency, rates)
        : originalAmount;

      let name = cc;
      try {
        name = countryNames?.of(cc) ?? cc;
      } catch {
        // Non-standard codes like US2, EU, XK
      }

      rows.push({
        countryCode: cc,
        countryName: name,
        flag: getCountryFlag(cc),
        convertedPrice,
      });
    });

    return rows.sort((a, b) => a.convertedPrice - b.convertedPrice);
  }, [configs, exchangeRates, displayCurrency, activePlan, billingInterval, i18n.language]);

  if (priceRows.length === 0) return null;

  const lowest = priceRows[0];
  const highest = priceRows[priceRows.length - 1];

  return (
    <div className="flex flex-col gap-3 w-full">
      <LowestPriceCard
        lowestPrice={lowest.convertedPrice}
        lowestCountryName={lowest.countryName}
        lowestFlag={lowest.flag}
        highestPrice={highest.convertedPrice}
        displayCurrency={displayCurrency}
        locale={i18n.language}
      />
      <PriceDistribution
        rows={priceRows}
        displayCurrency={displayCurrency}
        locale={i18n.language}
      />
    </div>
  );
}
