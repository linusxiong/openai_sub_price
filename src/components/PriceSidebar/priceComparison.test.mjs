import assert from "node:assert/strict";
import test from "node:test";

import {
  calculateSavingsPct,
  getUsReferencePrice,
} from "./priceComparison.ts";

function config(symbolCode, amount) {
  return {
    currency_config: {
      plus: { month: { amount, tax: "exclusive" } },
      symbol_code: symbolCode,
      tax_percent: 0,
    },
  };
}

test("uses the US plan amount as the savings reference", () => {
  const configs = new Map([
    ["PH", config("USD", 15)],
    ["US", config("USD", 20)],
    ["CH", config("USD", 30)],
  ]);

  const usReferencePrice = getUsReferencePrice({
    configs,
    activePlan: "plus",
    billingInterval: "month",
    displayCurrency: "USD",
    exchangeRates: { rates: { usd: 1 } },
  });

  assert.equal(usReferencePrice, 20);
  assert.equal(calculateSavingsPct(15, usReferencePrice), 25);
});

test("omits savings when the US plan amount is unavailable", () => {
  const configs = new Map([["PH", config("USD", 15)]]);

  assert.equal(
    getUsReferencePrice({
      configs,
      activePlan: "plus",
      billingInterval: "month",
      displayCurrency: "USD",
      exchangeRates: { rates: { usd: 1 } },
    }),
    null
  );
});
