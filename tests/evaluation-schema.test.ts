import { describe, expect, it } from "vitest";

import { evaluationFromFormData, evaluationSchema } from "@/features/evaluations/schemas";

const id = "cmhs1x2y30000abcdefghijkl";

const form = (overrides: Record<string, string | string[]> = {}) => {
  const fd = new FormData();
  const values: Record<string, string | string[]> = {
    interviewId: id,
    fluency: "Smooth.",
    grammar: "Good past simple.",
    vocabulary: "Uses data terms.",
    pronunciation: "Clear.",
    confidence: "Calm.",
    strength: "Clear examples.",
    improve1: "Present perfect.",
    improve2: "Fewer fillers.",
    nextRound: "YES",
    heSaid: ["I have 6 months working with data", "", ""],
    better: ["I've been working with data for 6 months", "", ""],
    ...overrides,
  };
  for (const [k, v] of Object.entries(values)) {
    for (const item of Array.isArray(v) ? v : [v]) fd.append(k, item);
  }
  return evaluationFromFormData(fd);
};

describe("evaluationSchema", () => {
  it("acepta una evaluación completa y descarta filas vacías", () => {
    const r = evaluationSchema.parse(form());
    expect(r.mistakes).toEqual([
      { heSaid: "I have 6 months working with data", better: "I've been working with data for 6 months" },
    ]);
    expect(r.nextRound).toBe("YES");
  });

  it("exige las cinco áreas, fortaleza, las dos mejoras y Next round", () => {
    const r = evaluationSchema.safeParse(form({ grammar: "  ", improve2: "", nextRound: "" }));
    expect(r.success).toBe(false);
    if (!r.success) {
      const fields = Object.keys(r.error.flatten().fieldErrors);
      expect(fields).toEqual(expect.arrayContaining(["grammar", "improve2", "nextRound"]));
    }
  });

  it("solo acepta Yes, Maybe o No", () => {
    expect(evaluationSchema.safeParse(form({ nextRound: "PERHAPS" })).success).toBe(false);
  });

  it("cada error necesita ambas columnas", () => {
    const r = evaluationSchema.safeParse(form({ heSaid: ["He go"], better: [""] }));
    expect(r.success).toBe(false);
    if (!r.success) expect(r.error.flatten().fieldErrors.mistakes?.[0]).toMatch(/both/);
  });

  it("limita los tamaños", () => {
    expect(evaluationSchema.safeParse(form({ fluency: "x".repeat(4001) })).success).toBe(false);
    const many = Array.from({ length: 31 }, (_, i) => `row ${i}`);
    expect(evaluationSchema.safeParse(form({ heSaid: many, better: many })).success).toBe(false);
  });

  it("rechaza un id de entrevista inválido", () => {
    expect(evaluationSchema.safeParse(form({ interviewId: "1 OR 1=1" })).success).toBe(false);
  });
});
