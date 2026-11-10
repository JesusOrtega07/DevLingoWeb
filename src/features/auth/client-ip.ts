// IP del cliente para el rate limiting.
//
// En producción la app solo escucha en 127.0.0.1 y únicamente el túnel (Tailscale Funnel)
// llega a ella, así que se puede confiar en el header que pone ese proxy:
//  - x-forwarded-for: el proxy añade la IP real AL FINAL. Lo que venga antes lo pudo escribir
//    el propio visitante, así que solo se usa la última entrada.
//  - cf-connecting-ip: un único valor puesto por Cloudflare (si algún día se usa Cloudflare Tunnel).
// Sin TRUSTED_PROXY_HEADER no se confía en ningún header: cualquiera podría falsificarlo.

/** Valor cuando no se conoce la IP real: no identifica a nadie, así que no se usa para limitar por IP. */
export const UNKNOWN_IP = "local";

export type TrustedProxyHeader = "x-forwarded-for" | "cf-connecting-ip";

export const getClientIp = (headers: Headers, trustedHeader: TrustedProxyHeader | undefined) => {
  if (trustedHeader) {
    const entries = headers.get(trustedHeader)?.split(",") ?? [];
    const value = (trustedHeader === "x-forwarded-for" ? entries.at(-1) : entries[0])?.trim();
    if (value && value.length <= 64 && /^[0-9a-fA-F:.]+$/.test(value)) return value;
  }
  return UNKNOWN_IP;
};
