import "server-only";

import { env } from "@/lib/env";
import { prisma } from "@/lib/prisma";
import { generateToken, hashToken, isWellFormedToken } from "@/lib/security/tokens";

export const INVITATION_TTL_MS = 72 * 60 * 60 * 1000;

/** Busca una invitación vigente (sin usar y sin caducar). Devuelve solo lo necesario para la vista. */
export const findValidInvitation = async (token: string) => {
  if (!isWellFormedToken(token)) return null;
  const invitation = await prisma.invitation.findUnique({
    where: { tokenHash: hashToken(token) },
    select: {
      id: true,
      expiresAt: true,
      usedAt: true,
      user: { select: { id: true, name: true, email: true, isActive: true } },
    },
  });
  if (!invitation || invitation.usedAt || invitation.expiresAt <= new Date() || !invitation.user.isActive) {
    return null;
  }
  return invitation;
};

/**
 * Crea un enlace de un solo uso (72 h) e invalida los anteriores sin usar de esa cuenta.
 * El token en claro solo existe en el valor devuelto: se muestra una vez al admin.
 */
export const createInvitationLink = async (userId: string, createdById: string | null) => {
  const token = generateToken();
  const now = new Date();
  await prisma.$transaction([
    prisma.invitation.updateMany({ where: { userId, usedAt: null, expiresAt: { gt: now } }, data: { expiresAt: now } }),
    prisma.invitation.create({
      data: { userId, createdById, tokenHash: hashToken(token), expiresAt: new Date(now.getTime() + INVITATION_TTL_MS) },
    }),
  ]);
  return `${env.APP_URL.replace(/\/$/, "")}/invite/${token}`;
};
