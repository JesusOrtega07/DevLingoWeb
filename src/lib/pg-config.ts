import type { PoolConfig } from "pg";

// Configuración de la conexión de Prisma (adapter-pg) a PostgreSQL.
//
// La sesión se fija en UTC: adapter-pg ignora el desfase horario al leer columnas timestamptz,
// así que con la zona del servidor (p. ej. -06) los valores que pone la BD (now() en
// createdAt, savedAt...) se leerían 6 horas antes. En UTC el desfase es 0 y lecturas y
// escrituras coinciden.
export const pgConfig = (connectionString: string): PoolConfig => ({
  connectionString,
  options: "-c TimeZone=UTC",
});
