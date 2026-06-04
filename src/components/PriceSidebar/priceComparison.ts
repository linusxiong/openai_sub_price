import type { BillingInterval, CountryConfig, PlanKey } from "../../types/pricing";
import type { ExchangeRateData } from "../../services/exchange-rates";
import { convertPrice } from "../../utils/currency.ts";
import { getPlanAmount } from "../../utils/plans.ts";

interface UsReferencePriceInput {
  configs: Map<string, CountryConfig>;
  activePlan: PlanKey;
  billingInterval: BillingInterval;
  displayCurrency: string;
  exchangeRates: ExchangeRateData | undefined;
}

export function calculateSavingsPct(
  price: number,
  referencePrice: number | null
): number {
  if (!referencePrice || referencePrice <= 0 || price >= referencePrice) {
    return 0;
  }

  return Math.round(((referencePrice - price) / referencePrice) * 100);
}

export function getUsReferencePrice({
  configs,
  activePlan,
  billingInterval,
  displayCurrency,
  exchangeRates,
}: UsReferencePriceInput): number | null {
  const usConfig = configs.get("US");
  if (!usConfig) return null;

  const { currency_config } = usConfig;
  const amount = getPlanAmount(currency_config, activePlan, billingInterval);
  if (amount === null) return null;

  return exchangeRates
    ? convertPrice(
        amount,
        currency_config.symbol_code,
        displayCurrency,
        exchangeRates.rates
      )
    : amount;
}
