import puppeteer from "@cloudflare/puppeteer";

const UPSTREAM_BASE =
  "https://chatgpt.com/backend-api/checkout_pricing_config";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Accept",
};

interface ProxyContext {
  request: Request;
  env?: {
    BROWSER?: unknown;
    launchBrowser?: BrowserLauncher;
  };
  params: {
    path?: string | string[];
  };
}

interface BrowserPage {
  setUserAgent(userAgent: string): Promise<void>;
  setViewport(viewport: { width: number; height: number }): Promise<void>;
  setExtraHTTPHeaders(headers: Record<string, string>): Promise<void>;
  goto(
    url: string,
    options: { waitUntil: "domcontentloaded"; timeout: number }
  ): Promise<{
    status(): number;
    headers(): Record<string, string>;
  } | null>;
  evaluate<T>(fn: () => T): Promise<T>;
}

interface BrowserInstance {
  newPage(): Promise<BrowserPage>;
  close(): Promise<void>;
}

type BrowserLauncher = (browserBinding: unknown) => Promise<BrowserInstance>;

function getProxyPath(path: string | string[] | undefined) {
  if (Array.isArray(path)) return `/${path.join("/")}`;
  if (path) return `/${path}`;
  return "";
}

export async function fetchPricingWithBrowser(
  path: string,
  browserBinding: unknown,
  launchBrowser: BrowserLauncher = (binding) =>
    puppeteer.launch(binding as never) as Promise<BrowserInstance>
) {
  const browser = await launchBrowser(browserBinding);
  try {
    const page = await browser.newPage();
    await page.setUserAgent(
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
    );
    await page.setViewport({ width: 1365, height: 768 });
    await page.setExtraHTTPHeaders({
      Accept: "application/json",
      "Accept-Language": "en-US,en;q=0.9",
    });
    await page.goto("https://chatgpt.com/", {
      waitUntil: "domcontentloaded",
      timeout: 15_000,
    });

    const response = await page.goto(`${UPSTREAM_BASE}${path}`, {
      waitUntil: "domcontentloaded",
      timeout: 30_000,
    });
    const body = await page.evaluate(() => document.body.innerText);
    const headers = response?.headers() ?? {};

    return {
      body,
      status: response?.status() ?? 200,
      contentType: headers["content-type"] ?? "application/json",
    };
  } finally {
    await browser.close();
  }
}

export async function onRequest({ request, params, env }: ProxyContext) {
  if (request.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: CORS_HEADERS });
  }

  if (request.method !== "GET") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
    });
  }

  const path = getProxyPath(params.path);
  if (!path || path === "/") {
    return new Response(JSON.stringify({ error: "Path required" }), {
      status: 400,
      headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
    });
  }

  if (!env?.BROWSER) {
    return new Response(JSON.stringify({ error: "Browser binding missing" }), {
      status: 500,
      headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
    });
  }

  try {
    const upstream = await fetchPricingWithBrowser(
      path,
      env.BROWSER,
      env.launchBrowser
    );

    return new Response(upstream.body, {
      status: upstream.status,
      headers: {
        ...CORS_HEADERS,
        "Content-Type": upstream.contentType,
        "Cache-Control": "public, max-age=300",
      },
    });
  } catch {
    return new Response(JSON.stringify({ error: "Upstream fetch failed" }), {
      status: 502,
      headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
    });
  }
}
