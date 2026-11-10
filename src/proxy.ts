import { NextResponse, type NextRequest } from "next/server";

import { buildCsp } from "@/lib/security/csp";

// En esta fase el proxy solo pone la CSP; la protección por sesión llega en la fase de auth
// (y aun entonces la autorización real se hace en el servidor, no aquí).
export const proxy = (request: NextRequest) => {
  const nonce = Buffer.from(crypto.randomUUID()).toString("base64");
  const csp = buildCsp(nonce, process.env.NODE_ENV === "development");

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-nonce", nonce);
  requestHeaders.set("Content-Security-Policy", csp);

  const response = NextResponse.next({ request: { headers: requestHeaders } });
  response.headers.set("Content-Security-Policy", csp);
  return response;
};

export const config = {
  matcher: [
    {
      source: "/((?!_next/static|_next/image|favicon.ico|logo.svg).*)",
      missing: [
        { type: "header", key: "next-router-prefetch" },
        { type: "header", key: "purpose", value: "prefetch" },
      ],
    },
  ],
};
