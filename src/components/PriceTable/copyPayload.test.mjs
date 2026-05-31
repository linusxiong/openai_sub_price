import assert from "node:assert/strict";
import test from "node:test";

import { formatCountryCurrencyCode } from "./copyPayload.ts";

test("formats the clipboard payload with country and currency codes", () => {
  assert.equal(formatCountryCurrencyCode("us", "usd"), "US USD");
});

test("keeps non-standard country-like codes while uppercasing both parts", () => {
  assert.equal(formatCountryCurrencyCode(" us2 ", " eur "), "US2 EUR");
});
