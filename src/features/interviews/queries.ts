import "server-only";

import { notFound } from "next/navigation";
import { cache } from "react";

import type { ProcessedScript } from "@/features/scripts/types";
import { requireRole } from "@/lib/dal";
import { prisma } from "@/lib/prisma";

// Consultas de la English Expert. El filtro por asignación va SIEMPRE dentro del `where`:
// una expert nunca puede leer una entrevista que no tiene asignada.

/** Entrevistas asignadas a la expert actual (su "DevLingo Family"). */
export const listMyInterviews = async () => {
  const user = await requireRole("EXPERT");
  const interviews = await prisma.interview.findMany({
    where: { assignment: { expertId: user.id } },
    orderBy: [{ status: "asc" }, { member: { displayName: "asc" } }],
    select: {
      id: true,
      position: true,
      interest: true,
      status: true,
      currentScriptId: true,
      member: { select: { displayName: true, age: true } },
    },
  });
  return interviews.map(({ currentScriptId, ...i }) => ({ ...i, hasScript: currentScriptId !== null }));
};

/** Datos para el aviso "Evaluation saved" (solo si la entrevista es de esta expert). */
export const getSavedNotice = async (interviewId: string) => {
  const user = await requireRole("EXPERT");
  return prisma.interview.findFirst({
    where: { id: interviewId, assignment: { expertId: user.id }, evaluation: { isNot: null } },
    select: { position: true, member: { select: { displayName: true } } },
  });
};

/**
 * Una entrevista asignada a la expert actual, con el script vigente procesado.
 * 404 si no existe, no es suya o no tiene script. Memorizada por petición (layout + página).
 */
export const getMyInterview = cache(async (interviewId: string) => {
  const user = await requireRole("EXPERT");
  const interview = await prisma.interview.findFirst({
    where: { id: interviewId, assignment: { expertId: user.id } },
    select: {
      id: true,
      position: true,
      interest: true,
      status: true,
      member: { select: { displayName: true, age: true } },
      currentScript: { select: { id: true, version: true, processed: true } },
    },
  });
  if (!interview?.currentScript) notFound();

  const { currentScript, ...rest } = interview;
  return {
    ...rest,
    scriptId: currentScript.id,
    scriptVersion: currentScript.version,
    script: currentScript.processed as unknown as ProcessedScript,
  };
});

/** La evaluación guardada de una entrevista de la expert actual, si existe. */
export const getMyEvaluation = async (interviewId: string) => {
  const user = await requireRole("EXPERT");
  return prisma.evaluation.findFirst({
    where: { interviewId, interview: { assignment: { expertId: user.id } } },
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
      savedAt: true,
      updatedAt: true,
      mistakes: { orderBy: { position: "asc" }, select: { heSaid: true, better: true } },
      _count: { select: { revisions: true } },
    },
  });
};
