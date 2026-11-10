import { readFileSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

import {
  curlyQuotes,
  durationLabel,
  parseJob,
  plainText,
  splitCandidate,
  splitRole,
  splitRule,
  stripWrappingQuotes,
} from "@/features/interviews/context-view";
import { parseInterviewScript } from "@/features/scripts/parser";
import type { Inline } from "@/features/scripts/types";

const md = readFileSync(path.resolve(__dirname, "../scripts/jesus-junior-data-analyst.md"), "utf8");
const parsed = parseInterviewScript(md);
if (!parsed.ok) throw new Error("el script de Jesús debería procesarse");
const { context, script } = parsed.data;

describe("Context de Jesús como en el mockup 04", () => {
  it("separa chips, empresa, descripción, habilidades y requisitos del puesto", () => {
    const job = parseJob(context.job);
    expect(job?.chips).toEqual(["Remote", "US", "$85,000/year", "7Seventy Recruiting"]);
    expect(job?.company).toBe("7Seventy Recruiting");
    expect(job?.description).toMatch(/^Posted by 7Seventy Recruiting for a nonprofit/);
    expect(job?.description).toMatch(/explains results to state partners\.$/);
    expect(job?.skills).toEqual(["SQL", "Python (Pandas)", "Careful checking of data", "Clear communication"]);
    expect(job?.requires).toBe("6 months of experience with real data.");
  });

  it("separa el nombre del candidato y el encabezado del rol", () => {
    expect(splitCandidate(context.candidate, "Jesús")).toEqual({
      heading: "Jesús",
      body: "A 9th-semester software engineering student in Mexico. He knows Python and SQL, builds apps, and is taking the IBM Data Science Certificate. He has read the job post.",
    });
    const role = splitRole(context.role);
    expect(role.heading).toBe("Lili, recruiter at 7Seventy Recruiting");
    expect(role.body).toMatch(/^You are not technical/);
  });

  it("separa la etiqueta de cada regla", () => {
    const labels = context.rules.map((r) => splitRule(r).label);
    expect(labels).toEqual(["English only", "Silence", "Vague answer", "Jargon", "Answer over 90 seconds"]);
    expect(plainText(splitRule(context.rules[1]).body)).toBe("Wait 5 seconds, then rephrase the question.");
    const vague = splitRule(context.rules[2]).body;
    expect(vague.some((n) => n.type === "emphasis")).toBe(true);
  });

  it("calcula la duración y limpia las comillas de las preguntas", () => {
    expect(durationLabel(script.closing.seconds)).toBe("10 min");
    expect(stripWrappingQuotes(plainText(script.steps[0].question))).toBe("Tell me about yourself.");
    expect(curlyQuotes('If he says "hi"')).toBe("If he says “hi”");
  });
});

describe("textos que no siguen el patrón", () => {
  const text = (value: string): Inline[] => [{ type: "text", value }];

  it("el puesto sin paréntesis se muestra completo", () => {
    const job = parseJob(text("A QA role at a startup. Tests web apps."));
    expect(job?.chips).toEqual([]);
    expect(job?.description).toBe("A QA role at a startup. Tests web apps.");
  });

  it("el candidato sin coma usa el nombre del integrante", () => {
    expect(splitCandidate(text("Software student who likes data."), "Ana")).toEqual({
      heading: "Ana",
      body: "Software student who likes data.",
    });
  });

  it("una regla sin etiqueta se muestra entera", () => {
    expect(splitRule(text("Be kind")).label).toBeNull();
  });

  it("sin contenido devuelve null", () => {
    expect(parseJob(null)).toBeNull();
    expect(splitRole(null)).toEqual({ heading: null, body: null });
  });
});
