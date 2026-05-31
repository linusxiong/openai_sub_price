import type { CountriesResponse, CountryConfig } from "../types/pricing";

const PROXY_BASE = "/api/proxy";

async function fetchFromBackend<T>(path: string): Promise<T> {
  const res = await fetch(`${PROXY_BASE}${path}`, {
    headers: { Accept: "application/json" },
  });
  if (!res.ok) throw new Error(`Proxy HTTP ${res.status}`);
  return res.json() as Promise<T>;
}

export async function fetchCountries(): Promise<string[]> {
  const data = await fetchFromBackend<CountriesResponse>("/countries");
  return data.countries;
}

export async function fetchCountryConfig(
  countryCode: string
): Promise<CountryConfig> {
  return fetchFromBackend<CountryConfig>(`/configs/${countryCode}`);
}

export async function fetchAllConfigs(
  countries: string[],
  onProgress: (completed: number, total: number) => void,
  batchSize = 20
): Promise<Map<string, CountryConfig>> {
  const results = new Map<string, CountryConfig>();
  let completed = 0;

  for (let i = 0; i < countries.length; i += batchSize) {
    const batch = countries.slice(i, i + batchSize);
    const settled = await Promise.allSettled(
      batch.map((cc) => fetchCountryConfig(cc))
    );
    settled.forEach((result, idx) => {
      if (result.status === "fulfilled") {
        results.set(batch[idx], result.value);
      }
    });
    completed += batch.length;
    onProgress(Math.min(completed, countries.length), countries.length);
  }

  return results;
}
