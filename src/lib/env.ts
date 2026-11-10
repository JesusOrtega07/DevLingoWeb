import "server-only";

import { z } from "zod";

// Valida las variables de entorno una sola vez al arrancar. Si falta algo, la app
// falla rápido en lugar de comportarse de forma rara en producción.
const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  DATABASE_URL: z
    .string()
    .url()
    .refine((v) => v.startsWith("postgresql://") || v.startsWith("postgres://"), {
      message: "DATABASE_URL debe ser una URL de PostgreSQL",
    }),
  APP_URL: z.string().url(),
  // Header con la IP real del cliente puesto por el proxy de confianza (Cloudflare Tunnel).
  // Vacío en desarrollo: entonces no se confía en ningún header.
  TRUSTED_PROXY_HEADER: z.enum(["cf-connecting-ip"]).optional(),
});

export type Env = z.infer<typeof envSchema>;

export const parseEnv = (source: Record<string, string | undefined>): Env => {
  const result = envSchema.safeParse(source);
  if (!result.success) {
    const fields = result.error.issues.map((i) => i.path.join(".")).join(", ");
    // Solo se nombran los campos, nunca sus valores.
    throw new Error(`Variables de entorno inválidas o faltantes: ${fields}`);
  }
  return result.data;
};

export const env = parseEnv(process.env);
