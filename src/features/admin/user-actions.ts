"use server";

import { refresh } from "next/cache";

import type { ActionState } from "@/features/admin/action-state";
import { createUserSchema, setActiveSchema, updateUserSchema, userIdSchema } from "@/features/admin/schemas";
import { createInvitationLink } from "@/features/auth/invitation";
import { Prisma } from "@/generated/prisma/client";
import { requireRole } from "@/lib/dal";
import { prisma } from "@/lib/prisma";

// Todas las acciones exigen ADMIN en el servidor y validan la entrada con zod.

const fields = (formData: FormData, names: string[]) =>
  Object.fromEntries(names.map((n) => [n, String(formData.get(n) ?? "")]));

export const createUser = async (_prev: ActionState, formData: FormData): Promise<ActionState> => {
  const admin = await requireRole("ADMIN");
  const parsed = createUserSchema.safeParse(fields(formData, ["name", "email", "role", "age", "interest"]));
  if (!parsed.success) return { fieldErrors: parsed.error.flatten().fieldErrors };
  const { name, email, role, age, interest } = parsed.data;

  let userId: string;
  try {
    const user = await prisma.user.create({
      data: {
        name,
        email,
        role,
        ...(role === "MEMBER" ? { member: { create: { displayName: name, age, interest } } } : {}),
      },
      select: { id: true },
    });
    userId = user.id;
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return { fieldErrors: { email: ["An account with this email already exists."] } };
    }
    throw error;
  }

  const link = await createInvitationLink(userId, admin.id);
  refresh();
  return { ok: true, message: `Account created for ${name}. Send them this link to set their password.`, link };
};

export const generateInvite = async (_prev: ActionState, formData: FormData): Promise<ActionState> => {
  const admin = await requireRole("ADMIN");
  const parsed = userIdSchema.safeParse(fields(formData, ["userId"]));
  if (!parsed.success) return { error: "Invalid request." };

  const user = await prisma.user.findUnique({
    where: { id: parsed.data.userId },
    select: { id: true, isActive: true, passwordHash: true },
  });
  if (!user) return { error: "Account not found." };
  if (!user.isActive) return { error: "Activate the account before creating a link." };

  const link = await createInvitationLink(user.id, admin.id);
  refresh();
  return {
    ok: true,
    message: user.passwordHash
      ? "Password reset link created. Their current sessions end when they use it."
      : "Invitation link created.",
    link,
  };
};

export const setUserActive = async (_prev: ActionState, formData: FormData): Promise<ActionState> => {
  const admin = await requireRole("ADMIN");
  const parsed = setActiveSchema.safeParse(fields(formData, ["userId", "active"]));
  if (!parsed.success) return { error: "Invalid request." };
  const { userId, active } = parsed.data;
  if (userId === admin.id) return { error: "You can't deactivate your own account." };

  const exists = await prisma.user.count({ where: { id: userId } });
  if (!exists) return { error: "Account not found." };

  await prisma.$transaction([
    prisma.user.update({ where: { id: userId }, data: { isActive: active, failedLogins: 0, lockedUntil: null } }),
    // Al desactivar se cierran sus sesiones y se anulan sus enlaces pendientes.
    ...(active
      ? []
      : [
          prisma.session.deleteMany({ where: { userId } }),
          prisma.invitation.updateMany({ where: { userId, usedAt: null }, data: { expiresAt: new Date() } }),
        ]),
  ]);
  refresh();
  return { ok: true, message: active ? "Account activated." : "Account deactivated and signed out." };
};

export const updateUser = async (_prev: ActionState, formData: FormData): Promise<ActionState> => {
  await requireRole("ADMIN");
  const parsed = updateUserSchema.safeParse(fields(formData, ["userId", "name", "age", "interest"]));
  if (!parsed.success) return { fieldErrors: parsed.error.flatten().fieldErrors };
  const { userId, name, age, interest } = parsed.data;

  const user = await prisma.user.findUnique({ where: { id: userId }, select: { role: true } });
  if (!user) return { error: "Account not found." };

  await prisma.user.update({
    where: { id: userId },
    data: {
      name,
      ...(user.role === "MEMBER"
        ? {
            member: {
              upsert: {
                create: { displayName: name, age, interest },
                update: { displayName: name, age, interest },
              },
            },
          }
        : {}),
    },
  });
  refresh();
  return { ok: true, message: "Changes saved." };
};
