import type { NextConfig } from "next";

// Headers de seguridad estáticos. La CSP (con nonce por petición) vive en src/proxy.ts.
const securityHeaders = [
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), payment=(), usb=(), interest-cohort=()",
  },
  { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
  { key: "Cross-Origin-Resource-Policy", value: "same-origin" },
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains" },
];

const nextConfig: NextConfig = {
  // Cache Components / PPR no son compatibles con la CSP basada en nonce, y todas las
  // páginas de DevLingo son dinámicas (dependen de la sesión), así que se dejan apagados.
  cacheComponents: false,
  poweredByHeader: false,
  reactStrictMode: true,
  experimental: {
    serverActions: {
      // Los .md pesan máximo 1 MB; se deja un margen para el resto del formulario.
      bodySizeLimit: "1.2mb",
    },
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

export default nextConfig;
