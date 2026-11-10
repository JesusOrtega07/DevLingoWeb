import { z } from "zod";

import { idSchema } from "@/features/admin/schemas";

export const AREA_FIELDS = ["fluency", "grammar", "vocabulary", "pronunciation", "confidence"] as const;
export type AreaField = (typeof AREA_FIELDS)[number];

export const MAX_MISTAKES = 30;
/** Filas enviadas, incluidas las vacías: un tope para que nadie mande miles de campos. */
const MAX_MISTAKE_ROWS = MAX_MISTAKES * 2;

const required = (max: number, message: string) =>
  z
    .string()
    .trim()
    .min(1, { error: message })
    .max(max, { error: `Use at most ${max} characters.` });

const area = required(4000, "Write a short analysis for this area.");

export const evaluationSchema = z
  .object({
    interviewId: idSchema,
    fluency: area,
    grammar: area,
    vocabulary: area,
    pronunciation: area,
    confidence: area,
    strength: required(2000, "Write the strongest point."),
    improve1: required(300, "Write the first thing to improve."),
    improve2: required(300, "Write the second thing to improve."),
    nextRound: z.enum(["YES", "MAYBE", "NO"], { error: "Choose Yes, Maybe or No." }),
    heSaid: z
      .array(z.string().trim().max(300, { error: "Use at most 300 characters." }))
      .max(MAX_MISTAKE_ROWS, { error: `Add at most ${MAX_MISTAKES} mistakes.` }),
    better: z
      .array(z.string().trim().max(300, { error: "Use at most 300 characters." }))
      .max(MAX_MISTAKE_ROWS, { error: `Add at most ${MAX_MISTAKES} mistakes.` }),
  })
  .superRefine((v, ctx) => {
    if (v.heSaid.length !== v.better.length) {
      ctx.addIssue({ code: "custom", path: ["mistakes"], message: "Invalid mistakes table." });
      return;
    }
    const filled = v.heSaid.filter((h, i) => h || v.better[i]).length;
    if (filled > MAX_MISTAKES) {
      ctx.addIssue({ code: "custom", path: ["mistakes"], message: `Add at most ${MAX_MISTAKES} mistakes.` });
    }
    v.heSaid.forEach((h, i) => {
      if (Boolean(h) !== Boolean(v.better[i])) {
        ctx.addIssue({
          code: "custom",
          path: ["mistakes"],
          message: "Each mistake needs both “He said” and “Better”.",
        });
      }
    });
  })
  .transform(({ heSaid, better, ...rest }) => ({
    ...rest,
    // Las filas vacías se descartan.
    mistakes: heSaid
      .map((h, i) => ({ heSaid: h, better: better[i] }))
      .filter((m) => m.heSaid && m.better),
  }));

export type EvaluationInput = z.infer<typeof evaluationSchema>;

/** Convierte el FormData del formulario al objeto que valida el esquema. */
export const evaluationFromFormData = (formData: FormData) => ({
  interviewId: String(formData.get("interviewId") ?? ""),
  ...Object.fromEntries(
    [...AREA_FIELDS, "strength", "improve1", "improve2", "nextRound"].map((k) => [k, String(formData.get(k) ?? "")]),
  ),
  heSaid: formData.getAll("heSaid").map(String),
  better: formData.getAll("better").map(String),
});
