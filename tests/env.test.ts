import { describe, expect, it, vi } from "vitest";

vi.stubEnv("DATABASE_URL", "postgresql://u:p@localhost:5432/devlingo");
vi.stubEnv("APP_URL", "http://localhost:3000");

const { parseEnv } = await import("@/lib/env");

describe("parseEnv", () => {
  it("acepta una configuración válida", () => {
    const env = parseEnv({
      DATABASE_URL: "postgresql://u:p@localhost:5432/devlingo",
      APP_URL: "https://devlingo.example.com",
    });
    expect(env.NODE_ENV).toBe("development");
  });

  it("rechaza una URL que no es de PostgreSQL sin filtrar su valor", () => {
    const secret = "mysql://root:supersecreto@host/db";
    expect(() => parseEnv({ DATABASE_URL: secret, APP_URL: "http://x.test" })).toThrow(/DATABASE_URL/);
    try {
      parseEnv({ DATABASE_URL: secret, APP_URL: "http://x.test" });
    } catch (e) {
      expect(String(e)).not.toContain("supersecreto");
    }
  });
});
