import { randomUUID } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const ID_ROUTE = /^\/(?:agents|companies|expenses|identifiers|ledger|owners|sites|upline-groups|api\/companies|api\/reports|api\/backups)\/([^/]+)/;

export function proxy(request: NextRequest) {
  // A malformed record ID can never exist: answer with a real 404 before any page or database work.
  const id = ID_ROUTE.exec(request.nextUrl.pathname)?.[1];
  if (id && !UUID.test(decodeURIComponent(id)) && !(request.nextUrl.pathname === "/api/backups/upload")) {
    return NextResponse.rewrite(new URL("/_missing-record", request.url), { status: 404 });
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
