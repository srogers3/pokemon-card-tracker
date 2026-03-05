import { NextRequest } from "next/server";

const CLERK_FAPI = process.env.CLERK_FAPI_URL || "https://frontend-api.clerk.services";

async function handler(req: NextRequest) {
  const path = req.nextUrl.pathname.replace("/api/clerk-proxy", "");
  const search = req.nextUrl.search;
  const target = `${CLERK_FAPI}${path}${search}`;

  const headers = new Headers(req.headers);
  headers.delete("host");

  const res = await fetch(target, {
    method: req.method,
    headers,
    body: req.method !== "GET" && req.method !== "HEAD" ? req.body : undefined,
    // @ts-expect-error duplex is needed for streaming request bodies
    duplex: "half",
  });

  const responseHeaders = new Headers(res.headers);
  responseHeaders.delete("content-encoding");

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
