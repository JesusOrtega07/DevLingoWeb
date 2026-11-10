import "server-only";

import { notFound, redirect } from "next/navigation";
import { cache } from "react";

import { type SessionUser, validateSession } from "@/features/auth/session";

// Capa de acceso: TODA página, server action y route handler protegido pasa por aquí.
// El proxy solo hace una redirección rápida; la autorización real es esta.

export type Role = SessionUser["role"];

/** Usuario actual (memorizado por petición) o null. */
export const getCurrentUser = cache(validateSession);

/** Exige sesión; si no hay, manda al login. */
export const requireUser = async () => {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return user;
};

/** Exige uno de los roles. Un rol sin permiso recibe un 404 para no revelar que la ruta existe. */
export const requireRole = async (...roles: Role[]) => {
  const user = await requireUser();
  if (!roles.includes(user.role)) notFound();
  return user;
};
