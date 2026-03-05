import { NextRequest } from "next/server";

// Clerk's shared Frontend API — routes to correct instance via Host header
const CLERK_FAPI = "https://frontend-api.clerk.services";
// The domain Clerk expects in the Host header
const CLERK_FAPI_HOST = "clerk.cardboard-tracker.com";

function corsHeaders(origin: string | null) {
  return {
    "Access-Control-Allow-Origin": origin || "*",
    "Access-Control-Allow-Methods": "GET, POST, PUT, PATCH, DELETE, OPTIONS",
    "Access-Control-Allow-Headers":
      "content-type, authorization, x-clerk-publishable-key, x-clerk-secret-key, x-clerk-js-version",
    "Access-Control-Allow-Credentials": "true",
  };
}

async function handler(req: NextRequest) {
  const origin = req.headers.get("origin");

  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders(origin) });
  }

  const path = req.nextUrl.pathname.replace("/api/clerk-proxy", "");
  const search = req.nextUrl.search;
  const target = `${CLERK_FAPI}${path}${search}`;

  const headers = new Headers(req.headers);
  // Set Host to the Clerk FAPI domain so Clerk routes to the correct instance
  headers.set("host", CLERK_FAPI_HOST);
  headers.set("x-forwarded-host", CLERK_FAPI_HOST);

  const res = await fetch(target, {
    method: req.method,
    headers,
    body: req.method !== "GET" && req.method !== "HEAD" ? req.body : undefined,
    // @ts-expect-error duplex is needed for streaming request bodies
    duplex: "half",
  });

  const responseHeaders = new Headers(res.headers);
  responseHeaders.delete("content-encoding");
  Object.entries(corsHeaders(origin)).forEach(([key, value]) => {
    responseHeaders.set(key, value);
  });

  return new Response(res.body, {
    status: res.status,
    headers: responseHeaders,
  });
}

export const GET = handler;
export const POST = handler;
export const PUT = handler;
export const PATCH = handler;
export const DELETE = handler;
export const OPTIONS = handler;
