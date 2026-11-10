import "server-only";

import { PrismaPg } from "@prisma/adapter-pg";

import { PrismaClient } from "@/generated/prisma/client";
import { env } from "@/lib/env";

// Una sola instancia de PrismaClient; en desarrollo se reutiliza entre recargas en caliente.
const createClient = () =>
  new PrismaClient({ adapter: new PrismaPg({ connectionString: env.DATABASE_URL }) });

const globalForPrisma = globalThis as unknown as { prisma?: ReturnType<typeof createClient> };

export const prisma = globalForPrisma.prisma ?? createClient();

if (env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
