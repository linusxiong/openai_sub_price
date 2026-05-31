const UPSTREAM_BASE =
  "https://chatgpt.com/backend-api/checkout_pricing_config";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Accept",
};

type FetchLike = typeof fetch;

function getProxyPath(request: Request) {
  const url = new URL(request.url);
  return url.pathname.replace(/^\/api\/proxy/, "");
}

export async function handleApiProxyRequest(
  request: Request,
  fetchPricing: FetchLike = fetch
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

    return new Response(body, {
      status: upstream.status,
      headers: {
        ...CORS_HEADERS,
        "Content-Type": upstream.headers.get("Content-Type") ?? "application/json",
        "Cache-Control": "public, max-age=300",
      },
    });
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
