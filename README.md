# ChatGPT Price Comparison

[中文文档](./README.zh-CN.md)

A React app for comparing ChatGPT subscription prices across supported countries and regions. It fetches regional pricing data, converts prices into a selected display currency, and presents the result in a sortable, plan-focused table.

## Features

- Compare subscription prices by plan and billing interval
- Convert local prices into a selected display currency
- Sort countries and regions by converted price
- Copy both the two-letter country/region code and three-letter currency code, such as `US USD`
- Refresh pricing data from the backend with a global refresh button
- Persist language, theme, currency, plan, billing, and sorting preferences locally
- Responsive UI built with HeroUI v3 and Tailwind CSS v4

## Tech Stack

- React 19
- TypeScript
- Vite
- HeroUI v3
- Tailwind CSS v4
- Zustand
- Cloudflare Pages

## Local Development

```bash
npm install
npm run dev
```

Open the local URL printed by Vite. It is usually `http://127.0.0.1:5173/`.

## Verification

```bash
npm test
npm run lint
npm run build
```

## Deployment

This project is currently configured for a Cloudflare Pages static deployment. The API proxy Worker is temporarily disabled so the deployed app can test whether direct browser requests to the upstream pricing endpoint hit CORS restrictions.

Sign in to Wrangler once:

```bash
npx wrangler login
```

Build and deploy:

```bash
npm run deploy:pages
```

For the Cloudflare Pages dashboard, use:

- Build command: `npm run build`
- Build output directory: `dist`

The Worker proxy file at [`worker/index.ts`](./worker/index.ts) and the Worker settings in [`wrangler.toml`](./wrangler.toml) are commented out for now.
The active Wrangler config only points Pages at `dist`.
The `deploy:pages` script sets `CLOUDFLARE_ACCOUNT_ID` for the Linus Cloudflare account so Wrangler can run non-interactively.

## Project Structure

```text
src/
  components/      React UI components
  hooks/           Pricing and exchange-rate hooks
  i18n/            Localized UI strings
  services/        Pricing and exchange-rate clients
  store/           Persisted user preferences
  utils/           Price and currency helpers
worker/
  index.ts         Disabled Cloudflare Worker proxy
```

## Notes

The app uses the browser session cache to avoid repeatedly fetching every country configuration during short sessions. Use the refresh button in the header to clear that cache and request fresh pricing data.
