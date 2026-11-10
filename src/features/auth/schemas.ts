import { z } from "zod";

export const emailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .max(254)
  .pipe(z.email({ error: "Enter a valid email." }));

export const loginSchema = z.object({
  email: emailSchema,
  // En el login no se aplica la política: solo se limita el tamaño para no hashear megabytes.
  password: z.string().min(1, { error: "Enter your password." }).max(128),
});

/**
 * ¿La contraseña contiene la parte del email antes de la @? Con nombres de 1-2 letras ("a@...")
 * se ignora: casi cualquier contraseña los contendría.
 */
export const containsEmailName = (password: string, email: string) => {
  const name = email.split("@")[0].toLowerCase();
  return name.length >= 3 && password.toLowerCase().includes(name);
};

export const PASSWORD_MIN = 12;
export const PASSWORD_MAX = 128;

export const newPasswordSchema = z
  .object({
    token: z.string().regex(/^[A-Za-z0-9_-]{43}$/),
    password: z
      .string()
      .min(PASSWORD_MIN, { error: `Use at least ${PASSWORD_MIN} characters.` })
      .max(PASSWORD_MAX, { error: `Use at most ${PASSWORD_MAX} characters.` }),
    confirm: z.string(),
  })
  .refine((v) => v.password === v.confirm, { path: ["confirm"], error: "Passwords don't match." });
