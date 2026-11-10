"use server";

import { createHash } from "node:crypto";

import { refresh } from "next/cache";

import { interviewIdSchema } from "@/features/admin/schemas";
import { MAX_SCRIPT_BYTES, readMarkdownFile } from "@/features/scripts/file";
import { parseInterviewScript } from "@/features/scripts/parser";
import type { Issue, ProcessedScript } from "@/features/scripts/types";
import { Prisma } from "@/generated/prisma/client";
import { requireRole } from "@/lib/dal";
import { prisma } from "@/lib/prisma";

// Subida de scripts en dos pasos:
//  1. previewScript: valida y procesa, NO guarda. El admin ve la vista previa, errores y avisos.
//  2. saveScript: el navegador reenvía el mismo archivo; el servidor lo valida y procesa
//     otra vez (no confía en lo que devolvió el paso 1) y crea una versión nueva.

export type ScriptUploadState = {
  status: "idle" | "error" | "preview" | "saved";
  fileName?: string;
  /** Error que impide siquiera leer el archivo (extensión, tamaño, codificación). */
  error?: string;
  errors?: Issue[];
  warnings?: Issue[];
  data?: ProcessedScript | null;
  version?: number;
};

const plain = (s: string) =>
  s
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();

const processUpload = async (formData: FormData) => {
  const parsedId = interviewIdSchema.safeParse({ interviewId: String(formData.get("interviewId") ?? "") });
  if (!parsedId.success) return { error: "Invalid request." } as const;

  const interview = await prisma.interview.findUnique({
    where: { id: parsedId.data.interviewId },
    select: { id: true, position: true, member: { select: { displayName: true } } },
  });
  if (!interview) return { error: "Interview not found." } as const;

  const file = formData.get("file");
  if (!(file instanceof File)) return { error: "Choose a .md file." } as const;
  if (file.size > MAX_SCRIPT_BYTES) return { error: "The file is larger than 1 MB.", fileName: file.name } as const;

  const bytes = new Uint8Array(await file.arrayBuffer());
  const read = readMarkdownFile(file.name, bytes);
  if (!read.ok) return { error: read.error, fileName: file.name } as const;

  const result = parseInterviewScript(read.text);
  const warnings = [...result.warnings];

  if (result.ok) {
    const { member, interview: position } = result.data.meta;
    if (plain(member) !== plain(interview.member.displayName)) {
      warnings.unshift({
        message: `The file is for "${member}", but this interview is for ${interview.member.displayName}.`,
        line: 2,
      });
    }
    if (plain(position) !== plain(interview.position)) {
      warnings.unshift({
        message: `The file is for the position "${position}", but this interview is "${interview.position}".`,
        line: 3,
      });
    }
  }

  return { interview, fileName: file.name.trim(), bytes, text: read.text, result, warnings } as const;
};

export const previewScript = async (_prev: ScriptUploadState, formData: FormData): Promise<ScriptUploadState> => {
  await requireRole("ADMIN");
  const upload = await processUpload(formData);
  if ("error" in upload) return { status: "error", error: upload.error, fileName: upload.fileName };

  const { result, warnings, fileName } = upload;
  return {
    status: "preview",
    fileName,
    errors: result.ok ? [] : result.errors,
    warnings,
    data: result.ok ? result.data : null,
  };
};

export const saveScript = async (_prev: ScriptUploadState, formData: FormData): Promise<ScriptUploadState> => {
  const admin = await requireRole("ADMIN");
  const upload = await processUpload(formData);
  if ("error" in upload) return { status: "error", error: upload.error, fileName: upload.fileName };

  const { interview, result, warnings, fileName, bytes, text } = upload;
  if (!result.ok) {
    return { status: "preview", fileName, errors: result.errors, warnings, data: null };
  }

  try {
    const version = await prisma.$transaction(async (tx) => {
      const last = await tx.interviewScript.aggregate({ where: { interviewId: interview.id }, _max: { version: true } });
      const next = (last._max.version ?? 0) + 1;
      const script = await tx.interviewScript.create({
        data: {
          interviewId: interview.id,
          version: next,
          fileName,
          originalMd: text,
          processed: result.data,
          sha256: createHash("sha256").update(bytes).digest("hex"),
          uploadedById: admin.id,
        },
        select: { id: true },
      });
      await tx.interview.update({ where: { id: interview.id }, data: { currentScriptId: script.id } });
      return next;
    });
    refresh();
    return { status: "saved", fileName, version, warnings };
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return { status: "error", error: "Someone else uploaded a version at the same time. Try again.", fileName };
    }
    throw error;
  }
};

/** Punto de entrada único del formulario: "preview" (por defecto) o "save". */
export const handleScriptUpload = async (prev: ScriptUploadState, formData: FormData): Promise<ScriptUploadState> =>
  formData.get("intent") === "save" ? saveScript(prev, formData) : previewScript(prev, formData);
