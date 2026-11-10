import { describe, expect, it } from "vitest";

import {
  assignExpertSchema,
  createInterviewSchema,
  createUserSchema,
  idSchema,
  setActiveSchema,
} from "@/features/admin/schemas";

const id = "cmhs1x2y30000abcdefghijkl";

describe("idSchema", () => {
  it("acepta cuids y rechaza cualquier otra cosa", () => {
    expect(idSchema.safeParse(id).success).toBe(true);
    expect(idSchema.safeParse("1 OR 1=1").success).toBe(false);
    expect(idSchema.safeParse("../etc").success).toBe(false);
    expect(idSchema.safeParse("").success).toBe(false);
  });
});

describe("createUserSchema", () => {
  const base = { name: "Ana", email: "ANA@Example.com ", role: "MEMBER", age: "", interest: "" };

  it("normaliza email y convierte campos vacíos en null", () => {
    const r = createUserSchema.parse(base);
    expect(r).toEqual({ name: "Ana", email: "ana@example.com", role: "MEMBER", age: null, interest: null });
  });

  it("valida la edad", () => {
    expect(createUserSchema.parse({ ...base, age: "21" }).age).toBe(21);
    expect(createUserSchema.safeParse({ ...base, age: "9" }).success).toBe(false);
    expect(createUserSchema.safeParse({ ...base, age: "21.5" }).success).toBe(false);
    expect(createUserSchema.safeParse({ ...base, age: "abc" }).success).toBe(false);
  });

  it("solo acepta roles conocidos", () => {
    expect(createUserSchema.safeParse({ ...base, role: "ROOT" }).success).toBe(false);
  });

  it("limita la longitud de los textos", () => {
    expect(createUserSchema.safeParse({ ...base, name: "x".repeat(81) }).success).toBe(false);
    expect(createUserSchema.safeParse({ ...base, name: "   " }).success).toBe(false);
  });
});

describe("otros esquemas", () => {
  it("setActive solo acepta true/false", () => {
    expect(setActiveSchema.parse({ userId: id, active: "false" }).active).toBe(false);
    expect(setActiveSchema.safeParse({ userId: id, active: "yes" }).success).toBe(false);
  });

  it("assignExpert permite quitar la asignación con cadena vacía", () => {
    expect(assignExpertSchema.parse({ interviewId: id, expertId: "" }).expertId).toBe("");
    expect(assignExpertSchema.safeParse({ interviewId: id, expertId: "nope" }).success).toBe(false);
  });

  it("createInterview exige puesto e interés", () => {
    expect(createInterviewSchema.safeParse({ memberId: id, position: "", interest: "QA" }).success).toBe(false);
    expect(createInterviewSchema.parse({ memberId: id, position: " QA Tester ", interest: "QA" }).position).toBe(
      "QA Tester",
    );
  });
});
