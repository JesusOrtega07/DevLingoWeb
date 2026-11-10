"use client";

import { useState } from "react";

import BlockText from "@/features/scripts/components/BlockText";
import InlineText from "@/features/scripts/components/InlineText";
import type { ProcessedScript } from "@/features/scripts/types";

const TABS = ["Context", "Script", "Score sheet"] as const;
type Tab = (typeof TABS)[number];

type Props = { data: ProcessedScript };

const Field = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div className="flex flex-col gap-1">
    <span className="font-mono text-[12px] tracking-[0.08em] text-gold uppercase">{label}</span>
    <div className="text-[15px] leading-relaxed">{children}</div>
  </div>
);

// Vista previa del script procesado, tal como lo verá la English Expert (sin el diseño final).
const ScriptPreview = ({ data }: Props) => {
  const [tab, setTab] = useState<Tab>("Context");
  const { context, script, scoreSheet } = data;

  return (
    <div className="flex flex-col gap-5">
      <div role="tablist" aria-label="Script preview" className="flex gap-1 border-b border-line">
        {TABS.map((t) => (
          <button
            key={t}
            type="button"
            role="tab"
            aria-selected={tab === t}
            onClick={() => setTab(t)}
            className={`-mb-px cursor-pointer border-0 border-b-2 bg-transparent px-3 py-2.5 font-sans text-sm font-semibold ${
              tab === t ? "border-gold text-gold" : "border-transparent text-cream/66 hover:text-cream"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === "Context" && (
        <div role="tabpanel" className="flex flex-col gap-5">
          {context.job && <Field label="The job"><InlineText nodes={context.job} /></Field>}
          {context.candidate && <Field label="The candidate"><InlineText nodes={context.candidate} /></Field>}
          {context.role && <Field label="Your role"><InlineText nodes={context.role} /></Field>}
          {context.rules.length > 0 && (
            <Field label="Rules">
              <ul className="m-0 flex list-disc flex-col gap-1 pl-5">
                {context.rules.map((rule, i) => (
                  <li key={i}>
                    <InlineText nodes={rule} />
                  </li>
                ))}
              </ul>
            </Field>
          )}
          {context.notes.length > 0 && (
            <Field label="Notes">
              <div className="flex flex-col gap-2">
                <BlockText blocks={context.notes} />
              </div>
            </Field>
          )}
        </div>
      )}

      {tab === "Script" && (
        <ol role="tabpanel" className="m-0 flex list-none flex-col gap-4 p-0">
          <li className="flex gap-4">
            <span className="w-12 shrink-0 font-mono text-sm text-gold">{script.opening.time}</span>
            <Field label="Opening"><InlineText nodes={script.opening.text} /></Field>
          </li>
          {script.steps.map((step, i) => (
            <li key={i} className="flex gap-4 border-t border-line pt-4">
              <span className="w-12 shrink-0 font-mono text-sm text-gold">{step.time}</span>
              <div className="flex flex-col gap-2">
                <p className="m-0 text-[15px] font-semibold"><InlineText nodes={step.question} /></p>
                <p className="m-0 text-sm text-cream/66">
                  <span className="font-semibold text-cream/80">A good answer includes: </span>
                  <InlineText nodes={step.goodAnswer} />
                </p>
              </div>
            </li>
          ))}
          <li className="flex gap-4 border-t border-line pt-4">
            <span className="w-12 shrink-0 font-mono text-sm text-gold">{script.closing.time}</span>
            <Field label="Closing"><InlineText nodes={script.closing.text} /></Field>
          </li>
        </ol>
      )}

      {tab === "Score sheet" && (
        <div role="tabpanel" className="flex flex-col gap-4">
          {scoreSheet.intro.length > 0 && (
            <div className="flex flex-col gap-2 text-sm text-cream/66">
              <BlockText blocks={scoreSheet.intro} />
            </div>
          )}
          {scoreSheet.areas.map(({ area, lookAt }) => (
            <Field key={area} label={area}>
              {lookAt ? <InlineText nodes={lookAt} /> : <span className="text-cream/50">No hint in the file.</span>}
            </Field>
          ))}
        </div>
      )}
    </div>
  );
};

export default ScriptPreview;
