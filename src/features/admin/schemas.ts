import { z } from "zod";

import { emailSchema } from "@/features/auth/schemas";

/** IDs generados por Prisma (cuid). */
export const idSchema = z.string().regex(/^[a-z0-9]{20,40}$/, { error: "Invalid id." });

const text = (max: number, label: string) =>
  z
    .string()
    .trim()
    .min(1, { error: `${label} is required.` })
    .max(max, { error: `${label} must be at most ${max} characters.` });

/** Campo opcional de texto: "" se convierte en null. */
const optionalText = (max: number, label: string) =>
  z
    .string()
    .trim()
    .max(max, { error: `${label} must be at most ${max} characters.` })
    .transform((v) => (v.length ? v : null));

/** Edad opcional: "" → null; si viene, entero entre 10 y 99. */
const optionalAge = z
  .string()
  .trim()
  .transform((v, ctx) => {
    if (!v) return null;
    const n = Number(v);
    if (!Number.isInteger(n) || n < 10 || n > 99) {
      ctx.addIssue({ code: "custom", message: "Age must be a whole number between 10 and 99." });
      return z.NEVER;
    }
    return n;
  });

export const ROLES = ["ADMIN", "EXPERT", "MEMBER"] as const;

export const createUserSchema = z.object({
  name: text(80, "Name"),
  email: emailSchema,
  role: z.enum(ROLES, { error: "Choose a role." }),
  age: optionalAge,
  interest: optionalText(80, "Interest"),
});

export const updateUserSchema = z.object({
  userId: idSchema,
  name: text(80, "Name"),
  age: optionalAge,
  interest: optionalText(80, "Interest"),
});

export const userIdSchema = z.object({ userId: idSchema });

export const setActiveSchema = z.object({
  userId: idSchema,
  active: z.enum(["true", "false"]).transform((v) => v === "true"),
});

export const createInterviewSchema = z.object({
  memberId: idSchema,
  position: text(120, "Position"),
  interest: text(80, "Interest"),
});

export const assignExpertSchema = z.object({
  interviewId: idSchema,
  /** "" quita la asignación. */
  expertId: z.union([idSchema, z.literal("")]),
});

export const interviewIdSchema = z.object({ interviewId: idSchema });
