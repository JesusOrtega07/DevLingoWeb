import { createHash, randomBytes, timingSafeEqual } from "node:crypto";

// Tokens opacos para sesiones e invitaciones. En la BD solo se guarda su sha256:
// si alguien lee la base, no puede usar los tokens.

/** 32 bytes aleatorios en base64url (43 caracteres, seguros en URL y cookies). */
export const generateToken = () => randomBytes(32).toString("base64url");

export const hashToken = (token: string) => createHash("sha256").update(token, "utf8").digest("hex");

/** Comparación en tiempo constante de dos hashes hex. */
export const safeEqualHex = (a: string, b: string) => {
  const ba = Buffer.from(a, "hex");
  const bb = Buffer.from(b, "hex");
  return ba.length === bb.length && timingSafeEqual(ba, bb);
};

/** Formato válido de un token emitido por generateToken (evita consultas con basura). */
export const isWellFormedToken = (token: string) => /^[A-Za-z0-9_-]{43}$/.test(token);
