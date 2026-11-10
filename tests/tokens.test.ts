import { describe, expect, it } from "vitest";

import { generateToken, hashToken, isWellFormedToken, safeEqualHex } from "@/lib/security/tokens";

describe("tokens", () => {
  it("genera tokens únicos y bien formados", () => {
    const a = generateToken();
    const b = generateToken();
    expect(a).not.toBe(b);
    expect(isWellFormedToken(a)).toBe(true);
  });

  it("el hash es determinista y no contiene el token", () => {
    const t = generateToken();
    expect(hashToken(t)).toBe(hashToken(t));
    expect(hashToken(t)).toMatch(/^[0-9a-f]{64}$/);
    expect(hashToken(t)).not.toContain(t);
  });

  it("compara hashes en tiempo constante", () => {
    const h = hashToken("x");
    expect(safeEqualHex(h, hashToken("x"))).toBe(true);
    expect(safeEqualHex(h, hashToken("y"))).toBe(false);
    expect(safeEqualHex(h, "abcd")).toBe(false);
  });

  it("rechaza tokens mal formados", () => {
    expect(isWellFormedToken("../../etc/passwd")).toBe(false);
    expect(isWellFormedToken("")).toBe(false);
  });
});
