import { describe, expect, it } from "vitest";

import { getClientIp } from "@/features/auth/client-ip";
import { RATE_LIMIT, isLocked, isThrottled, nextFailureState } from "@/features/auth/rate-limit-policy";
import { containsEmailName, loginSchema, newPasswordSchema } from "@/features/auth/schemas";

describe("rate limit", () => {
  it("bloquea a los 5 fallos por email+IP o 20 por IP", () => {
    expect(isThrottled(4, 0)).toBe(false);
    expect(isThrottled(5, 0)).toBe(true);
    expect(isThrottled(0, 19)).toBe(false);
    expect(isThrottled(0, 20)).toBe(true);
  });

  it("sin IP real no limita por IP (sería un contador compartido por todos)", () => {
    expect(isThrottled(0, null)).toBe(false);
    expect(isThrottled(5, null)).toBe(true);
  });

  it("bloquea la cuenta 15 minutos al quinto fallo seguido y reinicia el contador", () => {
    const now = new Date("2026-11-10T10:00:00Z");
    expect(nextFailureState(3, now)).toEqual({ failedLogins: 4, lockedUntil: null });
    const locked = nextFailureState(4, now);
    expect(locked.failedLogins).toBe(0);
    expect(locked.lockedUntil?.getTime()).toBe(now.getTime() + RATE_LIMIT.lockMs);
  });

  it("el bloqueo vence con el tiempo", () => {
    const now = new Date("2026-11-10T10:00:00Z");
    expect(isLocked(null, now)).toBe(false);
    expect(isLocked(new Date("2026-11-10T10:05:00Z"), now)).toBe(true);
    expect(isLocked(new Date("2026-11-10T09:59:00Z"), now)).toBe(false);
  });
});

describe("getClientIp", () => {
  const h = new Headers({ "cf-connecting-ip": "203.0.113.7", "x-forwarded-for": "1.2.3.4" });

  it("sin proxy de confianza ignora todos los headers (no se pueden falsificar)", () => {
    expect(getClientIp(h, undefined)).toBe("local");
  });

  it("con Cloudflare usa cf-connecting-ip", () => {
    expect(getClientIp(h, "cf-connecting-ip")).toBe("203.0.113.7");
  });

  it("con x-forwarded-for usa solo la última entrada (la que añade el proxy)", () => {
    const spoofed = new Headers({ "x-forwarded-for": "9.9.9.9, 198.51.100.4" });
    expect(getClientIp(spoofed, "x-forwarded-for")).toBe("198.51.100.4");
    expect(getClientIp(new Headers({ "x-forwarded-for": "198.51.100.4" }), "x-forwarded-for")).toBe("198.51.100.4");
    expect(getClientIp(new Headers(), "x-forwarded-for")).toBe("local");
  });

  it("descarta valores que no parecen IP", () => {
    expect(getClientIp(new Headers({ "cf-connecting-ip": "<script>" }), "cf-connecting-ip")).toBe("local");
  });
});

describe("schemas", () => {
  it("normaliza el email a minúsculas y sin espacios", () => {
    const r = loginSchema.parse({ email: "  Lili@DevLingo.TEST ", password: "x" });
    expect(r.email).toBe("lili@devlingo.test");
  });

  it("limita el tamaño de la contraseña en el login", () => {
    expect(loginSchema.safeParse({ email: "a@b.co", password: "x".repeat(129) }).success).toBe(false);
  });

  const token = "a".repeat(43);

  it("exige 12+ caracteres y que coincida la confirmación", () => {
    expect(newPasswordSchema.safeParse({ token, password: "short", confirm: "short" }).success).toBe(false);
    expect(
      newPasswordSchema.safeParse({ token, password: "a long passphrase", confirm: "another one!!" }).success,
    ).toBe(false);
    expect(
      newPasswordSchema.safeParse({ token, password: "a long passphrase", confirm: "a long passphrase" }).success,
    ).toBe(true);
  });

  it("rechaza tokens con formato inválido", () => {
    expect(
      newPasswordSchema.safeParse({ token: "../x", password: "a long passphrase", confirm: "a long passphrase" })
        .success,
    ).toBe(false);
  });
});

describe("containsEmailName", () => {
  it("rechaza contraseñas que contienen el nombre del email", () => {
    expect(containsEmailName("my-Lili.Garcia-2026", "lili.garcia@unach.mx")).toBe(true);
    expect(containsEmailName("correct horse battery", "lili.garcia@unach.mx")).toBe(false);
  });

  it("ignora nombres de 1 o 2 letras", () => {
    expect(containsEmailName("a long passphrase here", "a@unach.mx")).toBe(false);
    expect(containsEmailName("joke about jo", "jo@unach.mx")).toBe(false);
  });
});
