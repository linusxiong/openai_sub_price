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

test("serves cached pricing responses for one day before refreshing", async () => {
  const cache = new Map();
  let now = 1_000;
  let upstreamCalls = 0;

  const fetchPricing = async () => {
    upstreamCalls += 1;

    return new Response(JSON.stringify({ call: upstreamCalls }), {
      headers: { "Content-Type": "application/json" },
    });
  };

  const first = await handleApiProxyRequest(
    new Request("http://localhost:8787/api/proxy/countries"),
    fetchPricing,
    { cache, now: () => now }
  );
  const second = await handleApiProxyRequest(
    new Request("http://localhost:8787/api/proxy/countries"),
    fetchPricing,
    { cache, now: () => now + 86_400_000 - 1 }
  );

  now += 86_400_000;

  const third = await handleApiProxyRequest(
    new Request("http://localhost:8787/api/proxy/countries"),
    fetchPricing,
    { cache, now: () => now }
  );

  assert.equal(upstreamCalls, 2);
  assert.deepEqual(await first.json(), { call: 1 });
  assert.deepEqual(await second.json(), { call: 1 });
  assert.deepEqual(await third.json(), { call: 2 });
  assert.equal(second.headers.get("X-Cache"), "HIT");
  assert.equal(third.headers.get("X-Cache"), "MISS");
});

test("keeps pricing cache entries isolated by proxied path", async () => {
  const cache = new Map();
  const requestedUrls = [];

  const fetchPricing = async (url) => {
    requestedUrls.push(String(url));

    return new Response(JSON.stringify({ url: String(url) }), {
      headers: { "Content-Type": "application/json" },
    });
  };

  await handleApiProxyRequest(
    new Request("http://localhost:8787/api/proxy/countries"),
    fetchPricing,
    { cache }
  );
  await handleApiProxyRequest(
    new Request("http://localhost:8787/api/proxy/configs/US"),
    fetchPricing,
    { cache }
  );
  await handleApiProxyRequest(
    new Request("http://localhost:8787/api/proxy/countries"),
    fetchPricing,
    { cache }
  );

  assert.deepEqual(requestedUrls, [
    "https://chatgpt.com/backend-api/checkout_pricing_config/countries",
    "https://chatgpt.com/backend-api/checkout_pricing_config/configs/US",
  ]);
});
