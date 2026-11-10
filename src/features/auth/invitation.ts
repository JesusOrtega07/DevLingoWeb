import "server-only";

import { prisma } from "@/lib/prisma";
import { hashToken, isWellFormedToken } from "@/lib/security/tokens";

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
