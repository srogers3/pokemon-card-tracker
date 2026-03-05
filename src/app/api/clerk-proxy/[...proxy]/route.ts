import { NextRequest, NextResponse } from "next/server";

const CLERK_FAPI_HOST = "clerk.cardboard-tracker.com";

function corsHeaders(origin: string | null) {
  return {
    "Access-Control-Allow-Origin": origin || "*",
    "Access-Control-Allow-Methods": "GET, POST, PUT, PATCH, DELETE, OPTIONS",
    "Access-Control-Allow-Headers":
      "content-type, authorization, x-clerk-publishable-key, x-clerk-secret-key, x-clerk-js-version, cookie",
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

  // Use Clerk's FAPI host directly via HTTP on the server side
  // Vercel serverless can resolve this even if client-side SSL fails
  const target = `https://${CLERK_FAPI_HOST}${path}${search}`;

  // Only forward specific headers Clerk needs
  const proxyHeaders: Record<string, string> = {};

  const contentType = req.headers.get("content-type");
  if (contentType) proxyHeaders["content-type"] = contentType;

  const authorization = req.headers.get("authorization");
  if (authorization) proxyHeaders["authorization"] = authorization;

  const cookie = req.headers.get("cookie");
  if (cookie) proxyHeaders["cookie"] = cookie;

  const clerkPk = req.headers.get("x-clerk-publishable-key");
  if (clerkPk) proxyHeaders["x-clerk-publishable-key"] = clerkPk;

  const clerkJsVersion = req.headers.get("x-clerk-js-version");
  if (clerkJsVersion) proxyHeaders["x-clerk-js-version"] = clerkJsVersion;

  // Forward user-agent for Clerk analytics
  const userAgent = req.headers.get("user-agent");
  if (userAgent) proxyHeaders["user-agent"] = userAgent;

  // Pass the original IP
  const forwardedFor = req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip");
  if (forwardedFor) proxyHeaders["x-forwarded-for"] = forwardedFor;

  try {
    const res = await fetch(target, {
      method: req.method,
      headers: proxyHeaders,
      body: req.method !== "GET" && req.method !== "HEAD" ? await req.arrayBuffer() : undefined,
    });

    const body = await res.arrayBuffer();
    const responseHeaders = new Headers(res.headers);
    responseHeaders.delete("content-encoding");
    responseHeaders.delete("transfer-encoding");
    Object.entries(corsHeaders(origin)).forEach(([key, value]) => {
      responseHeaders.set(key, value);
    });

    return new Response(body, {
      status: res.status,
      headers: responseHeaders,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[clerk-proxy] Fetch error for", target, ":", message);
    return NextResponse.json(
      { error: "Proxy fetch failed", detail: message },
      { status: 502, headers: corsHeaders(origin) }
    );
  }
}

export const GET = handler;
export const POST = handler;
export const PUT = handler;
export const PATCH = handler;
export const DELETE = handler;
export const OPTIONS = handler;
