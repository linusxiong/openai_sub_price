import assert from "node:assert/strict";
import test from "node:test";

import de from "./locales/de.json" with { type: "json" };
import en from "./locales/en.json" with { type: "json" };
import es from "./locales/es.json" with { type: "json" };
import fr from "./locales/fr.json" with { type: "json" };
import ja from "./locales/ja.json" with { type: "json" };
import zh from "./locales/zh.json" with { type: "json" };

const LOCALES = { de, en, es, fr, ja, zh };

test("labels Pro plans by usage multiplier across locales", () => {
  for (const [locale, messages] of Object.entries(LOCALES)) {
    assert.equal(messages.plans.prolite, "Pro 5x", locale);
    assert.equal(messages.plans.pro, "Pro 20x", locale);
  }
});
