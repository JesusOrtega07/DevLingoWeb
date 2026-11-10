// Parser de los scripts de entrevista (.md) según templates/interview-template.md.
//
// Seguridad:
// - El frontmatter se lee con `yaml` en esquema "failsafe" (todo son textos) y sin alias.
//   No se usa gray-matter, que acepta frontmatter `---js` y lo evalúa.
// - El cuerpo se convierte a un AST con remark (sin rehype ni HTML) y de ahí a un árbol
//   propio y cerrado (types.ts). El HTML crudo se descarta y los enlaces que no son https
//   se muestran como texto. Nada del contenido se ejecuta.
//
// Resultado: errores (impiden guardar) y avisos (se muestran, pero se puede guardar).

import type {
  Blockquote,
  List,
  ListItem,
  Paragraph,
  PhrasingContent,
  Root,
  RootContent,
  Table,
} from "mdast";
import { toString } from "mdast-util-to-string";
import remarkGfm from "remark-gfm";
import remarkParse from "remark-parse";
import { unified } from "unified";
import { parse as parseYaml } from "yaml";

import {
  type Block,
  type Inline,
  type Issue,
  PROCESSED_SCHEMA_VERSION,
  type ParseResult,
  type ProcessedScript,
  SCORE_AREAS,
  type ScoreArea,
  type ScriptMeta,
  type ScriptStep,
  type TimedLine,
} from "./types";

const SECTIONS = ["Context", "Script", "Score sheet"] as const;
type SectionName = (typeof SECTIONS)[number];

const SCRIPT_COLUMNS = ["Time", "Question", "A good answer includes"];
const SCORE_COLUMNS = ["Area", "What to look at"];
const META_KEYS = ["member", "interview", "interest"] as const;
const META_MAX = 120;

const TIME_RE = /^(\d{1,2}):([0-5]\d)$/;
const MARKER_RE = /^(opening|closing)\s*\(\s*(\d{1,2}:[0-5]\d)\s*\)\s*:?$/i;
const CONTEXT_LABELS: Record<string, "job" | "candidate" | "role"> = {
  "the job": "job",
  "the candidate": "candidate",
  "your role": "role",
};

const norm = (s: string) => s.replace(/\s+/g, " ").trim().toLowerCase();

const toSeconds = (time: string) => {
  const m = TIME_RE.exec(time);
  return m ? Number(m[1]) * 60 + Number(m[2]) : null;
};

const isHttpsUrl = (raw: string) => {
  try {
    const url = new URL(raw);
    return url.protocol === "https:" && !url.username && !url.password ? url.href : null;
  } catch {
    return null;
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// Recolector de errores y avisos
// ─────────────────────────────────────────────────────────────────────────────

class Issues {
  errors: Issue[] = [];
  warnings: Issue[] = [];
  private seen = new Set<string>();

  constructor(private lineOffset: number) {}

  line(node?: { position?: { start: { line: number } } }) {
    return node?.position ? node.position.start.line + this.lineOffset : undefined;
  }

  error(message: string, line?: number) {
    this.errors.push({ message, line });
  }

  /** Avisos repetidos (mismo texto y línea) se reportan una sola vez. */
  warn(message: string, line?: number) {
    const key = `${message}@${line}`;
    if (this.seen.has(key)) return;
    this.seen.add(key);
    this.warnings.push({ message, line });
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Conversión de mdast a nuestro árbol cerrado
// ─────────────────────────────────────────────────────────────────────────────

const toInlines = (nodes: PhrasingContent[], issues: Issues): Inline[] =>
  nodes.flatMap((node): Inline[] => {
    switch (node.type) {
      case "text":
        return [{ type: "text", value: node.value }];
      case "emphasis":
        return [{ type: "emphasis", children: toInlines(node.children, issues) }];
      case "strong":
        return [{ type: "strong", children: toInlines(node.children, issues) }];
      case "delete":
        return toInlines(node.children, issues);
      case "inlineCode":
        return [{ type: "code", value: node.value }];
      case "break":
        return [{ type: "break" }];
      case "link": {
        const url = isHttpsUrl(node.url);
        const children = toInlines(node.children, issues);
        if (url) return [{ type: "link", url, children }];
        issues.warn("A link that is not https:// was shown as plain text.", issues.line(node));
        return children;
      }
      case "linkReference":
        return toInlines(node.children, issues);
      case "html":
        issues.warn("Raw HTML is not allowed and was removed.", issues.line(node));
        return [];
      case "image":
      case "imageReference":
        issues.warn("Images are not supported and were removed.", issues.line(node));
        return [];
      case "footnoteReference":
        return [];
      default:
        return [{ type: "text", value: toString(node) }];
    }
  });

/** Quita espacios al inicio y al final, y textos vacíos. */
const trimInlines = (inlines: Inline[]): Inline[] => {
  const out = inlines.map((n) => ({ ...n }));
  const first = out[0];
  if (first?.type === "text") first.value = first.value.replace(/^\s+/, "");
  const last = out.at(-1);
  if (last?.type === "text") last.value = last.value.replace(/\s+$/, "");
  return out.filter((n) => n.type !== "text" || n.value.length > 0);
};

const isEmptyInlines = (inlines: Inline[]) => trimInlines(inlines).length === 0;

/** Junta varios párrafos en una sola línea de texto con saltos. */
const paragraphsToInlines = (nodes: RootContent[], issues: Issues): Inline[] => {
  const parts = nodes
    .filter((n): n is Paragraph => n.type === "paragraph")
    .map((p) => trimInlines(toInlines(p.children, issues)));
  return parts.flatMap((part, i) => (i === 0 ? part : [{ type: "break" } as Inline, ...part]));
};

const toBlocks = (nodes: RootContent[], issues: Issues): Block[] =>
  nodes.flatMap((node): Block[] => {
    switch (node.type) {
      case "paragraph": {
        const children = trimInlines(toInlines(node.children, issues));
        return children.length ? [{ type: "paragraph", children }] : [];
      }
      case "heading":
        return [{ type: "paragraph", children: [{ type: "strong", children: toInlines(node.children, issues) }] }];
      case "list":
        return [
          {
            type: "list",
            ordered: Boolean(node.ordered),
            items: node.children.map((item) => toBlocks(item.children, issues)),
          },
        ];
      case "blockquote":
        return [{ type: "quote", children: toBlocks(node.children, issues) }];
      case "code":
        return [{ type: "codeBlock", value: node.value }];
      case "html":
        issues.warn("Raw HTML is not allowed and was removed.", issues.line(node));
        return [];
      case "table":
        issues.warn("Tables are only supported in Script and Score sheet; this one was ignored.", issues.line(node));
        return [];
      default:
        return [];
    }
  });

/** Un párrafo que empieza con "|" suele ser una tabla mal formada que GFM no reconoció. */
const looksLikeBrokenTable = (node: RootContent) => node.type === "paragraph" && toString(node).trimStart().startsWith("|");

const brokenTableMessage = (label: string) =>
  `A table in ${label} is not formatted correctly: the header, the --- row and every row must have the same number of columns.`;

const hasContent = (node: RootContent) => toString(node).trim().length > 0 || node.type === "table";

// ─────────────────────────────────────────────────────────────────────────────
// Frontmatter
// ─────────────────────────────────────────────────────────────────────────────

const FRONTMATTER_RE = /^---\n([\s\S]*?)\n---[ \t]*(?:\n|$)/;

const parseFrontmatter = (text: string, issues: Issues) => {
  const match = FRONTMATTER_RE.exec(text);
  if (!match) {
    issues.error('Missing frontmatter: the file must start with "---" and include member, interview and interest.', 1);
    return { meta: null, body: text, offset: 0 };
  }

  const offset = match[0].split("\n").length - 1;
  const body = text.slice(match[0].length);

  let raw: unknown;
  try {
    raw = parseYaml(match[1], { schema: "failsafe", maxAliasCount: 0, uniqueKeys: true });
  } catch {
    issues.error("The frontmatter is not valid YAML.", 2);
    return { meta: null, body, offset };
  }

  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    issues.error("The frontmatter must have the fields member, interview and interest.", 2);
    return { meta: null, body, offset };
  }

  const record = raw as Record<string, unknown>;
  const meta: Partial<ScriptMeta> = {};
  const fmLines = match[1].split("\n");
  for (const key of META_KEYS) {
    const value = record[key];
    const index = fmLines.findIndex((l) => l.trimStart().startsWith(`${key}:`));
    const keyLine = index >= 0 ? index + 2 : 1;
    if (value === undefined || value === null || (typeof value === "string" && !value.trim())) {
      issues.error(`The frontmatter is missing "${key}".`, keyLine);
    } else if (typeof value !== "string") {
      issues.error(`The frontmatter field "${key}" must be plain text.`, keyLine);
    } else if (value.trim().length > META_MAX) {
      issues.error(`The frontmatter field "${key}" is too long (max ${META_MAX} characters).`, keyLine);
    } else {
      meta[key] = value.trim();
    }
  }
  const complete = META_KEYS.every((k) => meta[k] !== undefined);
  return { meta: complete ? (meta as ScriptMeta) : null, body, offset };
};

// ─────────────────────────────────────────────────────────────────────────────
// Secciones
// ─────────────────────────────────────────────────────────────────────────────

const splitSections = (tree: Root, issues: Issues) => {
  const sections = new Map<SectionName, { nodes: RootContent[]; line?: number }>();
  const order: SectionName[] = [];
  let title: string | null = null;
  let current: RootContent[] | null = null;
  let warnedBefore = false;

  for (const node of tree.children) {
    if (node.type === "heading" && node.depth === 1) {
      if (title === null && sections.size === 0) {
        title = toString(node).trim() || null;
        continue;
      }
    }

    if (node.type === "heading" && node.depth === 2) {
      const text = toString(node).trim();
      const exact = SECTIONS.find((s) => s === text);
      const loose = exact ?? SECTIONS.find((s) => norm(s) === norm(text));
      const line = issues.line(node);

      if (!loose) {
        issues.warn(`Unknown section "## ${text}" was ignored.`, line);
        current = null;
        continue;
      }
      if (!exact) {
        issues.error(`The heading "## ${text}" must be exactly "## ${loose}".`, line);
      }
      if (sections.has(loose)) {
        issues.error(`The section "## ${loose}" appears more than once.`, line);
        current = null;
        continue;
      }
      current = [];
      sections.set(loose, { nodes: current, line });
      order.push(loose);
      continue;
    }

    if (current) {
      current.push(node);
    } else if (hasContent(node) && !warnedBefore && sections.size === 0) {
      warnedBefore = true;
      issues.warn('Content before "## Context" was ignored.', issues.line(node));
    }
  }

  for (const name of SECTIONS) {
    if (!sections.has(name)) issues.error(`Missing section "## ${name}".`);
  }
  const expectedOrder = SECTIONS.filter((s) => sections.has(s));
  if (order.join("|") !== expectedOrder.join("|")) {
    issues.warn("Sections are not in the usual order (Context, Script, Score sheet).");
  }

  return { title, sections };
};

const readTable = (table: Table, expected: string[], label: string, issues: Issues) => {
  const [head, ...rows] = table.children;
  const headers = head?.children.map((cell) => toString(cell).trim()) ?? [];
  const matches = headers.length === expected.length && headers.every((h, i) => norm(h) === norm(expected[i]));
  if (!matches) {
    issues.error(
      `The ${label} table must have the columns: ${expected.join(" | ")} (found: ${headers.join(" | ") || "nothing"}).`,
      issues.line(table),
    );
    return null;
  }
  if (rows.length === 0) {
    issues.error(`The ${label} table has no rows.`, issues.line(table));
    return null;
  }
  return rows.map((row) => ({
    line: issues.line(row),
    cells: expected.map((_, i) => row.children[i]?.children ?? []),
  }));
};

// Context ─────────────────────────────────────────────────────────────────────

const parseContext = (nodes: RootContent[], issues: Issues): ProcessedScript["context"] => {
  const context: ProcessedScript["context"] = { job: null, candidate: null, role: null, rules: [], notes: [] };

  for (let i = 0; i < nodes.length; i++) {
    const node = nodes[i];
    if (node.type === "paragraph" && node.children[0]?.type === "strong") {
      const label = norm(toString(node.children[0]).replace(/:\s*$/, ""));
      const field = CONTEXT_LABELS[label];

      if (field) {
        const value = trimInlines(toInlines(node.children.slice(1), issues));
        if (context[field]) issues.warn(`"${toString(node.children[0])}" appears more than once.`, issues.line(node));
        if (value.length === 0) issues.warn(`"${toString(node.children[0])}" is empty.`, issues.line(node));
        context[field] = value;
        continue;
      }

      if (label === "rules" && isEmptyInlines(toInlines(node.children.slice(1), issues))) {
        const next = nodes[i + 1];
        if (next?.type === "list") {
          context.rules = (next as List).children
            .map((item: ListItem) => paragraphsToInlines(item.children, issues))
            .filter((rule) => rule.length > 0);
          i++;
        } else {
          issues.warn('"Rules" should be followed by a list.', issues.line(node));
        }
        continue;
      }
    }
    context.notes.push(...toBlocks([node], issues));
  }

  if (!context.job) issues.warn('Context is missing "The job:".');
  if (!context.candidate) issues.warn('Context is missing "The candidate:".');
  if (!context.role) issues.warn('Context is missing "Your role:".');
  if (context.rules.length === 0) issues.warn('Context has no "Rules" list.');
  return context;
};

// Script ──────────────────────────────────────────────────────────────────────

const markerOf = (node: RootContent) => {
  if (node.type !== "paragraph") return null;
  const meaningful = node.children.filter((c) => !(c.type === "text" && !c.value.trim()));
  if (meaningful.length !== 1 || meaningful[0].type !== "strong") return null;
  const m = MARKER_RE.exec(toString(meaningful[0]).trim());
  return m ? { kind: m[1].toLowerCase() as "opening" | "closing", time: m[2] } : null;
};

const parseScript = (nodes: RootContent[], issues: Issues) => {
  let opening: TimedLine | null = null;
  let closing: TimedLine | null = null;
  let steps: ScriptStep[] | null = null;
  let tableSeen = false;

  for (let i = 0; i < nodes.length; i++) {
    const node = nodes[i];
    const marker = markerOf(node);

    if (marker) {
      const label = marker.kind === "opening" ? "Opening" : "Closing";
      const next = nodes[i + 1];
      if (next?.type !== "blockquote") {
        issues.error(`${label} needs its line as a quote (> ...) right below it.`, issues.line(node));
        continue;
      }
      i++;
      const text = paragraphsToInlines((next as Blockquote).children, issues);
      if (text.length === 0) issues.error(`${label} quote is empty.`, issues.line(next));
      const line: TimedLine = { time: marker.time, seconds: toSeconds(marker.time) ?? 0, text };
      if ((marker.kind === "opening" ? opening : closing) !== null) {
        issues.error(`${label} appears more than once.`, issues.line(node));
      }
      if (marker.kind === "opening") opening = line;
      else closing = line;
      continue;
    }

    if (node.type === "table") {
      if (tableSeen) {
        issues.error("The Script section must have only one table.", issues.line(node));
        continue;
      }
      tableSeen = true;
      const rows = readTable(node, SCRIPT_COLUMNS, "Script", issues);
      if (!rows) continue;

      steps = [];
      let previous = -1;
      rows.forEach((row, index) => {
        const n = index + 1;
        const time = toString({ type: "paragraph", children: row.cells[0] }).trim();
        const seconds = toSeconds(time);
        const question = trimInlines(toInlines(row.cells[1], issues));
        const goodAnswer = trimInlines(toInlines(row.cells[2], issues));

        if (seconds === null) issues.error(`Script row ${n}: time "${time}" must look like m:ss (e.g. 2:00).`, row.line);
        if (question.length === 0) issues.error(`Script row ${n}: the question is empty.`, row.line);
        if (goodAnswer.length === 0) issues.error(`Script row ${n}: "A good answer includes" is empty.`, row.line);
        if (seconds !== null && seconds <= previous) {
          issues.warn(`Script row ${n}: time ${time} is not after the previous row.`, row.line);
        }
        if (seconds !== null) previous = seconds;
        steps?.push({ time, seconds: seconds ?? 0, question, goodAnswer });
      });
      continue;
    }

    if (looksLikeBrokenTable(node)) {
      issues.error(brokenTableMessage("Script"), issues.line(node));
      tableSeen = true;
      continue;
    }

    if (hasContent(node)) {
      issues.warn("Content in Script other than Opening, the table and Closing was ignored.", issues.line(node));
    }
  }

  if (!opening) issues.error('The Script section is missing "**Opening (0:00)**" followed by a quote.');
  if (!tableSeen) issues.error("The Script section is missing its table (Time | Question | A good answer includes).");
  if (!closing) issues.error('The Script section is missing "**Closing (m:ss)**" followed by a quote.');

  if (opening && closing && steps?.length) {
    if (steps[0].seconds < opening.seconds) issues.warn("The first question is before the Opening time.");
    if (closing.seconds < steps[steps.length - 1].seconds) issues.warn("The Closing time is before the last question.");
  }

  return opening && closing && steps ? { opening, steps, closing } : null;
};

// Score sheet ─────────────────────────────────────────────────────────────────

const parseScoreSheet = (nodes: RootContent[], issues: Issues): ProcessedScript["scoreSheet"] | null => {
  const intro: Block[] = [];
  const found = new Map<ScoreArea, Inline[] | null>();
  const foundOrder: ScoreArea[] = [];
  let tableSeen = false;
  let tableOk = false;

  for (const node of nodes) {
    if (looksLikeBrokenTable(node)) {
      issues.error(brokenTableMessage("Score sheet"), issues.line(node));
      tableSeen = true;
      continue;
    }
    if (node.type !== "table") {
      intro.push(...toBlocks([node], issues));
      continue;
    }
    if (tableSeen) {
      issues.error("The Score sheet section must have only one table.", issues.line(node));
      continue;
    }
    tableSeen = true;
    const rows = readTable(node, SCORE_COLUMNS, "Score sheet", issues);
    if (!rows) continue;
    tableOk = true;

    for (const row of rows) {
      const name = toString({ type: "paragraph", children: row.cells[0] }).trim();
      const area = SCORE_AREAS.find((a) => norm(a) === norm(name));
      if (!area) {
        issues.warn(`Score sheet area "${name}" is not one of ${SCORE_AREAS.join(", ")} and was ignored.`, row.line);
        continue;
      }
      if (found.has(area)) {
        issues.warn(`Score sheet area "${area}" appears more than once; the first one is used.`, row.line);
        continue;
      }
      const lookAt = trimInlines(toInlines(row.cells[1], issues));
      if (lookAt.length === 0) issues.warn(`Score sheet area "${area}" has no "What to look at".`, row.line);
      found.set(area, lookAt.length ? lookAt : null);
      foundOrder.push(area);
    }
  }

  if (!tableSeen) {
    issues.error("The Score sheet section is missing its table (Area | What to look at).");
    return null;
  }
  if (!tableOk) return null;

  for (const area of SCORE_AREAS) {
    if (!found.has(area)) issues.warn(`Score sheet area "${area}" is missing; the form will show it without a hint.`);
  }
  const expected = SCORE_AREAS.filter((a) => found.has(a));
  if (foundOrder.join("|") !== expected.join("|")) {
    issues.warn(`Score sheet areas will be shown in the fixed order: ${SCORE_AREAS.join(", ")}.`);
  }

  return { intro, areas: SCORE_AREAS.map((area) => ({ area, lookAt: found.get(area) ?? null })) };
};

// ─────────────────────────────────────────────────────────────────────────────
// Entrada principal
// ─────────────────────────────────────────────────────────────────────────────

/** Recibe el texto ya validado por readMarkdownFile (UTF-8, \n, sin BOM). */
export const parseInterviewScript = (text: string): ParseResult => {
  const pre = new Issues(0);
  const { meta, body, offset } = parseFrontmatter(text, pre);

  const issues = new Issues(offset);
  issues.errors.push(...pre.errors);
  issues.warnings.push(...pre.warnings);

  const tree = unified().use(remarkParse).use(remarkGfm).parse(body) as Root;
  const { title, sections } = splitSections(tree, issues);

  const contextNodes = sections.get("Context")?.nodes;
  const scriptNodes = sections.get("Script")?.nodes;
  const scoreNodes = sections.get("Score sheet")?.nodes;

  const context = contextNodes ? parseContext(contextNodes, issues) : null;
  const script = scriptNodes ? parseScript(scriptNodes, issues) : null;
  const scoreSheet = scoreNodes ? parseScoreSheet(scoreNodes, issues) : null;

  if (issues.errors.length > 0 || !meta || !context || !script || !scoreSheet) {
    if (issues.errors.length === 0) issues.error("The file could not be processed.");
    return { ok: false, errors: issues.errors, warnings: issues.warnings };
  }

  return {
    ok: true,
    data: { schemaVersion: PROCESSED_SCHEMA_VERSION, meta, title, context, script, scoreSheet },
    warnings: issues.warnings,
  };
};
