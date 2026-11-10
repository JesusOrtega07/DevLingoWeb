// Genera un enlace de un solo uso (72 h) para que una cuenta defina o cambie su contraseña.
// Sirve para entrar como admin la primera vez o si se olvidó la contraseña, también en producción.
//
// Uso:  npm run access-link -- admin@devlingo.test
//
// El enlace se imprime solo en tu terminal. Anula los enlaces anteriores sin usar de esa cuenta.
// Al usarlo se cierran las demás sesiones de la cuenta.
import "dotenv/config";

import { PrismaPg } from "@prisma/adapter-pg";
import { z } from "zod";

import { PrismaClient } from "../src/generated/prisma/client";
import { generateToken, hashToken } from "../src/lib/security/tokens";

const INVITATION_TTL_MS = 72 * 60 * 60 * 1000;

const env = z.object({ DATABASE_URL: z.string().url(), APP_URL: z.string().url() }).parse(process.env);
const emailArg = z.string().trim().toLowerCase().pipe(z.email()).safeParse(process.argv[2] ?? "");

if (!emailArg.success) {
  console.error("Uso: npm run access-link -- <email>");
  process.exit(1);
}

const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: env.DATABASE_URL }) });

const main = async () => {
  const user = await prisma.user.findUnique({
    where: { email: emailArg.data },
    select: { id: true, name: true, role: true, isActive: true, passwordHash: true },
  });
  if (!user) throw new Error(`No existe una cuenta con el email ${emailArg.data}.`);
  if (!user.isActive) throw new Error("La cuenta está desactivada. Actívala antes de generar un enlace.");

  const token = generateToken();
  const now = new Date();
  await prisma.$transaction([
    prisma.invitation.updateMany({
      where: { userId: user.id, usedAt: null, expiresAt: { gt: now } },
      data: { expiresAt: now },
    }),
    prisma.invitation.create({
      data: { userId: user.id, tokenHash: hashToken(token), expiresAt: new Date(now.getTime() + INVITATION_TTL_MS) },
    }),
    // Si estaba bloqueada por intentos fallidos, se desbloquea.
    prisma.user.update({ where: { id: user.id }, data: { failedLogins: 0, lockedUntil: null } }),
  ]);

  const link = `${env.APP_URL.replace(/\/$/, "")}/invite/${token}`;
  console.log(`${user.name} (${user.role}) · ${user.passwordHash ? "cambio de contraseña" : "activación"}`);
  console.log(`Enlace (72 h, un solo uso): ${link}`);
};

main()
  .catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
