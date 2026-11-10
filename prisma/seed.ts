// Seed de DevLingo. Idempotente: se puede correr varias veces.
//
// - Siempre: la cuenta admin (SEED_ADMIN_EMAIL / SEED_ADMIN_NAME).
// - Datos demo (Lili como expert, Jesús como member, su entrevista y la asignación):
//   solo fuera de producción, o en producción con SEED_DEMO=true.
//
// Nadie recibe contraseña aquí: a las cuentas sin contraseña se les genera un enlace de
// invitación de un solo uso (72 h) que se imprime UNA vez en la terminal. Cada corrida
// invalida los enlaces anteriores sin usar de esas cuentas.
//
// El script .md de la entrevista se adjunta en la fase del parser.
import "dotenv/config";

import { PrismaPg } from "@prisma/adapter-pg";
import { z } from "zod";

import { PrismaClient, Role } from "../src/generated/prisma/client";
import { generateToken, hashToken } from "../src/lib/security/tokens";

const INVITATION_TTL_MS = 72 * 60 * 60 * 1000;

const isProduction = process.env.NODE_ENV === "production";

const seedEnv = z
  .object({
    DATABASE_URL: z.string().url(),
    APP_URL: z.string().url(),
    SEED_ADMIN_EMAIL: isProduction ? z.string().email() : z.string().email().default("admin@devlingo.test"),
    SEED_ADMIN_NAME: z.string().min(1).default("Admin"),
    SEED_DEMO: z.enum(["true", "false"]).optional(),
  })
  .parse(process.env);

const withDemo = seedEnv.SEED_DEMO ? seedEnv.SEED_DEMO === "true" : !isProduction;

const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: seedEnv.DATABASE_URL }) });

const upsertUser = (email: string, name: string, role: Role) =>
  prisma.user.upsert({
    where: { email: email.toLowerCase() },
    update: {},
    create: { email: email.toLowerCase(), name, role },
  });

/** Crea un enlace de invitación nuevo si la cuenta aún no tiene contraseña. */
const inviteIfPending = async (user: { id: string; email: string; passwordHash: string | null }) => {
  if (user.passwordHash) return null;
  const token = generateToken();
  await prisma.$transaction([
    prisma.invitation.updateMany({
      where: { userId: user.id, usedAt: null },
      data: { expiresAt: new Date() },
    }),
    prisma.invitation.create({
      data: { userId: user.id, tokenHash: hashToken(token), expiresAt: new Date(Date.now() + INVITATION_TTL_MS) },
    }),
  ]);
  return `${seedEnv.APP_URL.replace(/\/$/, "")}/invite/${token}`;
};

const main = async () => {
  const admin = await upsertUser(seedEnv.SEED_ADMIN_EMAIL, seedEnv.SEED_ADMIN_NAME, Role.ADMIN);
  const users = [admin];

  if (withDemo) {
    const lili = await upsertUser("lili@devlingo.test", "Lili", Role.EXPERT);
    const jesusUser = await upsertUser("jesus@devlingo.test", "Jesús", Role.MEMBER);
    users.push(lili, jesusUser);

    const jesus = await prisma.member.upsert({
      where: { userId: jesusUser.id },
      update: {},
      create: { userId: jesusUser.id, displayName: "Jesús", interest: "Data Science" },
    });

    let interview = await prisma.interview.findFirst({
      where: { memberId: jesus.id, position: "Junior Data Analyst" },
    });
    interview ??= await prisma.interview.create({
      data: { memberId: jesus.id, position: "Junior Data Analyst", interest: "Data Science" },
    });

    await prisma.assignment.upsert({
      where: { interviewId: interview.id },
      update: {},
      create: { interviewId: interview.id, expertId: lili.id, assignedById: admin.id },
    });
  }

  console.log(`Seed listo${withDemo ? " (con datos demo)" : ""}.`);
  for (const user of users) {
    const link = await inviteIfPending(user);
    console.log(`  ${user.role.padEnd(6)} ${user.email}${link ? `\n         invitación: ${link}` : " (ya tiene contraseña)"}`);
  }
};

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
