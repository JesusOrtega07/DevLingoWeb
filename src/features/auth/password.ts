import "server-only";

import { hash, verify } from "@node-rs/argon2";

// argon2id con los parámetros por defecto de la librería (m=19 MiB, t=2, p=1),
// que coinciden con la recomendación mínima de OWASP.

export const hashPassword = (password: string) => hash(password);

export const verifyPassword = async (passwordHash: string, password: string) => {
  try {
    return await verify(passwordHash, password);
  } catch {
    return false;
  }
};

// Hash de relleno: cuando el email no existe se verifica igual contra él,
// para que el tiempo de respuesta no revele qué cuentas existen.
let dummyHash: Promise<string> | undefined;
export const verifyAgainstDummy = async (password: string) => {
  dummyHash ??= hash("devlingo-dummy-password-for-timing");
  await verifyPassword(await dummyHash, password);
  return false;
};
