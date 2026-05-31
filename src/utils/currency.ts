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

// Maps ISO 4217 currency code → [flag emoji, English country/region name]
export const CURRENCY_META: Record<string, { flag: string; name: string }> = {
  USD: { flag: "🇺🇸", name: "United States" },
  EUR: { flag: "🇪🇺", name: "Euro Zone" },
  GBP: { flag: "🇬🇧", name: "United Kingdom" },
  JPY: { flag: "🇯🇵", name: "Japan" },
  CNY: { flag: "🇨🇳", name: "China" },
  AUD: { flag: "🇦🇺", name: "Australia" },
  CAD: { flag: "🇨🇦", name: "Canada" },
  CHF: { flag: "🇨🇭", name: "Switzerland" },
  HKD: { flag: "🇭🇰", name: "Hong Kong" },
  SGD: { flag: "🇸🇬", name: "Singapore" },
  KRW: { flag: "🇰🇷", name: "South Korea" },
  INR: { flag: "🇮🇳", name: "India" },
  BRL: { flag: "🇧🇷", name: "Brazil" },
  MXN: { flag: "🇲🇽", name: "Mexico" },
  SEK: { flag: "🇸🇪", name: "Sweden" },
  NOK: { flag: "🇳🇴", name: "Norway" },
  DKK: { flag: "🇩🇰", name: "Denmark" },
  NZD: { flag: "🇳🇿", name: "New Zealand" },
  ZAR: { flag: "🇿🇦", name: "South Africa" },
  AED: { flag: "🇦🇪", name: "UAE" },
  SAR: { flag: "🇸🇦", name: "Saudi Arabia" },
  THB: { flag: "🇹🇭", name: "Thailand" },
  MYR: { flag: "🇲🇾", name: "Malaysia" },
  IDR: { flag: "🇮🇩", name: "Indonesia" },
  PHP: { flag: "🇵🇭", name: "Philippines" },
  TWD: { flag: "🇹🇼", name: "Taiwan" },
  TRY: { flag: "🇹🇷", name: "Turkey" },
  PLN: { flag: "🇵🇱", name: "Poland" },
  CZK: { flag: "🇨🇿", name: "Czech Republic" },
  HUF: { flag: "🇭🇺", name: "Hungary" },
  ILS: { flag: "🇮🇱", name: "Israel" },
  EGP: { flag: "🇪🇬", name: "Egypt" },
  NGN: { flag: "🇳🇬", name: "Nigeria" },
  KES: { flag: "🇰🇪", name: "Kenya" },
  PKR: { flag: "🇵🇰", name: "Pakistan" },
  BDT: { flag: "🇧🇩", name: "Bangladesh" },
  VND: { flag: "🇻🇳", name: "Vietnam" },
  UAH: { flag: "🇺🇦", name: "Ukraine" },
  GEL: { flag: "🇬🇪", name: "Georgia" },
  KZT: { flag: "🇰🇿", name: "Kazakhstan" },
};
