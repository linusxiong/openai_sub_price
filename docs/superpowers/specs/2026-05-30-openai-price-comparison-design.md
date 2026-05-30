# OpenAI Subscription Price Comparison — Design Spec

**Date:** 2026-05-30
**Status:** Approved for implementation

---

## Design Read (taste-skill §0.B)

> "Reading this as: data utility tool for price-conscious consumers and developers, with a clean/functional language, leaning toward HeroUI + Tailwind v3 + Geist + restrained motion."

**Dials:**
- `DESIGN_VARIANCE: 5` — clean, functional, no asymmetric chaos
- `MOTION_INTENSITY: 3` — skeleton shimmer on load, subtle hover states only
- `VISUAL_DENSITY: 7` — data-dense table, tight paddings, mono numbers

Note: the design-taste-frontend skill explicitly excludes data tables from its scope. Its typography, color, dark-mode, and accessibility principles apply; its landing-page layout rules do not.

---

## 1. Overview

A real-time price comparison website that fetches ChatGPT subscription pricing for every country OpenAI supports, converts all prices to the user's chosen display currency, and presents them in a sortable, rankable table. The user can also see the original local-currency price alongside the converted price.

**Success criteria:**
- All countries and all subscription tiers visible in one table
- Prices update on every page load (real-time)
- User's display currency and language preferences persist across sessions
- Works in all six target languages: English, Chinese (Simplified), Japanese, German, French, Spanish
- Graceful degradation when the upstream API is unreachable

---

## 2. Data Sources

### 2.1 ChatGPT Pricing API

| Purpose | URL |
|---|---|
| Country list | `https://chatgpt.com/backend-api/checkout_pricing_config/countries` |
| Per-country config | `https://chatgpt.com/backend-api/checkout_pricing_config/configs/{CC}` |

Both endpoints are public (no auth required) but are protected by Cloudflare's bot challenge. A real browser passes the challenge automatically; `curl` and server-side fetches are blocked.

**Country config response shape (AU example):**
```json
{
  "country_code": "AU",
  "currency_config": {
    "free":               { "month": { "amount": 0,   "tax": "inclusive" } },
    "go":                 { "month": { "amount": 13,  "tax": "inclusive", "psp_override": {...} } },
    "plus":               { "month": { "amount": 30,  "tax": "inclusive", "psp_override": {...} },
                            "year":  { "amount": 25,  "tax": "inclusive", "psp_override": {...} } },
    "pro":                { "month": { "amount": 300, "tax": "inclusive", "psp_override": {...} } },
    "prolite":            { "month": { "amount": 155, "tax": "inclusive", "psp_override": {...} } },
    "business":           { "month": { "amount": 35,  "tax": "exclusive" },
                            "year":  { "amount": 28,  "tax": "exclusive" } },
    "business_non_profit":{ "month": { "amount": 14.25, "tax": "exclusive" },
                            "year":  { "amount": 11.4,  "tax": "exclusive" } },
    "free_workspace":     { "month": { "amount": 0,   "tax": "inclusive" } },
    "symbol_code": "AUD",
    "symbol": "A$",
    "tax_percent": 10.0,
    "tax_type": "gst",
    "minor_unit_exponent": 2,
    "amount_per_credit": 0.06,
    "vat_display": { ... },
    "promos": { ... }
  }
}
```

**Plans to display (in order):**

| Key | Display name |
|---|---|
| `free` | Free |
| `go` | Go |
| `plus` | Plus |
| `prolite` | Pro Lite |
| `pro` | Pro |
| `business` | Team |
| `business_non_profit` | Non-Profit |

Plans absent from a country's config are shown as "N/A".

**Price used:** `amount` field (tax-inclusive where available, exclusive otherwise). The `psp_override` field is ignored for display — it reflects payment-processor-specific amounts, not the advertised price.

### 2.2 Exchange Rate API (fawazahmed0/exchange-api)

Primary CDN:
```
https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@latest/v1/currencies/{base}.json
```
Fallback CDN:
```
https://latest.currency-api.pages.dev/v1/currencies/{base}.json
```

Response shape (base = `usd`):
```json
{ "date": "2026-05-30", "usd": { "aud": 1.52, "eur": 0.92, ... } }
```

**Conversion formula:**
```
converted = originalAmount / rates[originalCurrency.toLowerCase()]
```
Where `rates` is the inner object keyed by the user's display currency.

---

## 3. Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Browser (React SPA)                   │
│                                                         │
│  ┌──────────┐   ┌──────────────┐   ┌─────────────────┐ │
│  │  Header  │   │  PriceTable  │   │  Preferences    │ │
│  │  (nav,   │   │  (HeroUI +   │   │  (Zustand +     │ │
│  │  selects)│   │  TanStack)   │   │  localStorage)  │ │
│  └──────────┘   └──────────────┘   └─────────────────┘ │
│                                                         │
│  ┌──────────────────────────────────────────────────┐   │
│  │              TanStack Query cache                │   │
│  │   usePricing()          useExchangeRates()       │   │
│  └──────────────────────────────────────────────────┘   │
└────────────────────┬────────────────────────────────────┘
                     │ fetch
          ┌──────────┴──────────┐
          │                     │
   Direct browser          CF Worker proxy
   fetch (primary)         /api/proxy/...
          │                     │
          └──────────┬──────────┘
                     │
        chatgpt.com/backend-api/...
        cdn.jsdelivr.net/...
```

### 3.1 CORS Strategy (three-tier)

1. **Direct browser fetch** — attempted first. Works because the browser solves the Cloudflare JS challenge automatically. This is the primary and most reliable path.
2. **Cloudflare Worker proxy** (`/api/proxy/...`) — fallback if the browser fetch is blocked by CORS headers. The Worker injects `Access-Control-Allow-Origin: *` on the response. **Known risk:** the Worker itself makes a server-side fetch to `chatgpt.com`, which may trigger the same Cloudflare bot challenge that blocks `curl`. This must be validated during implementation. If the Worker fetch is also challenged, the Worker falls through to the static fallback.
3. **Static JSON fallback** — a GitHub Actions workflow runs daily using Playwright (headless Chromium) to bypass the Cloudflare challenge, fetches all country configs, and commits them to `public/data/fallback/`. If both live sources fail, the app loads this snapshot with a "prices may be outdated" banner.

### 3.2 Data Fetching Strategy

- Fetch the countries list first (single request).
- Batch-fetch all country configs in groups of 20 concurrent requests to avoid rate-limiting.
- Show a progress bar (`fetched N of 230`) during the batch phase.
- Cache all results in TanStack Query with `staleTime: 5 minutes` so tab switches don't re-fetch.
- Exchange rates are fetched once per session (staleTime: 1 hour).

---

## 4. Frontend Stack

| Concern | Choice | Reason |
|---|---|---|
| Build tool | Vite + React + TypeScript | Fast DX, standard for SPAs |
| UI components | HeroUI v3 | Tailwind-native, accessible, dark-mode built-in |
| Styling | Tailwind CSS v3 | Required by HeroUI v3 |
| Table logic | HeroUI Table (sort via `sortDescriptor`) | Integrates with design system; 230 rows needs no virtualization |
| Data fetching | TanStack Query v5 | Caching, loading/error states, stale-while-revalidate |
| Global state | Zustand v5 | Currency + language + sort preferences |
| i18n | react-i18next + i18next-browser-languagedetector | Auto-detects browser language |
| Animation | motion/react | Skeleton shimmer, subtle transitions |
| Icons | @phosphor-icons/react | Consistent stroke weight, no hand-rolled SVGs |
| Font | Geist (self-hosted via @fontsource/geist) | Not Inter; clean, readable at data density |

---

## 5. Project Structure

```
openai-sub-price/
├── src/
│   ├── components/
│   │   ├── Header.tsx               # Logo, title, language + currency selectors, theme toggle
│   │   ├── CurrencySelector.tsx     # HeroUI Select, 40+ currencies
│   │   ├── LanguageSelector.tsx     # HeroUI Select, 6 languages
│   │   ├── ThemeToggle.tsx          # Dark/light toggle, respects prefers-color-scheme
│   │   ├── LoadingProgress.tsx      # "Fetching N of 230 countries..." progress bar
│   │   └── PriceTable/
│   │       ├── index.tsx            # HeroUI Table, sortDescriptor, column definitions
│   │       ├── PlanCell.tsx         # Converted price (primary) + local price (secondary)
│   │       ├── SkeletonTable.tsx    # Shimmer skeleton matching final table shape
│   │       └── ErrorState.tsx       # Error message + retry button
│   ├── hooks/
│   │   ├── usePricing.ts            # TanStack Query: countries list + batched configs
│   │   └── useExchangeRates.ts      # TanStack Query: fawazahmed0 rates
│   ├── services/
│   │   ├── pricing-api.ts           # fetchCountries, fetchCountryConfig, fetchAllConfigs
│   │   └── exchange-rates.ts        # fetchExchangeRates (primary + fallback CDN)
│   ├── store/
│   │   └── preferences.ts           # Zustand: displayCurrency, language, billingInterval, sortPlan
│   ├── i18n/
│   │   ├── index.ts                 # i18next init, language detector
│   │   └── locales/
│   │       ├── en.json
│   │       ├── zh.json              # Chinese Simplified
│   │       ├── ja.json
│   │       ├── de.json
│   │       ├── fr.json
│   │       └── es.json
│   ├── types/
│   │   └── pricing.ts               # CountryConfig, CurrencyConfig, PlanConfig, etc.
│   ├── utils/
│   │   ├── currency.ts              # convertPrice, formatCurrency
│   │   └── plans.ts                 # PLAN_ORDER, PLAN_LABELS, getPlanAmount
│   ├── App.tsx                      # HeroUIProvider, QueryClientProvider, layout
│   └── main.tsx                     # Entry point, i18n init
├── worker/
│   └── index.ts                     # Cloudflare Worker CORS proxy
├── public/
│   └── data/
│       └── fallback/                # Static JSON snapshots (GitHub Actions)
├── docs/
│   └── superpowers/specs/
│       └── 2026-05-30-openai-price-comparison-design.md
├── .github/
│   └── workflows/
│       └── fetch-prices.yml         # Daily snapshot job
├── wrangler.toml                    # Cloudflare Worker config
├── tailwind.config.js               # HeroUI plugin, content paths
├── vite.config.ts
├── tsconfig.json
└── package.json
```

---

## 6. Table Design

### 6.1 Columns

| Column | Key | Sortable | Notes |
|---|---|---|---|
| Rank | `rank` | No | Auto-calculated from current sort |
| Country | `country` | Yes | Flag emoji + localized country name (Intl.DisplayNames) |
| Currency | `currency` | Yes | ISO code, e.g. "AUD" |
| Free | `free` | Yes | Monthly only (always $0) |
| Go | `go` | Yes | Monthly only |
| Plus | `plus` | Yes | Monthly / annual toggle |
| Pro Lite | `prolite` | Yes | Monthly only |
| Pro | `pro` | Yes | Monthly only |
| Team | `business` | Yes | Monthly / annual toggle |
| Non-Profit | `business_non_profit` | Yes | Monthly / annual toggle |

### 6.2 Plan Cell Layout

```
┌─────────────────┐
│  $19.74         │  ← converted price in display currency (primary, bold)
│  A$30.00        │  ← original local price (secondary, muted, smaller)
└─────────────────┘
```

For unavailable plans: display "N/A" centered, muted color.

### 6.3 Billing Interval Toggle

A segmented control in the table header area switches all plan columns between Monthly and Annual simultaneously. Columns that have no annual pricing always show the monthly price regardless.

### 6.4 Ranking

The rank column reflects the current sort order. Sorting by a plan column (ascending = cheapest first) automatically updates ranks 1, 2, 3... Ties share the same rank. Default sort: Plus monthly, ascending.

---

## 7. State Management (Zustand)

```typescript
interface PreferencesStore {
  displayCurrency: string;        // e.g. "USD" — persisted to localStorage
  language: string;               // e.g. "en" — persisted to localStorage
  billingInterval: "month"|"year";// persisted to localStorage
  sortPlan: string;               // plan key, e.g. "plus" — persisted to localStorage
  sortDirection: "ascending"|"descending"; // persisted to localStorage
  setDisplayCurrency: (c: string) => void;
  setLanguage: (l: string) => void;
  setBillingInterval: (i: "month"|"year") => void;
  setSortPlan: (p: string) => void;
  setSortDirection: (d: "ascending"|"descending") => void;
}
```

All fields are persisted via Zustand's `persist` middleware with `localStorage`.

---

## 8. i18n

**Languages:** English (`en`), Chinese Simplified (`zh`), Japanese (`ja`), German (`de`), French (`fr`), Spanish (`es`).

**Detection order:** localStorage → browser language → fallback to `en`.

**Translated strings include:**
- App title and tagline
- Column headers
- Plan names
- UI labels: Loading, Error, Retry, Monthly, Annual, Unavailable (N/A), "prices may be outdated"
- Currency selector label
- Language selector label
- Progress message: "Fetching {n} of {total} countries"

Country names are NOT in the translation files — they use `Intl.DisplayNames` with the active locale, which covers all 230+ countries automatically.

---

## 9. Design System

### 9.1 Color

- **Neutrals:** Zinc scale (zinc-950 dark bg, zinc-900 surface, zinc-800 border, zinc-50 light bg)
- **Accent:** Blue-500 (`#3B82F6`) — sort indicators, active states, links
- **Success/cheap:** No color coding by default (avoids misleading relative comparisons)
- **Unavailable:** zinc-500 muted text

### 9.2 Typography

- **Font:** Geist (self-hosted via `@fontsource/geist`)
- **Numbers in table:** `font-mono` for alignment
- **Body:** `text-sm` at VISUAL_DENSITY 7
- **No Inter as default** (taste-skill §4.1)

### 9.3 Dark Mode

- Default: respects `prefers-color-scheme`
- Manual toggle available in header
- HeroUI `dark` class on `<html>` element
- Both modes tested before ship

### 9.4 Accessibility

- WCAG AA contrast on all text
- Keyboard-navigable table (HeroUI Table handles this)
- `aria-label` on all interactive controls
- `prefers-reduced-motion` respected — skeleton shimmer disabled, no transitions

---

## 10. Cloudflare Worker (CORS Proxy)

**Route:** `https://<pages-domain>/api/proxy/*`

**Behavior:**
1. Strip `/api/proxy` prefix from the incoming path
2. Forward to `https://chatgpt.com/backend-api/checkout_pricing_config{path}`
3. Add browser-like `User-Agent` and `Accept` headers to the upstream request
4. Return the upstream response with `Access-Control-Allow-Origin: *` injected
5. Cache successful responses in the CF Cache API for 5 minutes

**wrangler.toml** (deployment-time values filled in when the Cloudflare Pages project is created):
```toml
name = "openai-price-proxy"
main = "worker/index.ts"
compatibility_date = "2025-01-01"

# Replace <pages-domain> and <zone> with actual values after Pages project creation
[[routes]]
pattern = "<pages-domain>/api/proxy/*"
zone_name = "<zone>"
```

---

## 11. GitHub Actions — Daily Snapshot

```yaml
# .github/workflows/fetch-prices.yml
on:
  schedule:
    - cron: "0 2 * * *"   # 02:00 UTC daily
  workflow_dispatch:

jobs:
  snapshot:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: node scripts/fetch-snapshot.js
      - run: |
          git config user.email "bot@github.com"
          git config user.name "Price Bot"
          git add public/data/fallback/
          git diff --staged --quiet || git commit -m "chore: daily price snapshot"
          git push
```

The snapshot script uses Playwright (headless Chromium) on the GitHub Actions runner to bypass the Cloudflare JS challenge, fetches all country configs, and writes them to `public/data/fallback/{CC}.json`. Playwright is required because the CF challenge cannot be solved by a plain `fetch` call.

---

## 12. Error Handling

| Scenario | Behavior |
|---|---|
| Direct fetch CORS blocked | Silently retry via CF Worker proxy |
| CF Worker also fails | Load static fallback JSON, show "prices may be outdated" banner |
| Static fallback missing | Show full error state with retry button |
| Exchange rate fetch fails | Show prices in original currency only, warn user |
| Single country config fails | Show that country's row with all plans as "N/A", continue loading others |
| Network offline | Show cached TanStack Query data if available, else error state |

---

## 13. Deployment

- **Hosting:** Cloudflare Pages (static SPA)
- **Worker:** Cloudflare Worker bound to the Pages project
- **Build command:** `npm run build`
- **Output directory:** `dist`
- **Environment variables:** none required for production (all API URLs are public)

---

## 14. Out of Scope

- API usage/token pricing (only subscription tiers)
- User accounts or saved comparisons
- Historical price tracking
- Mobile app
- Server-side rendering
