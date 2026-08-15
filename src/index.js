// Cloudflare Worker entry point for the Shaz Print SPA.
//
// Responsibilities:
//   - GET /api/count  -> increments and returns the KV-backed visitor count
//   - everything else -> serves the built Vite app from ./dist (via the
//     ASSETS binding), falling back to index.html for SPA routes.

const COUNT_KEY = "visits";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

async function handleCount(request, env) {
  // Preflight for browsers.
  if (request.method === "OPTIONS") {
    return new Response(null, { headers: CORS_HEADERS });
  }

  if (request.method !== "GET") {
    return new Response("Method not allowed", { status: 405, headers: CORS_HEADERS });
  }

  try {
    const raw = await env.VIEW_COUNTER.get(COUNT_KEY);
    const current = raw ? parseInt(raw, 10) : 0;
    const next = Number.isFinite(current) ? current + 1 : 1;
    await env.VIEW_COUNTER.put(COUNT_KEY, String(next));

    return new Response(JSON.stringify({ visits: next }), {
      headers: { "Content-Type": "application/json", ...CORS_HEADERS },
    });
  } catch (error) {
    console.error("Visitor counter failed:", error);
    return new Response(JSON.stringify({ error: "Counter failed" }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...CORS_HEADERS },
    });
  }
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // API route handled by the Worker.
    if (url.pathname === "/api/count") {
      return handleCount(request, env);
    }

    // Everything else is served from the static asset binding.
    // env.ASSETS.fetch() serves from ./dist; for SPA routes that don't match
    // a real file, fall back to index.html so client-side routing works.
    const response = await env.ASSETS.fetch(request);
    if (response.status === 404 && !url.pathname.includes(".")) {
      return env.ASSETS.fetch(new Request(new URL("/index.html", url), request));
    }
    return response;
  },
};
