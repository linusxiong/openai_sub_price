import assert from "node:assert/strict";
import test from "node:test";

import { fetchCountries, fetchCountryConfig } from "./pricing-api.ts";

test("fetches the country list only through the backend proxy", async () => {
  const originalFetch = globalThis.fetch;
  const requestedUrls = [];

  globalThis.fetch = async (url) => {
    requestedUrls.push(String(url));

    return new Response(JSON.stringify({ countries: ["US"] }), {
      headers: { "Content-Type": "application/json" },
    });
  };

  try {
    const countries = await fetchCountries();

    assert.deepEqual(countries, ["US"]);
    assert.deepEqual(requestedUrls, ["/api/proxy/countries"]);
    assert.equal(
      requestedUrls.some((url) => url.includes("chatgpt.com")),
      false
    );
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("fetches country configs only through the backend proxy", async () => {
  const originalFetch = globalThis.fetch;
  const requestedUrls = [];

  globalThis.fetch = async (url) => {
    requestedUrls.push(String(url));

    return new Response(
      JSON.stringify({
        country_code: "US",
        currency_config: { symbol_code: "USD" },
      }),
      { headers: { "Content-Type": "application/json" } }
    );
  };

  try {
    const config = await fetchCountryConfig("US");

    assert.equal(config.country_code, "US");
    assert.deepEqual(requestedUrls, ["/api/proxy/configs/US"]);
    assert.equal(
      requestedUrls.some((url) => url.includes("chatgpt.com")),
      false
    );
  } finally {
    globalThis.fetch = originalFetch;
  }
});
