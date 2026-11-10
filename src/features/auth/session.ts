import "server-only";

import { cookies } from "next/headers";

import { env } from "@/lib/env";
import { prisma } from "@/lib/prisma";
import { generateToken, hashToken, isWellFormedToken } from "@/lib/security/tokens";

// Sesiones en base de datos. La cookie lleva un token aleatorio; la BD guarda su sha256.
// - Caduca tras 7 días sin uso (se renueva al usarla).
// - Caduca siempre a los 30 días de creada, aunque se use.

const IDLE_MS = 7 * 24 * 60 * 60 * 1000;
const ABSOLUTE_MS = 30 * 24 * 60 * 60 * 1000;
const RENEW_AFTER_MS = 24 * 60 * 60 * 1000;

const isDev = env.NODE_ENV === "development";

// El prefijo __Host- obliga a Secure, Path=/ y sin Domain. En desarrollo (http://localhost)
// algunos navegadores no aceptan cookies Secure, así que solo ahí se usa un nombre simple.
export const SESSION_COOKIE = isDev ? "devlingo_session" : "__Host-devlingo_session";

const cookieOptions = {
  httpOnly: true,
  secure: !isDev,
  sameSite: "lax" as const,
  path: "/",
  maxAge: ABSOLUTE_MS / 1000,
};

export type SessionUser = {
  id: string;
  name: string;
  email: string;
  role: "ADMIN" | "EXPERT" | "MEMBER";
};

export const createSession = async (userId: string, meta: { ip: string; userAgent: string | null }) => {
  const token = generateToken();
  await prisma.session.create({
    data: {
      tokenHash: hashToken(token),
      userId,
      expiresAt: new Date(Date.now() + IDLE_MS),
      ip: meta.ip,
      userAgent: meta.userAgent?.slice(0, 255) ?? null,
    },
  });
  (await cookies()).set(SESSION_COOKIE, token, cookieOptions);
};

/** Devuelve el usuario de la sesión actual o null. No modifica cookies (sirve en Server Components). */
export const validateSession = async (): Promise<SessionUser | null> => {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token || !isWellFormedToken(token)) return null;

  const session = await prisma.session.findUnique({
    where: { tokenHash: hashToken(token) },
    select: {
      id: true,
      expiresAt: true,
      createdAt: true,
      lastSeenAt: true,
      user: { select: { id: true, name: true, email: true, role: true, isActive: true } },
    },
  });
  if (!session) return null;

  const now = Date.now();
  const expired = session.expiresAt.getTime() <= now || session.createdAt.getTime() + ABSOLUTE_MS <= now;
  if (expired || !session.user.isActive) {
    await prisma.session.delete({ where: { id: session.id } }).catch(() => undefined);
    return null;
  }

  // Renovación deslizante, como mucho una escritura al día por sesión.
  if (now - session.lastSeenAt.getTime() > RENEW_AFTER_MS) {
    await prisma.session.update({
      where: { id: session.id },
      data: { lastSeenAt: new Date(now), expiresAt: new Date(now + IDLE_MS) },
    });
  }

  const { id, name, email, role } = session.user;
  return { id, name, email, role };
};

/** Cierra la sesión actual (BD y cookie). Solo en Server Actions o Route Handlers. */
export const destroyCurrentSession = async () => {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (token && isWellFormedToken(token)) {
    await prisma.session.deleteMany({ where: { tokenHash: hashToken(token) } });
  }
  store.delete(SESSION_COOKIE);
};
