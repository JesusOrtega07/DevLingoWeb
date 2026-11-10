// Reglas del límite de intentos de login. Funciones puras para poder probarlas.

export const RATE_LIMIT = {
  /** Ventana en la que se cuentan los fallos. */
  windowMs: 15 * 60 * 1000,
  /** Fallos permitidos para un mismo email desde una misma IP. */
  maxFailuresPerKey: 5,
  /** Fallos permitidos desde una misma IP, sin importar el email. */
  maxFailuresPerIp: 20,
  /** Fallos seguidos en una cuenta antes de bloquearla. */
  maxFailuresPerAccount: 5,
  /** Duración del bloqueo temporal de la cuenta. */
  lockMs: 15 * 60 * 1000,
} as const;

/**
 * failuresForIp es null cuando no se conoce la IP real: si se contara, todos los visitantes
 * compartirían un solo contador y 20 fallos de cualquiera bloquearían el login de todos.
 */
export const isThrottled = (failuresForKey: number, failuresForIp: number | null) =>
  failuresForKey >= RATE_LIMIT.maxFailuresPerKey ||
  (failuresForIp !== null && failuresForIp >= RATE_LIMIT.maxFailuresPerIp);

export const isLocked = (lockedUntil: Date | null, now: Date) => lockedUntil !== null && lockedUntil > now;

/** Qué hacer con la cuenta tras un fallo de contraseña. */
export const nextFailureState = (failedLogins: number, now: Date) => {
  const failures = failedLogins + 1;
  if (failures >= RATE_LIMIT.maxFailuresPerAccount) {
    return { failedLogins: 0, lockedUntil: new Date(now.getTime() + RATE_LIMIT.lockMs) };
  }
  return { failedLogins: failures, lockedUntil: null };
};

export const attemptKey = (email: string, ip: string) => `${email}|${ip}`;
