# OpenAI Subscription Price Comparison — Design Spec

**Date:** 2026-05-30
**Last updated:** 2026-05-31
**Status:** Approved for implementation

---

## Design Read (taste-skill §0.B)

> "Reading this as: data utility tool for price-conscious consumers and developers, with a clean/functional language, leaning toward HeroUI v3 + Tailwind v4 + Geist + restrained motion."

**Dials:**
- `DESIGN_VARIANCE: 5` — clean, functional, no asymmetric chaos
- `MOTION_INTENSITY: 3` — skeleton shimmer on load, subtle hover states only
- `VISUAL_DENSITY: 7` — data-dense table, tight paddings, mono numbers

Note: the design-taste-frontend skill explicitly excludes data tables from its scope. Its typography, color, dark-mode, and accessibility principles apply; its landing-page layout rules do not.

---

## 1. Overview

A real-time price comparison website that fetches ChatGPT subscription pricing for every country OpenAI supports, converts all prices to the user's chosen display currency, and presents them in a plan-centric sortable table with a stats sidebar.

**Success criteria:**
- One plan at a time shown in the table, selected via plan tabs
- Prices update on every page load (real-time), with sessionStorage cache (10 min TTL) for instant repeat visits
- Streaming load: table renders as first batch of 20 countries arrives; sort updates incrementally
- Sidebar shows lowest price highlight and price distribution bar chart for the active plan
- User's display currency, language, active plan, billing interval, and sort preferences persist across sessions
- Works in all six target languages: English, Chinese (Simplified), Japanese, German, French, Spanish
- No sort flash or dark mode flash on page load
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

**Price used:** Pre-tax amount. When `tax` is `"inclusive"`, divide by `(1 + tax_percent / 100)` to get the pre-tax price. When `tax` is `"exclusive"`, use `amount` directly. The `psp_override` field is ignored.

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
┌─────────────────────────────────────────────────────────────────┐
│                        Browser (React SPA)                       │
│                                                                  │
│  ┌──────────┐   ┌──────────────────────────┐  ┌──────────────┐  │
│  │  Header  │   │  Main Content            │  │  Preferences │  │
│  │  (nav,   │   │  ┌────────┐ ┌─────────┐  │  │  (Zustand +  │  │
│  │  selects)│   │  │ Plan   │ │ Stats   │  │  │  localStorage│  │
│  └──────────┘   │  │ Tabs + │ │ Sidebar │  │  └──────────────┘  │
│                 │  │ Table  │ │         │  │                     │
│                 │  └────────┘ └─────────┘  │                     │
│                 └──────────────────────────┘                     │
│                                                                  │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │  usePricing() — custom streaming hook + sessionStorage     │  │
│  │  useExchangeRates() — TanStack Query                       │  │
│  └────────────────────────────────────────────────────────────┘  │
└──────────────────────────┬──────────────────────────────────────┘
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

1. **Direct browser fetch** — attempted first. The browser handles any Cloudflare challenge automatically. This is the primary and most reliable path.
2. **Cloudflare Worker proxy** (`/api/proxy/...`) — fallback if the browser fetch is blocked by CORS headers. The Worker injects `Access-Control-Allow-Origin: *` on the response. If the Worker's server-side fetch to `chatgpt.com` is blocked by a Cloudflare challenge, the [obscura](https://github.com/h4ckf0r0day/obscura) library will be used to solve it. This is treated as a contingency — do not integrate obscura unless the challenge is actually encountered during implementation.
3. **Static JSON fallback** — a GitHub Actions workflow runs daily using Playwright (headless Chromium) to fetch all country configs and commit them to `public/data/fallback/`. If both live sources fail, the app loads this snapshot with a "prices may be outdated" banner. If Playwright also encounters a challenge, obscura is the fallback there too.

### 3.2 Data Fetching Strategy

- Fetch the countries list first (single request).
- Batch-fetch all country configs in groups of 20 concurrent requests.
- **Streaming:** update the table after each batch completes — do not wait for all 230+ countries. Sort updates incrementally as data arrives.
- Show a progress bar (`Fetching N of 230 countries`) above the table during streaming.
- Cache completed data in `sessionStorage` with a 10-minute TTL. On page load, if cache is fresh, render instantly with no network requests.
- Exchange rates are fetched via TanStack Query with `staleTime: 1 hour`.

### 3.3 Flash Prevention

Two inline scripts in `index.html` run before React loads:

1. **Dark mode script** — reads `openai-price-preferences` from localStorage and applies the `dark` class to `<html>` immediately, preventing FOUC.
2. **Zustand hydration** — `useHydrated()` initializes with `useState(() => usePreferences.persist.hasHydrated())` so the first render already has the correct sort/plan preferences when Zustand hydrates synchronously.

---

## 4. Frontend Stack

| Concern | Choice | Reason |
|---|---|---|
| Build tool | Vite + React + TypeScript | Fast DX, standard for SPAs |
| UI components | HeroUI v3 | Tailwind-native, accessible, dark-mode built-in |
| Styling | **Tailwind CSS v4** | Required by HeroUI v3 styles; configured via `@tailwindcss/vite` plugin, no `tailwind.config.js` |
| Data fetching | Custom streaming hook + TanStack Query v5 | Streaming for pricing (incremental updates), TanStack Query for exchange rates |
| Global state | Zustand v5 | Currency, language, active plan, billing interval, sort preferences |
| i18n | react-i18next + i18next-browser-languagedetector | Auto-detects browser language |
| Icons | @phosphor-icons/react | Consistent stroke weight, no hand-rolled SVGs |
| Font | Geist (via `geist` npm package) | Not Inter; clean, readable at data density |

**Tailwind v4 setup:**
- Install: `npm install tailwindcss @tailwindcss/vite`
- `vite.config.ts`: add `tailwindcss()` from `@tailwindcss/vite` to plugins
- `src/index.css`: `@import "tailwindcss"` (replaces `@tailwind base/components/utilities`)
- No `tailwind.config.js` — theme config lives in CSS via `@theme { ... }`
- Dark mode: `@variant dark (&:is(.dark *))`
- Remove: `tailwindcss@3`, `postcss`, `autoprefixer`, `tailwind.config.js`, `postcss.config.js`

---

## 5. Project Structure

```
openai-sub-price/
├── src/
│   ├── components/
│   │   ├── Header.tsx               # Title, language + currency selectors, theme toggle
│   │   ├── CurrencySelector.tsx     # Native <select> styled with Tailwind, 40+ currencies
│   │   ├── LanguageSelector.tsx     # Native <select> styled with Tailwind, 6 languages
│   │   ├── ThemeToggle.tsx          # HeroUI Button (ghost, isIconOnly), dark/light toggle
│   │   ├── LoadingProgress.tsx      # HeroUI ProgressBar compound component
│   │   ├── PlanTabs.tsx             # Plan selector tabs (Free, Go, Plus, Pro Lite, Pro, Team, Non-Profit)
│   │   ├── PriceSidebar/
│   │   │   ├── index.tsx            # Sidebar container (lowest price card + distribution chart)
│   │   │   ├── LowestPriceCard.tsx  # Cheapest country highlight: flag, price, savings % vs highest
│   │   │   └── PriceDistribution.tsx# Horizontal bar chart: each country as a row, bar = relative price
│   │   └── PriceTable/
│   │       ├── index.tsx            # Single-plan table: rank, country, original price, converted price, status
│   │       ├── StatusBadge.tsx      # "Lowest" badge for rank 1
│   │       ├── SkeletonTable.tsx    # HeroUI Skeleton shimmer matching final table shape
│   │       └── ErrorState.tsx       # HeroUI Button (outline) + WarningCircle icon
│   ├── hooks/
│   │   ├── usePricing.ts            # Custom streaming hook: sessionStorage cache + batch fetch
│   │   └── useExchangeRates.ts      # TanStack Query: fawazahmed0 rates
│   ├── services/
│   │   ├── pricing-api.ts           # fetchCountries, fetchCountryConfig
│   │   └── exchange-rates.ts        # fetchExchangeRates (primary + fallback CDN)
│   ├── store/
│   │   └── preferences.ts           # Zustand: displayCurrency, language, activePlan, billingInterval, sortDirection, theme
│   ├── i18n/
│   │   ├── index.ts                 # i18next init, language detector
│   │   └── locales/
│   │       ├── en.json
│   │       ├── zh.json
│   │       ├── ja.json
│   │       ├── de.json
│   │       ├── fr.json
│   │       └── es.json
│   ├── types/
│   │   └── pricing.ts               # CountryConfig, CurrencyConfig, PlanConfig, PlanKey, BillingInterval
│   ├── utils/
│   │   ├── currency.ts              # convertPrice, formatCurrency, CURRENCY_OPTIONS
│   │   └── plans.ts                 # PLAN_ORDER, PLAN_LABEL_KEYS, ANNUAL_PLANS, getPlanAmount (pre-tax)
│   ├── App.tsx                      # QueryClientProvider, layout: header + main (table + sidebar)
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
│       └── fetch-prices.yml         # Daily snapshot job (Playwright)
├── wrangler.toml                    # Cloudflare Worker config
├── vite.config.ts                   # @tailwindcss/vite plugin
├── tsconfig.json
└── package.json
```

---

## 6. UI Layout

### 6.1 Page Layout

```
┌─────────────────────────────────────────────────────────────────┐
│  Header: [Title + tagline]          [Lang] [Currency] [Theme]   │
├─────────────────────────────────────────────────────────────────┤
│  Plan Tabs: [Free] [Go] [Plus*] [Pro Lite] [Pro] [Team] [NP]   │
│             Billing: [Monthly*] [Annual]                        │
├──────────────────────────────────────┬──────────────────────────┤
│  Table (flex-1)                      │  Sidebar (fixed 280px)   │
│  ┌──────────────────────────────┐    │  ┌────────────────────┐  │
│  │ # | Country | Original | USD │    │  │ Lowest Price Card  │  │
│  │ 1 | TR  ... | ₺499 TRY | $10 │    │  │ $10.95 - Turkey    │  │
│  │ 2 | PH  ... | PHP999   | $16 │    │  │ 61% cheaper        │  │
│  │ ...                          │    │  └────────────────────┘  │
│  └──────────────────────────────┘    │  ┌────────────────────┐  │
│  Progress bar (during streaming)     │  │ Price Distribution │  │
│                                      │  │ TR ████            │  │
│                                      │  │ PH ██████          │  │
│                                      │  │ US ████████████    │  │
│                                      │  └────────────────────┘  │
└──────────────────────────────────────┴──────────────────────────┘
```

On mobile (`< 768px`): sidebar collapses below the table.

### 6.2 Plan Tabs

Horizontal scrollable tab strip. Each tab shows the plan name. The active tab is highlighted. Selecting a tab updates the table and sidebar for that plan.

### 6.3 Table Columns (single-plan view)

| Column | Notes |
|---|---|
| Rank (#) | Auto-calculated from sort order |
| Country | Flag emoji + localized country name (`Intl.DisplayNames`) |
| Original Price | Pre-tax amount in local currency with ISO code (e.g. `₺499.99 TRY`) |
| Converted Price | Pre-tax amount in user's display currency (e.g. `$10.95`) |
| Status | "Lowest" badge on rank 1 row only |

Default sort: converted price ascending (cheapest first). Clicking the converted price column header toggles ascending/descending.

For unavailable plans: show "N/A" in both price columns.

### 6.4 Lowest Price Card (sidebar)

Shows for the active plan:
- Cheapest country flag + name
- Price in display currency (large, bold)
- Savings percentage vs the most expensive country: `X% cheaper than highest`

### 6.5 Price Distribution Chart (sidebar)

Horizontal bar chart for the active plan:
- One row per country (top 30 by price, ascending)
- Bar width proportional to converted price relative to the maximum
- Country code label on the left, price on the right
- Cheapest bar highlighted in accent color; others in muted zinc

### 6.6 Billing Interval Toggle

Segmented control (Monthly / Annual) shown below the plan tabs. Plans without annual pricing always show monthly regardless of the toggle.

---

## 7. State Management (Zustand)

```typescript
interface PreferencesStore {
  displayCurrency: string;              // e.g. "USD"
  language: string;                     // e.g. "en"
  activePlan: PlanKey;                  // e.g. "plus" — replaces sortPlan
  billingInterval: "month" | "year";
  sortDirection: "ascending" | "descending";
  theme: "light" | "dark" | "system";
  setDisplayCurrency: (c: string) => void;
  setLanguage: (l: string) => void;
  setActivePlan: (p: PlanKey) => void;
  setBillingInterval: (i: "month" | "year") => void;
  setSortDirection: (d: "ascending" | "descending") => void;
  setTheme: (t: "light" | "dark" | "system") => void;
}
```

All fields persisted via Zustand `persist` middleware with `localStorage`.

`useHydrated()` initializes with `useState(() => usePreferences.persist.hasHydrated())` — synchronous on first render when localStorage is available, preventing sort/plan flash.

---

## 8. i18n

**Languages:** English (`en`), Chinese Simplified (`zh`), Japanese (`ja`), German (`de`), French (`fr`), Spanish (`es`).

**Detection order:** localStorage → browser language → fallback to `en`.

**Translated strings include:**
- App title and tagline
- Column headers (Rank, Country, Original Price, Converted Price, Status)
- Plan names
- UI labels: Loading, Error, Retry, Monthly, Annual, N/A, "prices may be outdated", "Lowest", "cheaper than highest"
- Currency selector label, Language selector label
- Progress message: "Fetching {completed} of {total} countries"
- Sidebar labels: "Lowest Price", "Price Distribution"

Country names use `Intl.DisplayNames` with the active locale — not in translation files.

---

## 9. Design System

### 9.1 Color

- **Neutrals:** Zinc scale (zinc-950 dark bg, zinc-900 surface, zinc-800 border, zinc-50 light bg)
- **Accent:** HeroUI accent token (maps to blue in default theme) — sort indicators, active tabs, lowest price bar
- **Lowest badge:** green (success color)
- **Unavailable:** zinc-400/500 muted text

### 9.2 Typography

- **Font:** Geist (via `geist` npm package, imported in CSS)
- **Numbers in table:** `font-mono` for alignment
- **Body:** `text-sm` at VISUAL_DENSITY 7
- **No Inter as default** (taste-skill §4.1)

### 9.3 Dark Mode

- Default: respects `prefers-color-scheme` via inline script in `index.html`
- Manual toggle in header
- `dark` class on `<html>` element
- Inline script prevents FOUC: reads `openai-price-preferences` from localStorage before React loads

### 9.4 Accessibility

- WCAG AA contrast on all text
- Keyboard-navigable table and tabs
- `aria-label` on all interactive controls
- `prefers-reduced-motion` respected — skeleton shimmer disabled

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
on:
  schedule:
    - cron: "0 2 * * *"
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

The snapshot script uses Playwright (headless Chromium) to bypass the Cloudflare JS challenge, fetches all country configs, and writes them to `public/data/fallback/{CC}.json`.

---

## 12. Error Handling

| Scenario | Behavior |
|---|---|
| Direct fetch CORS blocked | Silently retry via CF Worker proxy |
| CF Worker also fails | Load static fallback JSON, show "prices may be outdated" banner |
| Static fallback missing | Show full error state with retry button |
| Exchange rate fetch fails | Show prices in original currency only, warn user |
| Single country config fails | Show that country's row as "N/A", continue loading others |
| Non-standard country code (US2, EU, XK) | `Intl.DisplayNames.of()` wrapped in try-catch; falls back to raw code |
| Network offline | Show sessionStorage cache if available, else error state |

---

## 13. Deployment

- **Hosting:** Cloudflare Pages (static SPA)
- **Worker:** Cloudflare Worker bound to the Pages project
- **Build command:** `npm run build`
- **Output directory:** `dist`
- **Environment variables:** none required for production

---

## 14. Out of Scope

- API usage/token pricing (only subscription tiers)
- Region comparison tab (deferred — can be added as a second tab in a future iteration)
- User accounts or saved comparisons
- Historical price tracking
- Mobile app
- Server-side rendering
