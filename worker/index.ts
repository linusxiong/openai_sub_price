const UPSTREAM_BASE =
  "https://chatgpt.com/backend-api/checkout_pricing_config";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Accept",
};

export default {
  async fetch(request: Request): Promise<Response> {
    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: CORS_HEADERS });
    }

    const url = new URL(request.url);
    const path = url.pathname.replace(/^\/api\/proxy/, "");

    if (!path || path === "/") {
      return new Response(JSON.stringify({ error: "Path required" }), {
        status: 400,
        headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
      });
    }

    const upstream = `${UPSTREAM_BASE}${path}`;

    try {
      const response = await fetch(upstream, {
        headers: {
          Accept: "application/json",
          "User-Agent":
            "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
          "Accept-Language": "en-US,en;q=0.9",
        },
      });

      const body = await response.text();

      return new Response(body, {
        status: response.status,
        headers: {
          ...CORS_HEADERS,
          "Content-Type": response.headers.get("Content-Type") ?? "application/json",
          "Cache-Control": "public, max-age=300",
        },
      });
    } catch (err) {
      return new Response(
        JSON.stringify({ error: "Upstream fetch failed" }),
        {
          status: 502,
          headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
        }
      );
    }
  },
};
