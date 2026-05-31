const UPSTREAM_BASE =
  "https://chatgpt.com/backend-api/checkout_pricing_config";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Accept",
};

interface ProxyContext {
  request: Request;
  params: {
    path?: string | string[];
  };
}

function getProxyPath(path: string | string[] | undefined) {
  if (Array.isArray(path)) return `/${path.join("/")}`;
  if (path) return `/${path}`;
  return "";
}

export async function onRequest({ request, params }: ProxyContext) {
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

  try {
    const upstream = await fetch(`${UPSTREAM_BASE}${path}`, {
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
    return new Response(JSON.stringify({ error: "Upstream fetch failed" }), {
      status: 502,
      headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
    });
  }
}
