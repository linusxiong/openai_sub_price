export function convertPrice(
  amount: number,
  fromCurrency: string,
  toCurrency: string,
  rates: Record<string, number>
): number {
  if (fromCurrency.toLowerCase() === toCurrency.toLowerCase()) return amount;
  const rate = rates[fromCurrency.toLowerCase()];
  if (!rate || rate === 0) return amount;
  return amount / rate;
}

export function formatCurrency(
  amount: number,
  currencyCode: string,
  locale = "en"
): string {
  try {
    return new Intl.NumberFormat(locale, {
      style: "currency",
      currency: currencyCode,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  } catch {
    return `${currencyCode} ${amount.toFixed(2)}`;
  }
}

export const CURRENCY_OPTIONS = [
  "USD", "EUR", "GBP", "JPY", "CNY", "AUD", "CAD", "CHF",
  "HKD", "SGD", "KRW", "INR", "BRL", "MXN", "SEK", "NOK",
  "DKK", "NZD", "ZAR", "AED", "SAR", "THB", "MYR", "IDR",
  "PHP", "TWD", "TRY", "PLN", "CZK", "HUF", "ILS", "EGP",
  "NGN", "KES", "PKR", "BDT", "VND", "UAH", "GEL", "KZT",
] as const;
