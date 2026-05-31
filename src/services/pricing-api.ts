import type { CountriesResponse, CountryConfig } from "../types/pricing";

const DIRECT_BASE = "https://chatgpt.com/backend-api/checkout_pricing_config";
// API proxy is intentionally disabled while testing Cloudflare Pages-only
// deployment and browser CORS behavior.
// const PROXY_BASE = "/api/proxy";

async function fetchWithFallback<T>(path: string): Promise<T> {
  try {
    const res = await fetch(`${DIRECT_BASE}${path}`, {
      headers: { Accept: "application/json" },
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const contentType = res.headers.get("content-type") ?? "";
    if (!contentType.includes("application/json")) throw new Error("Not JSON");
    return res.json() as Promise<T>;
  } catch {
    // Temporarily disabled:
    // try {
    //   const res = await fetch(`${PROXY_BASE}${path}`, {
    //     headers: { Accept: "application/json" },
    //   });
    //   if (!res.ok) throw new Error(`Proxy HTTP ${res.status}`);
    //   return res.json() as Promise<T>;
    // } catch {
    //   const snapshotPath = path.includes("/countries")
    //     ? "/data/fallback/countries.json"
    //     : `/data/fallback/${path.split("/").pop()}.json`;
    //   const res = await fetch(snapshotPath);
    //   if (!res.ok) throw new Error("All fetch strategies failed");
    //   return res.json() as Promise<T>;
    // }
    throw new Error("Direct pricing fetch failed");
  }
}

export async function fetchCountries(): Promise<string[]> {
  const data = await fetchWithFallback<CountriesResponse>("/countries");
  return data.countries;
}

export async function fetchCountryConfig(
  countryCode: string
): Promise<CountryConfig> {
  return fetchWithFallback<CountryConfig>(`/configs/${countryCode}`);
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
