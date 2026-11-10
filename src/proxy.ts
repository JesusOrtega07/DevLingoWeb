import { NextResponse, type NextRequest } from "next/server";

import { buildCsp } from "@/lib/security/csp";

// Rutas accesibles sin sesión.
const PUBLIC_PATHS = [/^\/login$/, /^\/invite\/[^/]+$/];
const SESSION_COOKIES = ["__Host-devlingo_session", "devlingo_session"];

// El proxy pone la CSP y hace una redirección rápida al login si no hay cookie de sesión.
// NO es la protección real: cada página y acción valida la sesión y el rol en el servidor (lib/dal.ts).
export const proxy = (request: NextRequest) => {
  const { pathname } = request.nextUrl;
  const isPublic = PUBLIC_PATHS.some((re) => re.test(pathname));
  const hasSessionCookie = SESSION_COOKIES.some((name) => request.cookies.has(name));

  if (!isPublic && !hasSessionCookie) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

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
      // Excluye los recursos internos de Next (/_next/*: estáticos, imágenes, HMR) y los íconos.
      source: "/((?!_next/|favicon.ico|icon.svg|logo.svg).*)",
      missing: [
        { type: "header", key: "next-router-prefetch" },
        { type: "header", key: "purpose", value: "prefetch" },
      ],
    },
  ],
};
