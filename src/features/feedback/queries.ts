import "server-only";

import { notFound } from "next/navigation";

import { requireRole } from "@/lib/dal";
import { prisma } from "@/lib/prisma";

// Consultas del integrante (member). El filtro `member: { userId }` va SIEMPRE dentro del
// `where`: un member nunca puede leer entrevistas ni feedback de otro member.
// Solo se expone lo que es feedback para él: nada de revisiones, script ni datos internos.

/** Entrevistas del member actual, con un indicador de si ya tiene feedback guardado. */
export const listMyFeedback = async () => {
  const user = await requireRole("MEMBER");
  const interviews = await prisma.interview.findMany({
    where: { member: { userId: user.id } },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      position: true,
      interest: true,
      assignment: { select: { expert: { select: { name: true } } } },
      evaluation: { select: { updatedAt: true } },
    },
  });
  return interviews.map(({ assignment, evaluation, ...i }) => ({
    ...i,
    expertName: assignment?.expert.name ?? null,
    feedbackAt: evaluation?.updatedAt ?? null,
  }));
};

/** Feedback guardado de una entrevista del member actual. 404 si no es suya o aún no hay feedback. */
export const getMyFeedback = async (interviewId: string) => {
  const user = await requireRole("MEMBER");
  const interview = await prisma.interview.findFirst({
    where: { id: interviewId, member: { userId: user.id }, evaluation: { isNot: null } },
    select: {
      position: true,
      interest: true,
      member: { select: { displayName: true } },
      evaluation: {
        select: {
          fluency: true,
          grammar: true,
          vocabulary: true,
          pronunciation: true,
          confidence: true,
          strength: true,
          improve1: true,
          improve2: true,
          nextRound: true,
          updatedAt: true,
          expert: { select: { name: true } },
          mistakes: { orderBy: { position: "asc" }, select: { heSaid: true, better: true } },
        },
      },
    },
  });
  if (!interview?.evaluation) notFound();
  const { evaluation, ...rest } = interview;
  return { ...rest, evaluation };
};
