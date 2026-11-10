import { readFileSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

import { MAX_SCRIPT_BYTES, readMarkdownFile } from "@/features/scripts/file";
import { parseInterviewScript } from "@/features/scripts/parser";
import type { Inline, ParseResult } from "@/features/scripts/types";

const root = path.resolve(__dirname, "..");
const jesus = readFileSync(path.join(root, "scripts/jesus-junior-data-analyst.md"), "utf8").replace(/\r\n?/g, "\n");
const template = readFileSync(path.join(root, "templates/interview-template.md"), "utf8").replace(/\r\n?/g, "\n");

const errorsOf = (r: ParseResult) => (r.ok ? [] : r.errors.map((e) => e.message));
const warningsOf = (r: ParseResult) => r.warnings.map((w) => w.message);
const textOf = (nodes: Inline[]): string =>
  nodes
    .map((n) => ("value" in n ? n.value : "children" in n ? textOf(n.children) : "\n"))
    .join("");

describe("script real de Jesús", () => {
  const result = parseInterviewScript(jesus);

  it("se procesa sin errores ni avisos", () => {
    expect(errorsOf(result)).toEqual([]);
    expect(warningsOf(result)).toEqual([]);
    expect(result.ok).toBe(true);
  });

  it("extrae frontmatter, Context, Script y Score sheet", () => {
    if (!result.ok) throw new Error("debería procesarse");
    const { meta, context, script, scoreSheet } = result.data;
    expect(meta).toEqual({ member: "Jesús", interview: "Junior Data Analyst", interest: "Data Science" });
    expect(textOf(context.job ?? [])).toMatch(/^Junior Data Analyst \(remote/);
    expect(textOf(context.candidate ?? [])).toMatch(/^Jesús, a 9th-semester/);
    expect(textOf(context.role ?? [])).toMatch(/^Lili, recruiter/);
    expect(context.rules).toHaveLength(5);

    expect(script.opening.time).toBe("0:00");
    expect(textOf(script.opening.text)).toMatch(/^"Hi Jesús/);
    expect(script.steps.map((s) => s.time)).toEqual(["0:30", "2:00", "3:00", "4:30", "6:00", "7:30", "9:00"]);
    expect(script.steps[2].seconds).toBe(180);
    expect(textOf(script.steps[0].question)).toBe('"Tell me about yourself."');
    expect(script.steps[0].question[0].type).toBe("emphasis");
    expect(textOf(script.steps[0].goodAnswer)).toMatch(/^Studies, skills/);
    expect(script.closing.time).toBe("10:00");

    expect(scoreSheet.areas.map((a) => a.area)).toEqual([
      "Fluency",
      "Grammar",
      "Vocabulary",
      "Pronunciation",
      "Confidence",
    ]);
    expect(scoreSheet.areas.every((a) => a.lookAt !== null)).toBe(true);
    expect(scoreSheet.intro).toHaveLength(1);
  });
});

describe("plantilla oficial", () => {
  it("su estructura es válida; solo fallan los marcadores [..] del frontmatter", () => {
    const result = parseInterviewScript(template);
    expect(errorsOf(result).every((m) => m.includes("frontmatter"))).toBe(true);
    expect(errorsOf(result)).toHaveLength(3);
  });

  it("con un frontmatter real se procesa", () => {
    const filled = template.replace(/^---\n[\s\S]*?\n---/, "---\nmember: Ana\ninterview: QA Tester\ninterest: QA\n---");
    const result = parseInterviewScript(filled);
    expect(errorsOf(result)).toEqual([]);
    expect(result.ok && result.data.script.steps).toHaveLength(2);
  });
});

describe("frontmatter", () => {
  it("exige el frontmatter", () => {
    const r = parseInterviewScript(jesus.replace(/^---\n[\s\S]*?\n---\n/, ""));
    expect(errorsOf(r)[0]).toMatch(/Missing frontmatter/);
  });

  it("reporta el campo faltante en su línea", () => {
    const r = parseInterviewScript(jesus.replace("interest: Data Science\n", ""));
    expect(r.ok).toBe(false);
    expect(errorsOf(r)).toContain('The frontmatter is missing "interest".');
  });

  it("no evalúa frontmatter ---js ni acepta alias de YAML", () => {
    const js = parseInterviewScript(jesus.replace(/^---\n/, "---js\n"));
    expect(js.ok).toBe(false);
    const alias = parseInterviewScript(
      jesus.replace("member: Jesús", "base: &a Jesús\nmember: *a"),
    );
    expect(alias.ok).toBe(false);
  });

  it("trata todos los valores como texto (sin tipos YAML)", () => {
    const r = parseInterviewScript(jesus.replace("member: Jesús", "member: 2026"));
    expect(r.ok && r.data.meta.member).toBe("2026");
  });
});

describe("secciones", () => {
  it("avisa de una sección faltante", () => {
    const r = parseInterviewScript(jesus.replace(/## Score sheet[\s\S]*$/, ""));
    expect(errorsOf(r)).toContain('Missing section "## Score sheet".');
  });

  it("exige el encabezado exacto", () => {
    const r = parseInterviewScript(jesus.replace("## Context", "## context"));
    expect(errorsOf(r)).toContain('The heading "## context" must be exactly "## Context".');
  });

  it("rechaza secciones duplicadas", () => {
    const r = parseInterviewScript(`${jesus}\n\n## Context\n\nOther.\n`);
    expect(errorsOf(r)).toContain('The section "## Context" appears more than once.');
  });

  it("ignora secciones desconocidas con un aviso", () => {
    const r = parseInterviewScript(`${jesus}\n\n## Notes\n\nSomething.\n`);
    expect(r.ok).toBe(true);
    expect(warningsOf(r)).toContain('Unknown section "## Notes" was ignored.');
  });
});

describe("tabla del Script", () => {
  it("exige las columnas esperadas", () => {
    const r = parseInterviewScript(
      jesus.replace("| Time | Question | A good answer includes |", "| Time | Question | Notes |"),
    );
    expect(errorsOf(r).some((m) => m.startsWith("The Script table must have the columns"))).toBe(true);
  });

  it("explica cuando la tabla está mal formada", () => {
    const r = parseInterviewScript(jesus.replace("| Time | Question | A good answer includes |", "| Time | Question |"));
    expect(errorsOf(r)[0]).toMatch(/^A table in Script is not formatted correctly/);
    expect(errorsOf(r)).not.toContain(
      "The Script section is missing its table (Time | Question | A good answer includes).",
    );
  });

  it("valida el formato de tiempo", () => {
    const r = parseInterviewScript(jesus.replace("| 2:00 |", "| two minutes |"));
    expect(errorsOf(r)).toContain('Script row 2: time "two minutes" must look like m:ss (e.g. 2:00).');
  });

  it("avisa si los tiempos no avanzan", () => {
    const r = parseInterviewScript(jesus.replace("| 3:00 |", "| 1:00 |"));
    expect(r.ok).toBe(true);
    expect(warningsOf(r)).toContain("Script row 3: time 1:00 is not after the previous row.");
  });

  it("exige Opening y Closing con su cita", () => {
    const noOpening = parseInterviewScript(jesus.replace(/\*\*Opening \(0:00\)\*\*\n\n> .*\n/, ""));
    expect(errorsOf(noOpening).some((m) => m.includes("missing \"**Opening"))).toBe(true);

    const noQuote = parseInterviewScript(jesus.replace(/(\*\*Closing \(10:00\)\*\*\n\n)> /, "$1"));
    expect(errorsOf(noQuote)).toContain("Closing needs its line as a quote (> ...) right below it.");
  });

  it("rechaza celdas vacías", () => {
    const r = parseInterviewScript(jesus.replace('| 9:00 | *"Do you have any questions for me?"* |', "| 9:00 |  |"));
    expect(errorsOf(r)).toContain("Script row 7: the question is empty.");
  });
});

describe("tabla del Score sheet", () => {
  it("exige las columnas esperadas", () => {
    const r = parseInterviewScript(jesus.replace("| Area | What to look at |", "| Area | Score |"));
    expect(errorsOf(r).some((m) => m.startsWith("The Score sheet table must have the columns"))).toBe(true);
  });

  it("avisa de áreas faltantes o desconocidas sin bloquear", () => {
    const r = parseInterviewScript(jesus.replace(/\| Pronunciation \|.*\n/, "| Listening | Understands questions |\n"));
    expect(r.ok).toBe(true);
    expect(warningsOf(r)).toContain(
      'Score sheet area "Pronunciation" is missing; the form will show it without a hint.',
    );
    expect(warningsOf(r).some((m) => m.startsWith('Score sheet area "Listening"'))).toBe(true);
    if (r.ok) expect(r.data.scoreSheet.areas.map((a) => a.area)[3]).toBe("Pronunciation");
  });
});

describe("contenido peligroso", () => {
  it("elimina HTML crudo y nunca lo incluye en el resultado", () => {
    const evil = jesus
      .replace("**The job:** Junior", '**The job:** <img src=x onerror="alert(1)"> Junior')
      .replace("## Script", '<script>alert("x")</script>\n\n## Script');
    const r = parseInterviewScript(evil);
    expect(r.ok).toBe(true);
    expect(JSON.stringify(r)).not.toMatch(/<script|onerror|<img/);
    expect(warningsOf(r)).toContain("Raw HTML is not allowed and was removed.");
  });

  it("solo conserva enlaces https://", () => {
    const r = parseInterviewScript(
      jesus.replace(
        "Requires 6 months",
        "[bad](javascript:alert(1)) [plain](http://x.test) [good](https://example.com/job) Requires 6 months",
      ),
    );
    if (!r.ok) throw new Error("debería procesarse");
    const json = JSON.stringify(r.data);
    expect(json).not.toContain("javascript:");
    expect(json).not.toContain("http://x.test");
    expect(json).toContain("https://example.com/job");
    expect(warningsOf(r)).toContain("A link that is not https:// was shown as plain text.");
  });
});

describe("readMarkdownFile", () => {
  const bytes = (s: string) => new TextEncoder().encode(s);

  it("acepta .md y normaliza BOM y CRLF", () => {
    const r = readMarkdownFile("script.MD", bytes("﻿---\r\nmember: A\r\n---\r\n"));
    expect(r).toEqual({ ok: true, text: "---\nmember: A\n---\n" });
  });

  it("rechaza otras extensiones y rutas", () => {
    expect(readMarkdownFile("script.pdf", bytes("x")).ok).toBe(false);
    expect(readMarkdownFile("script.md.exe", bytes("x")).ok).toBe(false);
    expect(readMarkdownFile("../x.md", bytes("x")).ok).toBe(false);
  });

  it("rechaza archivos vacíos, de más de 1 MB, binarios o que no son UTF-8", () => {
    expect(readMarkdownFile("a.md", new Uint8Array()).ok).toBe(false);
    expect(readMarkdownFile("a.md", new Uint8Array(MAX_SCRIPT_BYTES + 1).fill(97)).ok).toBe(false);
    expect(readMarkdownFile("a.md", new Uint8Array([97, 0, 98])).ok).toBe(false);
    expect(readMarkdownFile("a.md", new Uint8Array([0xff, 0xfe, 0x41])).ok).toBe(false);
  });

  it("acepta exactamente 1 MB", () => {
    expect(readMarkdownFile("a.md", new Uint8Array(MAX_SCRIPT_BYTES).fill(97)).ok).toBe(true);
  });
});
