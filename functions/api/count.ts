// Cloudflare Pages Function — exposes a visitor counter backed by KV.
//
// The KV namespace bound as `VIEW_COUNTER` in wrangler.toml is injected
// into `context.env` automatically by Cloudflare. This is the "database
// binding" for the counter.

export interface Env {
  VIEW_COUNTER: KVNamespace;
}

interface EnvContext {
  env: Env;
  request: Request;
}

const KEY = "visits";
const CORS_HEADERS: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export async function onRequest(context: EnvContext): Promise<Response> {
  const { env, request } = context;

  // Preflight for browsers that send one.
  if (request.method === "OPTIONS") {
    return new Response(null, { headers: CORS_HEADERS });
  }

  // Only GET is meaningful for a counter.
  if (request.method !== "GET") {
    return new Response("Method not allowed", { status: 405, headers: CORS_HEADERS });
  }

  try {
    let count = await env.VIEW_COUNTER.get(KEY);
    const current = count ? parseInt(count, 10) : 0;
    const next = Number.isFinite(current) ? current + 1 : 1;

    await env.VIEW_COUNTER.put(KEY, String(next));

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
