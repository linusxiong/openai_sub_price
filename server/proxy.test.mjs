import assert from "node:assert/strict";
import test from "node:test";

import { handleApiProxyRequest } from "./proxy.ts";

test("proxies pricing API requests through the self-hosted TypeScript backend", async () => {
  let requestedUrl = "";

  const fetchPricing = async (url, init) => {
    requestedUrl = String(url);
    assert.equal(init.headers.get("Accept"), "application/json");

    return new Response(JSON.stringify({ countries: ["US"] }), {
      headers: { "Content-Type": "application/json" },
    });
  };

  const response = await handleApiProxyRequest(
    new Request("http://localhost:8787/api/proxy/countries"),
    fetchPricing
  );

  assert.equal(
    requestedUrl,
    "https://chatgpt.com/backend-api/checkout_pricing_config/countries"
  );
  assert.equal(response.status, 200);
  assert.equal(response.headers.get("Access-Control-Allow-Origin"), "*");
  assert.deepEqual(await response.json(), { countries: ["US"] });
});

test("answers CORS preflight requests", async () => {
  const response = await handleApiProxyRequest(
    new Request("http://localhost:8787/api/proxy/countries", {
      method: "OPTIONS",
    })
  );

  assert.equal(response.status, 204);
  assert.equal(response.headers.get("Access-Control-Allow-Methods"), "GET, OPTIONS");
});
