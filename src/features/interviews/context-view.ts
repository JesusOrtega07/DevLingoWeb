// Convierte el texto libre de Context en la estructura que muestra el mockup 04
// (chips del puesto, habilidades clave, "Requires", encabezados de candidato y rol,
// reglas con etiqueta). Si el texto no sigue el patrón, se cae a mostrarlo completo.

import type { Inline } from "@/features/scripts/types";

export const plainText = (nodes: Inline[]): string =>
  nodes
    .map((n) => {
      switch (n.type) {
        case "text":
        case "code":
          return n.value;
        case "break":
          return " ";
        default:
          return plainText(n.children);
      }
    })
    .join("")
    .replace(/\s+/g, " ")
    .trim();

const capitalize = (s: string) => (s ? s[0].toUpperCase() + s.slice(1) : s);

/** "a" → “a” (comillas tipográficas, como en el mockup). */
export const curlyQuotes = (s: string) => s.replace(/"([^"]*)"/g, "“$1”");

/** Quita comillas que envuelven todo el texto: "Tell me…" → Tell me… */
export const stripWrappingQuotes = (s: string) => s.trim().replace(/^["“”']+|["“”']+$/g, "").trim();

/** Divide en oraciones sin romper números ($85,000), siglas ni paréntesis. */
export const sentences = (text: string) =>
  text
    .split(/(?<=[.!?])\s+(?=[A-Z0-9“"])/)
    .map((s) => s.trim())
    .filter(Boolean);

/** Divide una lista por comas que no estén dentro de paréntesis ni sean separador de miles. */
const splitList = (text: string) => {
  const items: string[] = [];
  let depth = 0;
  let current = "";
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (ch === "(") depth++;
    if (ch === ")") depth = Math.max(0, depth - 1);
    const thousands = /\d/.test(text[i - 1] ?? "") && /\d/.test(text[i + 1] ?? "");
    if (ch === "," && depth === 0 && !thousands) {
      items.push(current);
      current = "";
    } else {
      current += ch;
    }
  }
  items.push(current);
  return items
    .map((i) => i.trim().replace(/^and\s+/i, "").replace(/\.$/, "").trim())
    .filter(Boolean);
};

export type JobView = {
  chips: string[];
  company: string | null;
  description: string | null;
  skills: string[];
  requires: string | null;
};

export const parseJob = (job: Inline[] | null): JobView | null => {
  if (!job) return null;
  const all = sentences(plainText(job));
  if (all.length === 0) return null;

  const view: JobView = { chips: [], company: null, description: null, skills: [], requires: null };
  const rest: string[] = [];

  all.forEach((sentence, index) => {
    const skills = /^key skills?\s*:\s*(.+)$/i.exec(sentence);
    if (skills) {
      view.skills = splitList(skills[1]).map(capitalize);
      return;
    }
    const requires = /^requires?\s*:?\s+(.+)$/i.exec(sentence);
    if (requires) {
      view.requires = capitalize(requires[1]);
      return;
    }
    if (index === 0) {
      // "Junior Data Analyst (remote, US, $85,000/year), posted by X for …"
      const head = /^[^()]*\(([^)]*)\)\s*,?\s*(.*)$/.exec(sentence);
      if (head) {
        view.chips = splitList(head[1]).map(capitalize);
        if (head[2]) rest.push(capitalize(head[2]));
      } else {
        rest.push(sentence);
      }
      return;
    }
    rest.push(sentence);
  });

  const company = /posted by\s+(.+?)(?:\s+for\s+|[,.]|$)/i.exec(rest.join(" "));
  if (company) {
    view.company = company[1].trim();
    if (!view.chips.includes(view.company)) view.chips.push(view.company);
  }
  view.description = rest.join(" ") || null;
  return view;
};

/** "Jesús, a 9th-semester student…" → { heading: "Jesús", body: "A 9th-semester student…" } */
export const splitCandidate = (candidate: Inline[] | null, fallbackName: string) => {
  const text = candidate ? plainText(candidate) : "";
  const match = /^([^,.]{1,60}),\s*(.+)$/.exec(text);
  if (match) return { heading: match[1].trim(), body: capitalize(match[2].trim()) };
  return { heading: fallbackName, body: text || null };
};

/** "Lili, recruiter at X. You are not…" → { heading: "Lili, recruiter at X", body: "You are not…" } */
export const splitRole = (role: Inline[] | null) => {
  if (!role) return { heading: null, body: null };
  const [first, ...rest] = sentences(plainText(role));
  if (!first) return { heading: null, body: null };
  if (rest.length === 0) return { heading: null, body: first };
  return { heading: first.replace(/[.:]$/, ""), body: rest.join(" ") };
};

/**
 * "Silence: wait 5 seconds…" → { label: "Silence", body: [Wait 5 seconds…] }
 * "English only. If he uses Spanish: *"In English, please."*" → { label: "English only", body: [...] }
 * Conserva el formato del resto (las citas en cursiva se muestran en dorado).
 */
export const splitRule = (rule: Inline[]): { label: string | null; body: Inline[] } => {
  const first = rule[0];
  if (first?.type !== "text") return { label: null, body: rule };
  const match = /^\s*([^:.]{1,40}?)\s*[:.]\s+([\s\S]*)$/.exec(first.value);
  if (!match) return { label: null, body: rule };
  const remainder = match[2];
  const body: Inline[] = remainder ? [{ type: "text", value: capitalize(remainder) }, ...rule.slice(1)] : rule.slice(1);
  return { label: match[1], body };
};

/** "10:00" → "10 min" */
export const durationLabel = (seconds: number) => (seconds > 0 ? `${Math.round(seconds / 60)} min` : null);
