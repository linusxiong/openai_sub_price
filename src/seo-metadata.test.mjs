import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const SITE_URL = "https://gptsub.linusx.dev/";

test("index.html includes production SEO metadata", async () => {
  const html = await readFile("index.html", "utf8");

  assert.match(
    html,
    /<title>ChatGPT Subscription Price Comparison \| GPTSub<\/title>/
  );
  assert.match(
    html,
    /<meta[\s\S]*?name="description"[\s\S]*?content="[^"]{80,180}"[\s\S]*?\/>/
  );
  assert.match(html, /<meta name="robots" content="index, follow" \/>/);
  assert.match(html, new RegExp(`<link rel="canonical" href="${SITE_URL}" />`));
  assert.match(html, /<meta property="og:type" content="website" \/>/);
  assert.match(html, new RegExp(`<meta property="og:url" content="${SITE_URL}" />`));
  assert.match(html, /<meta property="og:title" content="ChatGPT Subscription Price Comparison \| GPTSub" \/>/);
  assert.match(html, /<meta name="twitter:card" content="summary" \/>/);
  assert.match(html, /<script type="application\/ld\+json">/);
});

test("crawler files point search engines at the production site", async () => {
  const robots = await readFile("public/robots.txt", "utf8");
  const sitemap = await readFile("public/sitemap.xml", "utf8");

  assert.match(robots, /^User-agent: \*/m);
  assert.match(robots, new RegExp(`Sitemap: ${SITE_URL}sitemap.xml`));
  assert.match(sitemap, new RegExp(`<loc>${SITE_URL}</loc>`));
});
