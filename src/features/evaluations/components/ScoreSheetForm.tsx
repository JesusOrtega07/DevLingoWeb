"use client";

import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useActionState, useEffect, useRef, useState, type ReactNode } from "react";

import FormMessage from "@/components/ui/FormMessage";
import PrimaryButton from "@/components/ui/PrimaryButton";
import { saveEvaluation, type EvaluationFormState } from "@/features/evaluations/actions";
import { MAX_MISTAKES, type AreaField } from "@/features/evaluations/schemas";
import { readSession, removeSession, writeSession } from "@/lib/session-storage";

export type ScoreValues = Record<AreaField, string> & {
  strength: string;
  improve1: string;
  improve2: string;
  nextRound: "" | "YES" | "MAYBE" | "NO";
  mistakes: { heSaid: string; better: string }[];
};

type Props = {
  interviewId: string;
  intro: ReactNode;
  areas: { field: AreaField; title: string; lookAt: ReactNode }[];
  initial: ScoreValues;
  /** Si ya hay una evaluación guardada: fecha legible y número de ediciones anteriores. */
  saved: { label: string; revisions: number } | null;
};

type Row = { key: string; heSaid: string; better: string };
type FormValues = Omit<ScoreValues, "mistakes"> & { mistakes: Row[] };

// Clave estable por fila para que al quitar una del medio no se mezclen las animaciones.
let rowCounter = 0;
const newKey = () => `row-${++rowCounter}`;
const emptyRow = (): Row => ({ key: newKey(), heSaid: "", better: "" });
const withRows = (rows: ScoreValues["mistakes"]): Row[] =>
  rows.length > 0 ? rows.map((r) => ({ key: newKey(), heSaid: r.heSaid, better: r.better })) : [emptyRow(), emptyRow()];
const toForm = (v: ScoreValues): FormValues => ({ ...v, mistakes: withRows(v.mistakes) });

const card = "box-border flex flex-col gap-3.5 rounded-[20px] border border-line bg-surface p-6 sm:px-8 sm:py-7";
const field =
  "box-border w-full rounded-xl border border-line bg-ink px-4 font-sans text-[15px] text-cream placeholder:text-cream/40 focus:border-gold focus:outline-none aria-invalid:border-danger";
const h2 = "m-0 text-[22px] leading-[1.25] font-extrabold";

const FieldError = ({ id, errors }: { id: string; errors?: string[] }) =>
  errors?.[0] ? (
    <p id={id} className="m-0 text-[13px] text-danger">
      {errors[0]}
    </p>
  ) : null;

const ROUND_OPTIONS = [
  { value: "YES", label: "Yes" },
  { value: "MAYBE", label: "Maybe" },
  { value: "NO", label: "No" },
] as const;

// Formulario del Score sheet (mockup 06). Campos controlados con borrador en sessionStorage
// para no perder lo escrito si se cambia de pestaña o se recarga. Se valida en el servidor.
const ScoreSheetForm = ({ interviewId, intro, areas, initial, saved }: Props) => {
  const draftKey = `devlingo:draft:${interviewId}`;
  const [values, setValues] = useState<FormValues>(() => toForm(initial));
  const [draftRestored, setDraftRestored] = useState(false);
  const [state, formAction, pending] = useActionState<EvaluationFormState, FormData>(saveEvaluation, {});
  const loaded = useRef(false);
  const reduce = useReducedMotion();

  // Recupera el borrador tras montar (sessionStorage no existe en el servidor).
  useEffect(() => {
    const draft = readSession<ScoreValues>(draftKey);
    if (draft && typeof draft === "object" && Array.isArray(draft.mistakes)) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setValues(toForm({ ...initial, ...draft }));
      setDraftRestored(true);
    }
    loaded.current = true;
  }, [draftKey, initial]);

  // Si el servidor devolvió errores, el borrador vuelve a guardarse.
  useEffect(() => {
    if (state.error && loaded.current) writeSession(draftKey, values);
    // Solo al recibir una respuesta nueva del servidor.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  const change = (patch: Partial<FormValues>) => {
    setValues((prev) => {
      const next = { ...prev, ...patch };
      writeSession(draftKey, next);
      return next;
    });
  };

  const setRow = (index: number, patch: Partial<Row>) =>
    change({ mistakes: values.mistakes.map((m, i) => (i === index ? { ...m, ...patch } : m)) });

  const discardDraft = () => {
    removeSession(draftKey);
    setValues(toForm(initial));
    setDraftRestored(false);
  };

  const errors = state.fieldErrors ?? {};
  const invalid = (name: string) => (errors[name]?.length ? true : undefined);
  const describedBy = (name: string) => (errors[name]?.length ? `${name}-error` : undefined);

  return (
    <form
      action={formAction}
      onSubmit={() => removeSession(draftKey)}
      noValidate
      className="flex flex-col gap-8"
    >
      <input type="hidden" name="interviewId" value={interviewId} />

      {saved && (
        <p role="status" className="m-0 rounded-[14px] border border-[#7FB58E]/40 bg-[#7FB58E]/10 px-6 py-4 text-[15px] leading-normal">
          <span className="font-mono text-[13px] text-[#8CC79F]">{"// saved"}</span>
          <br />
          This evaluation was saved on {saved.label}
          {saved.revisions > 0 && ` and edited ${saved.revisions} ${saved.revisions === 1 ? "time" : "times"}`}. Saving
          again keeps the previous version in the history.
        </p>
      )}

      {draftRestored && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-[14px] border border-line px-6 py-3 text-sm text-cream/80">
          <span>Unsaved changes from this tab were restored.</span>
          <button
            type="button"
            onClick={discardDraft}
            className="cursor-pointer border-none bg-transparent p-0 font-sans text-sm font-semibold text-gold underline hover:text-cream"
          >
            Discard changes
          </button>
        </div>
      )}

      <div className="m-0 rounded-[14px] border border-gold/30 bg-gold/8 px-6 py-5 text-base leading-[1.55]">
        <span className="font-mono text-[13px] text-gold">{"// instructions"}</span>
        <div>{intro}</div>
      </div>

      {areas.map(({ field: name, title, lookAt }, i) => (
        <section key={name} className={card}>
          <div className="flex items-baseline gap-3.5">
            <span className="font-mono text-sm text-gold">{String(i + 1).padStart(2, "0")}</span>
            <h2 className={h2}>{title}</h2>
          </div>
          {lookAt && (
            <p className="m-0 text-sm leading-normal text-cream/66">
              <span className="font-mono text-[12px] text-cream/60">What to look at:</span> {lookAt}
            </p>
          )}
          <label className="flex flex-col gap-2 text-[13px] font-semibold">
            Written analysis
            <textarea
              name={name}
              rows={5}
              maxLength={4000}
              value={values[name]}
              onChange={(e) => change({ [name]: e.target.value } as Partial<FormValues>)}
              aria-invalid={invalid(name)}
              aria-describedby={describedBy(name)}
              placeholder="What went well, what needs work, and examples you heard…"
              className={`${field} min-h-[132px] resize-y py-4 leading-[1.6] font-normal`}
            />
          </label>
          <FieldError id={`${name}-error`} errors={errors[name]} />
        </section>
      ))}

      <section className={`${card} gap-4`}>
        <h2 className={h2}>Mistakes heard</h2>
        <div className="flex flex-col overflow-hidden rounded-[14px] border border-line">
          <div className="grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)_44px] bg-ink font-mono text-[12px] tracking-[0.04em] text-cream/60">
            <span className="px-4 py-3">HE SAID</span>
            <span className="border-l border-line px-4 py-3">BETTER</span>
            <span aria-hidden="true" />
          </div>
          <AnimatePresence initial={false}>
            {values.mistakes.map((row, i) => (
              <motion.div
                key={row.key}
                initial={reduce ? false : { opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={reduce ? undefined : { opacity: 0, height: 0 }}
                transition={{ duration: 0.18 }}
                className="grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)_44px] border-t border-line"
              >
                <input
                  name="heSaid"
                  aria-label={`He said, row ${i + 1}`}
                  maxLength={300}
                  value={row.heSaid}
                  onChange={(e) => setRow(i, { heSaid: e.target.value })}
                  placeholder="What was said…"
                  className="box-border h-[50px] min-w-0 border-none bg-transparent px-4 font-sans text-[15px] text-cream/80 placeholder:text-cream/40 focus:bg-ink focus:outline-none"
                />
                <input
                  name="better"
                  aria-label={`Better, row ${i + 1}`}
                  maxLength={300}
                  value={row.better}
                  onChange={(e) => setRow(i, { better: e.target.value })}
                  placeholder="A better way to say it…"
                  className="box-border h-[50px] min-w-0 border-0 border-l border-solid border-line bg-transparent px-4 font-sans text-[15px] font-semibold text-gold placeholder:font-normal placeholder:text-cream/40 focus:bg-ink focus:outline-none"
                />
                <button
                  type="button"
                  aria-label={`Remove row ${i + 1}`}
                  onClick={() => change({ mistakes: values.mistakes.filter((_, j) => j !== i) })}
                  className="flex cursor-pointer items-center justify-center border-none bg-transparent text-cream/50 hover:text-danger"
                >
                  <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true">
                    <path d="M4 4l8 8M12 4l-8 8" />
                  </svg>
                </button>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
        <FieldError id="mistakes-error" errors={errors.mistakes} />
        <button
          type="button"
          disabled={values.mistakes.length >= MAX_MISTAKES}
          onClick={() => change({ mistakes: [...values.mistakes, emptyRow()] })}
          className="h-11 cursor-pointer self-start rounded-[10px] border border-dashed border-gold/60 bg-transparent px-[18px] font-sans text-sm font-bold text-gold hover:border-gold disabled:cursor-not-allowed disabled:opacity-50"
        >
          + Add row
        </button>
      </section>

      <section className={card}>
        <label htmlFor="strength" className={h2}>
          Strength
        </label>
        <textarea
          id="strength"
          name="strength"
          rows={3}
          maxLength={2000}
          value={values.strength}
          onChange={(e) => change({ strength: e.target.value })}
          aria-invalid={invalid("strength")}
          aria-describedby={describedBy("strength")}
          placeholder="The strongest point in this interview…"
          className={`${field} min-h-24 resize-y py-4 leading-[1.6]`}
        />
        <FieldError id="strength-error" errors={errors.strength} />
      </section>

      <section className={card}>
        <h2 className={h2}>Top 2 to improve</h2>
        {(["improve1", "improve2"] as const).map((name, i) => (
          <div key={name} className="flex flex-col gap-2">
            <div className="flex items-center gap-3.5">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gold/14 font-mono text-sm text-gold">
                {i + 1}
              </span>
              <input
                name={name}
                aria-label={`Improvement ${i + 1}`}
                maxLength={300}
                value={values[name]}
                onChange={(e) => change({ [name]: e.target.value } as Partial<FormValues>)}
                aria-invalid={invalid(name)}
                aria-describedby={describedBy(name)}
                placeholder={i === 0 ? "First thing to improve…" : "Second thing to improve…"}
                className={`${field} h-[50px] min-w-0 flex-1`}
              />
            </div>
            <div className="pl-[46px]">
              <FieldError id={`${name}-error`} errors={errors[name]} />
            </div>
          </div>
        ))}
      </section>

      <section className={`${card} sm:flex-row sm:flex-wrap sm:items-center sm:justify-between sm:gap-5`}>
        <h2 id="next-round-label" className={h2}>
          Next round?
        </h2>
        <div role="radiogroup" aria-labelledby="next-round-label" aria-describedby={describedBy("nextRound")} className="flex gap-2.5">
          {ROUND_OPTIONS.map(({ value, label }) => (
            <label key={value} className="relative">
              <input
                type="radio"
                name="nextRound"
                value={value}
                checked={values.nextRound === value}
                onChange={() => change({ nextRound: value })}
                className="peer absolute inset-0 m-0 cursor-pointer opacity-0"
              />
              <span className="flex h-11 items-center rounded-full border border-line px-[26px] text-[15px] font-semibold transition-colors peer-checked:border-gold peer-checked:bg-gold peer-checked:text-ink peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-gold">
                {label}
              </span>
            </label>
          ))}
        </div>
        <div className="sm:basis-full">
          <FieldError id="nextRound-error" errors={errors.nextRound} />
        </div>
      </section>

      <div className="flex flex-col items-end gap-4">
        <FormMessage error={state.error} />
        <PrimaryButton type="submit" pending={pending} className="h-14 px-8">
          {pending ? "Saving…" : saved ? "Update evaluation" : "Save evaluation"}
        </PrimaryButton>
      </div>
    </form>
  );
};

export default ScoreSheetForm;
