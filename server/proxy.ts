const UPSTREAM_BASE =
  "https://chatgpt.com/backend-api/checkout_pricing_config";
const ONE_DAY_MS = 24 * 60 * 60 * 1_000;

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Accept",
};

type FetchLike = typeof fetch;

type CacheEntry = {
  body: string;
  cachedAt: number;
  contentType: string;
  status: number;
};

type ProxyOptions = {
  cache?: Map<string, CacheEntry>;
  now?: () => number;
};

const pricingCache = new Map<string, CacheEntry>();

function getProxyPath(request: Request) {
  const url = new URL(request.url);
  return `${url.pathname.replace(/^\/api\/proxy/, "")}${url.search}`;
}

function createProxyResponse(entry: CacheEntry, cacheStatus: "HIT" | "MISS") {
  return new Response(entry.body, {
    status: entry.status,
    headers: {
      ...CORS_HEADERS,
      "Content-Type": entry.contentType,
      "Cache-Control": `public, max-age=${ONE_DAY_MS / 1_000}`,
      "X-Cache": cacheStatus,
    },
  });
}

export async function handleApiProxyRequest(
  request: Request,
  fetchPricing: FetchLike = fetch,
  options: ProxyOptions = {}
) {
  if (request.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: CORS_HEADERS });
  }

  if (request.method !== "GET") {
    return Response.json(
      { error: "Method not allowed" },
      {
        status: 405,
        headers: CORS_HEADERS,
      }
    );
  }

  const path = getProxyPath(request);
  if (!path || path === "/") {
    return Response.json(
      { error: "Path required" },
      {
        status: 400,
        headers: CORS_HEADERS,
      }
    );
  }

  const cache = options.cache ?? pricingCache;
  const now = options.now ?? Date.now;
  const cached = cache.get(path);

  if (cached && now() - cached.cachedAt < ONE_DAY_MS) {
    return createProxyResponse(cached, "HIT");
  }

  try {
    const upstream = await fetchPricing(`${UPSTREAM_BASE}${path}`, {
      headers: new Headers({
        Accept: "application/json",
        "User-Agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept-Language": "en-US,en;q=0.9",
      }),
    });
    const body = await upstream.text();
    const entry = {
      body,
      cachedAt: now(),
      contentType: upstream.headers.get("Content-Type") ?? "application/json",
      status: upstream.status,
    };

    if (upstream.ok) {
      cache.set(path, entry);
    }

    return createProxyResponse(entry, "MISS");
  } catch {
    return Response.json(
      { error: "Upstream fetch failed" },
      {
        status: 502,
        headers: CORS_HEADERS,
      }
    );
  }
}
