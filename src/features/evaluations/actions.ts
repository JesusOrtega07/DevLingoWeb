"use server";

import { redirect } from "next/navigation";

import { evaluationFromFormData, evaluationSchema } from "@/features/evaluations/schemas";
import { Prisma } from "@/generated/prisma/client";
import { requireRole } from "@/lib/dal";
import { prisma } from "@/lib/prisma";

export type EvaluationFormState = {
  error?: string;
  fieldErrors?: Record<string, string[] | undefined>;
};

/**
 * Guarda (o actualiza) la evaluación de una entrevista asignada a la expert actual.
 * - Si ya existía, guarda una copia de la versión anterior en EvaluationRevision.
 * - Reemplaza las filas de "Mistakes heard".
 * - Pasa la entrevista a INTERVIEWED.
 */
export const saveEvaluation = async (
  _prev: EvaluationFormState,
  formData: FormData,
): Promise<EvaluationFormState> => {
  const user = await requireRole("EXPERT");
  const parsed = evaluationSchema.safeParse(evaluationFromFormData(formData));
  if (!parsed.success) {
    return { error: "Some fields need your attention.", fieldErrors: parsed.error.flatten().fieldErrors };
  }
  const { interviewId, mistakes, ...fields } = parsed.data;

  // Autorización: solo si la entrevista está asignada a esta expert y tiene script.
  const interview = await prisma.interview.findFirst({
    where: { id: interviewId, assignment: { expertId: user.id } },
    select: { id: true, currentScriptId: true },
  });
  if (!interview?.currentScriptId) return { error: "You can't evaluate this interview." };

  try {
    await prisma.$transaction(async (tx) => {
      const existing = await tx.evaluation.findUnique({
        where: { interviewId },
        select: {
          id: true,
          fluency: true,
          grammar: true,
          vocabulary: true,
          pronunciation: true,
          confidence: true,
          strength: true,
          improve1: true,
          improve2: true,
          nextRound: true,
          scriptId: true,
          expertId: true,
          updatedAt: true,
          mistakes: { orderBy: { position: "asc" }, select: { heSaid: true, better: true } },
        },
      });

      const rows = mistakes.map((m, position) => ({ ...m, position }));

      if (existing) {
        const { id, updatedAt, ...previous } = existing;
        await tx.evaluationRevision.create({
          data: {
            evaluationId: id,
            editedById: user.id,
            snapshot: { ...previous, updatedAt: updatedAt.toISOString() },
          },
        });
        await tx.evaluationMistake.deleteMany({ where: { evaluationId: id } });
        await tx.evaluation.update({
          where: { id },
          data: {
            ...fields,
            scriptId: interview.currentScriptId,
            updatedById: user.id,
            mistakes: { create: rows },
          },
        });
      } else {
        await tx.evaluation.create({
          data: {
            ...fields,
            interviewId,
            expertId: user.id,
            scriptId: interview.currentScriptId,
            updatedById: user.id,
            mistakes: { create: rows },
          },
        });
      }

      await tx.interview.update({ where: { id: interviewId }, data: { status: "INTERVIEWED" } });
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return { error: "This evaluation was just saved from another window. Reload the page and try again." };
    }
    throw error;
  }

  redirect(`/activities/interviews?saved=${interviewId}`);
};
