// IP del cliente para el rate limiting.
//
// En producción la app solo escucha en 127.0.0.1 y únicamente cloudflared llega a ella,
// así que se confía en el header que pone Cloudflare (TRUSTED_PROXY_HEADER=cf-connecting-ip).
// Sin esa variable no se confía en ningún header: cualquiera podría falsificarlo.
export const getClientIp = (headers: Headers, trustedHeader: string | undefined) => {
  if (trustedHeader) {
    const value = headers.get(trustedHeader)?.split(",")[0]?.trim();
    if (value && value.length <= 64 && /^[0-9a-fA-F:.]+$/.test(value)) return value;
  }
  return "local";
};
