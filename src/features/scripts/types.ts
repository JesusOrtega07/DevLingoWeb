// Estructura del script de entrevista ya procesado. Se guarda como JSON en
// InterviewScript.processed y es lo único que se renderiza (nunca el .md original).
//
// El texto enriquecido es un árbol propio y cerrado: no hay nodos de HTML, así que
// renderizarlo no puede inyectar marcado.

export const PROCESSED_SCHEMA_VERSION = 1;

export type Inline =
  | { type: "text"; value: string }
  | { type: "emphasis"; children: Inline[] }
  | { type: "strong"; children: Inline[] }
  | { type: "code"; value: string }
  | { type: "link"; url: string; children: Inline[] }
  | { type: "break" };

export type Block =
  | { type: "paragraph"; children: Inline[] }
  | { type: "list"; ordered: boolean; items: Block[][] }
  | { type: "quote"; children: Block[] }
  | { type: "codeBlock"; value: string };

export const SCORE_AREAS = ["Fluency", "Grammar", "Vocabulary", "Pronunciation", "Confidence"] as const;
export type ScoreArea = (typeof SCORE_AREAS)[number];

export type ScriptMeta = {
  member: string;
  interview: string;
  interest: string;
};

export type TimedLine = {
  /** Tal como viene en el .md, p. ej. "2:00". */
  time: string;
  /** El mismo tiempo en segundos, para ordenar o mostrar progreso. */
  seconds: number;
  text: Inline[];
};

export type ScriptStep = {
  time: string;
  seconds: number;
  question: Inline[];
  goodAnswer: Inline[];
};

export type ProcessedScript = {
  schemaVersion: typeof PROCESSED_SCHEMA_VERSION;
  meta: ScriptMeta;
  title: string | null;
  context: {
    job: Inline[] | null;
    candidate: Inline[] | null;
    role: Inline[] | null;
    rules: Inline[][];
    /** Cualquier otro contenido de la sección, en orden. */
    notes: Block[];
  };
  script: {
    opening: TimedLine;
    steps: ScriptStep[];
    closing: TimedLine;
  };
  scoreSheet: {
    intro: Block[];
    /** Siempre las 5 áreas en el orden fijo; lookAt es null si el .md no la trae. */
    areas: { area: ScoreArea; lookAt: Inline[] | null }[];
  };
};

export type Issue = {
  /** Mensaje para el admin, en inglés como el resto de la interfaz. */
  message: string;
  /** Línea del .md original, cuando se conoce. */
  line?: number;
};

export type ParseResult =
  | { ok: true; data: ProcessedScript; warnings: Issue[] }
  | { ok: false; errors: Issue[]; warnings: Issue[] };
