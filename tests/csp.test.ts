import { describe, expect, it } from "vitest";

import { buildCsp } from "@/lib/security/csp";

describe("buildCsp", () => {
  it("en producción solo permite scripts con nonce y sin eval", () => {
    const csp = buildCsp("abc123", false);
    expect(csp).toContain("script-src 'self' 'nonce-abc123' 'strict-dynamic'");
    expect(csp).not.toContain("unsafe-eval");
    expect(csp).toContain("frame-ancestors 'none'");
    expect(csp).toContain("object-src 'none'");
    expect(csp).toContain("upgrade-insecure-requests");
  });

  it("en desarrollo agrega unsafe-eval (lo requiere React para depurar)", () => {
    expect(buildCsp("n", true)).toContain("'unsafe-eval'");
  });
});
