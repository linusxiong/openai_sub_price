import assert from "node:assert/strict";
import test from "node:test";

import { fetchPricingWithBrowser, onRequest } from "./[[path]].ts";

test("fetches a pricing API path through Browser Run", async () => {
  const calls = [];
  let closed = false;
  const browserBinding = {};
  const launchBrowser = async (binding) => {
    assert.equal(binding, browserBinding);

    return {
      async newPage() {
        return {
          async setUserAgent(userAgent) {
            calls.push(["userAgent", userAgent.includes("Chrome")]);
          },
          async setViewport(viewport) {
            calls.push(["viewport", viewport]);
          },
          async setExtraHTTPHeaders(headers) {
            calls.push(["headers", headers]);
          },
          async goto(url, options) {
            calls.push(["goto", url, options.waitUntil]);
          },
          async evaluate(fn) {
            calls.push(["evaluate", typeof fn]);
            return JSON.stringify({ countries: ["US"] });
          },
        };
      },
      async close() {
        closed = true;
      },
    };
  };

  const result = await fetchPricingWithBrowser(
    "/countries",
    browserBinding,
    launchBrowser
  );

  assert.equal(result.body, JSON.stringify({ countries: ["US"] }));
  assert.equal(result.contentType, "application/json");
  assert.equal(closed, true);
  assert.deepEqual(calls[0], ["userAgent", true]);
  assert.deepEqual(calls[1], ["viewport", { width: 1365, height: 768 }]);
  assert.deepEqual(calls[2], [
    "headers",
    { Accept: "application/json", "Accept-Language": "en-US,en;q=0.9" },
  ]);
  assert.deepEqual(calls[3], [
    "goto",
    "https://chatgpt.com/",
    "domcontentloaded",
  ]);
  assert.deepEqual(calls[4], [
    "goto",
    "https://chatgpt.com/backend-api/checkout_pricing_config/countries",
    "domcontentloaded",
  ]);
});

test("proxies a pricing API path with Browser Run response headers", async () => {
  const response = await onRequest({
    request: new Request("https://example.com/api/proxy/countries"),
    params: { path: ["countries"] },
    env: {
      BROWSER: {},
      launchBrowser: async () => ({
        async newPage() {
          return {
            async setUserAgent() {},
            async setViewport() {},
            async setExtraHTTPHeaders() {},
            async goto() {},
            async evaluate() {
              return JSON.stringify({ countries: ["US"] });
            },
          };
        },
        async close() {},
      }),
    },
  });

  assert.equal(response.status, 200);
  assert.equal(response.headers.get("Access-Control-Allow-Origin"), "*");
  assert.deepEqual(await response.json(), { countries: ["US"] });
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
