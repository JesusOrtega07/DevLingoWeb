"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { findValidInvitation } from "@/features/auth/invitation";
import { hashPassword, verifyAgainstDummy, verifyPassword } from "@/features/auth/password";
import {
  RATE_LIMIT,
  attemptKey,
  isLocked,
  isThrottled,
  nextFailureState,
} from "@/features/auth/rate-limit-policy";
import { loginSchema, newPasswordSchema } from "@/features/auth/schemas";
import { getClientIp } from "@/features/auth/client-ip";
import { createSession, destroyCurrentSession } from "@/features/auth/session";
import { env } from "@/lib/env";
import { prisma } from "@/lib/prisma";

export type FormState = {
  error?: string;
  fieldErrors?: Record<string, string[] | undefined>;
  values?: Record<string, string>;
};

const INVALID_CREDENTIALS = "Incorrect email or password.";
const TOO_MANY_ATTEMPTS = "Too many attempts. Please wait 15 minutes and try again.";
const INVALID_LINK = "This link is no longer valid. Ask an admin for a new one.";

const requestMeta = async () => {
  const h = await headers();
  return { ip: getClientIp(h, env.TRUSTED_PROXY_HEADER), userAgent: h.get("user-agent") };
};

// ─────────────────────────────────────────────────────────────────────────────
// Login
// ─────────────────────────────────────────────────────────────────────────────

export const login = async (_prev: FormState, formData: FormData): Promise<FormState> => {
  const rawEmail = String(formData.get("email") ?? "").slice(0, 254);
  const parsed = loginSchema.safeParse({ email: formData.get("email"), password: formData.get("password") });
  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors, values: { email: rawEmail } };
  }
  const { email, password } = parsed.data;
  const meta = await requestMeta();
  const key = attemptKey(email, meta.ip);
  const now = new Date();
  const since = new Date(now.getTime() - RATE_LIMIT.windowMs);

  const [keyFailures, ipFailures] = await Promise.all([
    prisma.loginAttempt.count({ where: { key, success: false, createdAt: { gte: since } } }),
    prisma.loginAttempt.count({ where: { ip: meta.ip, success: false, createdAt: { gte: since } } }),
  ]);
  if (isThrottled(keyFailures, ipFailures)) {
    return { error: TOO_MANY_ATTEMPTS, values: { email } };
  }

  const recordAttempt = (success: boolean) =>
    prisma.loginAttempt.create({ data: { key, ip: meta.ip, success } });

  const user = await prisma.user.findUnique({
    where: { email },
    select: { id: true, passwordHash: true, isActive: true, failedLogins: true, lockedUntil: true },
  });

  if (!user || !user.passwordHash || !user.isActive) {
    await verifyAgainstDummy(password);
    await recordAttempt(false);
    return { error: INVALID_CREDENTIALS, values: { email } };
  }

  if (isLocked(user.lockedUntil, now)) {
    await verifyAgainstDummy(password);
    await recordAttempt(false);
    return { error: TOO_MANY_ATTEMPTS, values: { email } };
  }

  if (!(await verifyPassword(user.passwordHash, password))) {
    await prisma.user.update({ where: { id: user.id }, data: nextFailureState(user.failedLogins, now) });
    await recordAttempt(false);
    return { error: INVALID_CREDENTIALS, values: { email } };
  }

  await prisma.user.update({ where: { id: user.id }, data: { failedLogins: 0, lockedUntil: null } });
  await recordAttempt(true);
  // Limpieza oportunista de intentos viejos (más de un día).
  await prisma.loginAttempt.deleteMany({ where: { createdAt: { lt: new Date(now.getTime() - 86_400_000) } } });

  await destroyCurrentSession();
  await createSession(user.id, meta);
  redirect("/");
};

// ─────────────────────────────────────────────────────────────────────────────
// Logout
// ─────────────────────────────────────────────────────────────────────────────

export const logout = async () => {
  await destroyCurrentSession();
  redirect("/login");
};

// ─────────────────────────────────────────────────────────────────────────────
// Aceptar invitación (definir contraseña)
// ─────────────────────────────────────────────────────────────────────────────

export const acceptInvitation = async (_prev: FormState, formData: FormData): Promise<FormState> => {
  const parsed = newPasswordSchema.safeParse({
    token: formData.get("token"),
    password: formData.get("password"),
    confirm: formData.get("confirm"),
  });
  if (!parsed.success) {
    const fieldErrors = parsed.error.flatten().fieldErrors;
    if (fieldErrors.token) return { error: INVALID_LINK };
    return { fieldErrors };
  }
  const { token, password } = parsed.data;

  const invitation = await findValidInvitation(token);
  if (!invitation) return { error: INVALID_LINK };
  if (password.toLowerCase().includes(invitation.user.email.split("@")[0].toLowerCase())) {
    return { fieldErrors: { password: ["Don't use your email in your password."] } };
  }

  const passwordHash = await hashPassword(password);
  const now = new Date();
  const userId = invitation.user.id;

  try {
    await prisma.$transaction(async (tx) => {
      // Marcar como usada solo si nadie la usó en paralelo.
      const claimed = await tx.invitation.updateMany({
        where: { id: invitation.id, usedAt: null, expiresAt: { gt: now } },
        data: { usedAt: now },
      });
      if (claimed.count !== 1) throw new Error("invitation-already-used");

      await tx.user.update({
        where: { id: userId },
        data: { passwordHash, passwordChangedAt: now, failedLogins: 0, lockedUntil: null },
      });
      await tx.invitation.updateMany({ where: { userId, usedAt: null }, data: { expiresAt: now } });
      await tx.session.deleteMany({ where: { userId } });
    });
  } catch {
    return { error: INVALID_LINK };
  }

  await destroyCurrentSession();
  await createSession(userId, await requestMeta());
  redirect("/");
};
