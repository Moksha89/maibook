import { randomUUID } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const ID_ROUTE = /^\/(?:agents|companies|expenses|identifiers|ledger|owners|sites|upline-groups|api\/companies|api\/reports|api\/backups)\/([^/]+)/;

/** Same look as app/not-found.tsx, self-contained so it needs no page render. */
const NOT_FOUND_HTML = `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>Page not found | Maibook</title></head><body style="margin:0;font-family:system-ui,-apple-system,Segoe UI,sans-serif"><main style="display:grid;min-height:100vh;place-items:center;background:#f4f6f8;padding:24px;box-sizing:border-box"><section style="width:100%;max-width:28rem;border:1px solid #e3e8ef;border-radius:8px;background:#fff;padding:24px;text-align:center;box-sizing:border-box"><div style="font-family:ui-monospace,monospace;font-size:12px;font-weight:700;color:#a97819">404</div><h1 style="margin:8px 0 0;font-size:20px;color:#10233f">Page not found</h1><p style="margin:8px 0 0;font-size:14px;color:#647386">The page may have moved or you may not have access.</p><a href="/dashboard" style="display:inline-block;margin-top:16px;border-radius:9999px;background:#10233f;color:#fff;padding:8px 16px;font-size:14px;font-weight:600;text-decoration:none">Return to dashboard</a></section></main></body></html>`;

export function proxy(request: NextRequest) {
  // A malformed record ID can never exist: answer with a real 404 before any page or database work.
  const id = ID_ROUTE.exec(request.nextUrl.pathname)?.[1];
  if (id && !UUID.test(id) && !(request.nextUrl.pathname === "/api/backups/upload")) {
    // Answered here (not via rewrite: behind Apache the request origin is https and Next would proxy the rewrite externally).
    if (request.nextUrl.pathname.startsWith("/api/")) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return new NextResponse(NOT_FOUND_HTML, { status: 404, headers: { "content-type": "text/html; charset=utf-8", "cache-control": "no-store" } });
  }
  const requestId = request.headers.get("x-request-id") || randomUUID();
  const headers = new Headers(request.headers);
  headers.set("x-request-id", requestId);
  const response = NextResponse.next({ request: { headers } });
  response.headers.set("x-request-id", requestId);
  // Security headers (CSP, HSTS, frame, nosniff, referrer) are set for every route in next.config.ts.
  return response;
}

export const config = { matcher: ["/((?!_next/static|_next/image|favicon.ico|api/backups/upload).*)"] };
