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
- One-day backend cache for upstream pricing responses
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

The backend caches successful upstream pricing responses in memory for one day. Every frontend request checks this backend cache first; after the entry expires, the next request refreshes it from the upstream API.

## Docker

Build the runtime image:

```bash
docker build -t openai-sub-price .
```

Run the container:

```bash
docker run --rm -p 8787:8787 openai-sub-price
```

The Docker image is built with a multi-stage Dockerfile. The final image only contains Node.js, the compiled backend in `dist-server/`, and the built frontend in `dist/`.

## Docker Compose

Use [`docker-compose.example.yml`](./docker-compose.example.yml) as a starting point for server deployment:

```bash
docker compose -f docker-compose.example.yml up -d
```

The example pulls `ghcr.io/linusxiong/openai_sub_price:latest` and exposes the app on port `8787`.

## GitHub Actions Container Publishing

The repository includes a manual GitHub Actions workflow at [`.github/workflows/docker-image.yml`](./.github/workflows/docker-image.yml). It builds the Docker image and publishes it to GitHub Container Registry.

To publish a container manually:

1. Open the repository on GitHub.
2. Go to **Actions**.
3. Select **Build Docker Image**.
4. Click **Run workflow**.
5. Enter the image tag, such as `latest` or `2026-05-31`.

Published tags:

- `ghcr.io/linusxiong/openai_sub_price:<image_tag>`
- `ghcr.io/linusxiong/openai_sub_price:<commit_sha>`

After the image is published, deploy it manually on your server with Docker Compose or your preferred container runtime.

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
docker-compose.example.yml
                  Example Docker Compose deployment
```

## Notes

The app uses the browser session cache to avoid repeatedly fetching every country configuration during short sessions. Use the refresh button in the header to clear that browser cache and request data from the backend. The backend may still return its one-day cached response until the server-side cache entry expires.
