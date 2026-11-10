"use server";

import { refresh } from "next/cache";
import { redirect } from "next/navigation";

import type { ActionState } from "@/features/admin/action-state";
import { assignExpertSchema, createInterviewSchema } from "@/features/admin/schemas";
import { requireRole } from "@/lib/dal";
import { prisma } from "@/lib/prisma";

const fields = (formData: FormData, names: string[]) =>
  Object.fromEntries(names.map((n) => [n, String(formData.get(n) ?? "")]));

export const createInterview = async (_prev: ActionState, formData: FormData): Promise<ActionState> => {
  await requireRole("ADMIN");
  const parsed = createInterviewSchema.safeParse(fields(formData, ["memberId", "position", "interest"]));
  if (!parsed.success) return { fieldErrors: parsed.error.flatten().fieldErrors };
  const { memberId, position, interest } = parsed.data;

  const member = await prisma.member.findFirst({ where: { id: memberId, user: { isActive: true } }, select: { id: true } });
  if (!member) return { fieldErrors: { memberId: ["Choose an active member."] } };

  const interview = await prisma.interview.create({ data: { memberId, position, interest }, select: { id: true } });
  redirect(`/admin/interviews/${interview.id}`);
};

export const assignExpert = async (_prev: ActionState, formData: FormData): Promise<ActionState> => {
  const admin = await requireRole("ADMIN");
  const parsed = assignExpertSchema.safeParse(fields(formData, ["interviewId", "expertId"]));
  if (!parsed.success) return { error: "Invalid request." };
  const { interviewId, expertId } = parsed.data;

  const interview = await prisma.interview.count({ where: { id: interviewId } });
  if (!interview) return { error: "Interview not found." };

  if (expertId === "") {
    await prisma.assignment.deleteMany({ where: { interviewId } });
    refresh();
    return { ok: true, message: "Assignment removed." };
  }

  const expert = await prisma.user.findFirst({
    where: { id: expertId, role: "EXPERT", isActive: true },
    select: { name: true },
  });
  if (!expert) return { fieldErrors: { expertId: ["Choose an active English Expert."] } };

  await prisma.assignment.upsert({
    where: { interviewId },
    create: { interviewId, expertId, assignedById: admin.id },
    update: { expertId, assignedById: admin.id, assignedAt: new Date() },
  });
  refresh();
  return { ok: true, message: `Assigned to ${expert.name}.` };
};
