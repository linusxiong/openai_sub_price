# ChatGPT Price Comparison

[中文文档](./README.zh-CN.md)

A React app for comparing ChatGPT subscription prices across supported countries and regions. It fetches regional pricing data through a self-hosted TypeScript backend, converts prices into a selected display currency, and presents the result in a sortable, plan-focused table.

## Features

- Compare subscription prices by plan and billing interval
- Convert local prices into a selected display currency
- Sort countries and regions by converted price
- Copy both the two-letter country/region code and three-letter currency code, such as `US USD`
- Refresh pricing data from the backend with a global refresh button
- Same-origin TypeScript backend proxy for pricing API requests
- Persist language, theme, currency, plan, billing, and sorting preferences locally
- Responsive UI built with HeroUI v3 and Tailwind CSS v4

## Tech Stack

- React 19
- TypeScript
- Vite
- HeroUI v3
- Tailwind CSS v4
- Zustand
- Node.js TypeScript backend

## Local Development

Install dependencies:

```bash
npm install
```

Start the backend API and static-file server:

```bash
npm run dev:server
```

In another terminal, start Vite:

```bash
npm run dev
```

Open the local URL printed by Vite. It is usually `http://127.0.0.1:5173/`. During development, Vite proxies `/api/*` requests to `http://127.0.0.1:8787`.

## Production Deployment

Build the frontend and backend:

```bash
npm run build
```

Start the self-hosted server:

```bash
PORT=8787 npm start
```

The production server serves the built React app from `dist/` and handles pricing API requests at `/api/proxy/*`. Put your domain, TLS, and process management in front of this Node service with your usual server stack, such as Nginx, Caddy, systemd, PM2, Docker, or a platform service.

## Verification

```bash
npm test
npm run lint
npm run build
```

## Project Structure

```text
src/
  components/      React UI components
  hooks/           Pricing and exchange-rate hooks
  i18n/            Localized UI strings
  services/        Pricing and exchange-rate clients
  store/           Persisted user preferences
  utils/           Price and currency helpers
server/
  index.ts         Self-hosted Node server
  proxy.ts         Pricing API proxy handler
```

## Notes

The app uses the browser session cache to avoid repeatedly fetching every country configuration during short sessions. Use the refresh button in the header to clear that cache and request fresh pricing data from the backend.
