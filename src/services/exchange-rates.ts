const PRIMARY_CDN =
  "https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@latest/v1/currencies";
const FALLBACK_CDN =
  "https://latest.currency-api.pages.dev/v1/currencies";

export interface ExchangeRateData {
  date: string;
  rates: Record<string, number>;
}

export async function fetchExchangeRates(
  baseCurrency: string
): Promise<ExchangeRateData> {
  const base = baseCurrency.toLowerCase();

  const tryFetch = async (baseUrl: string): Promise<ExchangeRateData> => {
    const res = await fetch(`${baseUrl}/${base}.json`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    return {
      date: data.date as string,
      rates: data[base] as Record<string, number>,
    };
  };

  try {
    return await tryFetch(PRIMARY_CDN);
  } catch {
    return await tryFetch(FALLBACK_CDN);
  }
}
