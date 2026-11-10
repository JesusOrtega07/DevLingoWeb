import "server-only";

import { requireRole } from "@/lib/dal";
import { prisma } from "@/lib/prisma";

// Consultas del panel de admin. Cada una exige el rol ADMIN por sí misma y devuelve
// solo los campos que la vista necesita (nunca hashes ni tokens).

export const getOverview = async () => {
  await requireRole("ADMIN");
  const [users, members, interviews, pending, unassigned, withoutScript] = await Promise.all([
    prisma.user.count(),
    prisma.member.count(),
    prisma.interview.count(),
    prisma.interview.count({ where: { status: "PENDING" } }),
    prisma.interview.count({ where: { assignment: null } }),
    prisma.interview.count({ where: { currentScriptId: null } }),
  ]);
  return { users, members, interviews, pending, unassigned, withoutScript };
};

export const listUsers = async () => {
  await requireRole("ADMIN");
  const users = await prisma.user.findMany({
    orderBy: [{ role: "asc" }, { name: "asc" }],
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      isActive: true,
      passwordHash: true,
      member: { select: { age: true, interest: true } },
    },
  });
  return users.map(({ passwordHash, ...user }) => ({ ...user, hasPassword: passwordHash !== null }));
};

export const getUser = async (userId: string) => {
  await requireRole("ADMIN");
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      isActive: true,
      passwordHash: true,
      lockedUntil: true,
      createdAt: true,
      member: {
        select: {
          id: true,
          displayName: true,
          age: true,
          interest: true,
          interviews: { select: { id: true, position: true, status: true }, orderBy: { createdAt: "desc" } },
        },
      },
      _count: { select: { assignments: true, sessions: true } },
    },
  });
  if (!user) return null;
  const { passwordHash, ...rest } = user;
  return { ...rest, hasPassword: passwordHash !== null };
};

export const listInterviews = async () => {
  await requireRole("ADMIN");
  return prisma.interview.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      position: true,
      interest: true,
      status: true,
      member: { select: { displayName: true } },
      assignment: { select: { expert: { select: { name: true } } } },
      currentScript: { select: { version: true } },
    },
  });
};

export const getInterview = async (interviewId: string) => {
  await requireRole("ADMIN");
  return prisma.interview.findUnique({
    where: { id: interviewId },
    select: {
      id: true,
      position: true,
      interest: true,
      status: true,
      currentScriptId: true,
      member: { select: { id: true, displayName: true, age: true, user: { select: { id: true } } } },
      assignment: { select: { expertId: true, assignedAt: true, expert: { select: { name: true } } } },
      evaluation: { select: { savedAt: true, updatedAt: true } },
      scripts: {
        orderBy: { version: "desc" },
        select: {
          id: true,
          version: true,
          fileName: true,
          createdAt: true,
          uploadedBy: { select: { name: true } },
        },
      },
    },
  });
};

export const getScriptOriginal = async (interviewId: string, scriptId: string) => {
  await requireRole("ADMIN");
  return prisma.interviewScript.findFirst({
    where: { id: scriptId, interviewId },
    select: {
      version: true,
      fileName: true,
      originalMd: true,
      sha256: true,
      createdAt: true,
      interview: { select: { position: true, member: { select: { displayName: true } } } },
    },
  });
};

export const listActiveExperts = async () => {
  await requireRole("ADMIN");
  return prisma.user.findMany({
    where: { role: "EXPERT", isActive: true },
    orderBy: { name: "asc" },
    select: { id: true, name: true },
  });
};

export const listMembersForSelect = async () => {
  await requireRole("ADMIN");
  return prisma.member.findMany({
    where: { user: { isActive: true } },
    orderBy: { displayName: "asc" },
    select: { id: true, displayName: true, interest: true },
  });
};
