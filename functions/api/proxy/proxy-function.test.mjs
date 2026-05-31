import assert from "node:assert/strict";
import test from "node:test";

import { onRequest } from "./[[path]].ts";

test("proxies a pricing API path to the upstream endpoint", async () => {
  const originalFetch = globalThis.fetch;
  let requestedUrl = "";

  globalThis.fetch = async (url, init) => {
    requestedUrl = String(url);
    assert.equal(init.headers.get("Accept"), "application/json");

    return new Response(JSON.stringify({ countries: ["US"] }), {
      headers: { "Content-Type": "application/json" },
    });
  };

  try {
    const response = await onRequest({
      request: new Request("https://example.com/api/proxy/countries"),
      params: { path: ["countries"] },
    });

    assert.equal(
      requestedUrl,
      "https://chatgpt.com/backend-api/checkout_pricing_config/countries"
    );
    assert.equal(response.status, 200);
    assert.equal(response.headers.get("Access-Control-Allow-Origin"), "*");
    assert.deepEqual(await response.json(), { countries: ["US"] });
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("answers CORS preflight requests", async () => {
  const response = await onRequest({
    request: new Request("https://example.com/api/proxy/countries", {
      method: "OPTIONS",
    }),
    params: { path: ["countries"] },
  });

  assert.equal(response.status, 204);
  assert.equal(response.headers.get("Access-Control-Allow-Methods"), "GET, OPTIONS");
});
