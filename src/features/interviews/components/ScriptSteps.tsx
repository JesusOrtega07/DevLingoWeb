"use client";

import { motion, useReducedMotion } from "motion/react";
import { useEffect, useState, type ReactNode } from "react";

import { readSession, writeSession } from "@/lib/session-storage";

export type StepView = { time: string; question: string; good: ReactNode };

type Props = { interviewId: string; scriptVersion: number; steps: StepView[] };

// Pasos del Script (mockup 05). Lili marca cada pregunta al hacerla; la primera sin marcar
// es la actual ("NOW"). Las marcas se guardan en sessionStorage, por versión del script.
const ScriptSteps = ({ interviewId, scriptVersion, steps }: Props) => {
  const key = `devlingo:steps:${interviewId}:v${scriptVersion}`;
  const [done, setDone] = useState<boolean[]>(() => steps.map(() => false));
  const reduce = useReducedMotion();

  useEffect(() => {
    const saved = readSession<boolean[]>(key);
    if (Array.isArray(saved) && saved.length === steps.length) {
      // Carga única del estado guardado tras montar (sessionStorage no existe en el servidor).
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setDone(saved.map(Boolean));
    }
  }, [key, steps.length]);

  const toggle = (index: number) => {
    const next = done.map((d, i) => (i === index ? !d : d));
    setDone(next);
    writeSession(key, next);
  };

  const current = done.indexOf(false);

  return (
    <ol className="m-0 flex list-none flex-col gap-3 p-0">
      {steps.map((step, i) => {
        const isDone = done[i];
        const isCurrent = i === current;
        return (
          <motion.li
            key={i}
            layout={!reduce}
            animate={{ opacity: isDone ? 0.62 : 1 }}
            transition={{ duration: 0.2 }}
            aria-current={isCurrent ? "step" : undefined}
            className={`flex items-start gap-4 rounded-[18px] border px-5 py-5 sm:gap-6 sm:px-7 sm:py-6 ${
              isCurrent ? "border-gold bg-surface" : "border-line bg-transparent"
            }`}
          >
            <div className="flex w-14 shrink-0 flex-col gap-1.5 pt-1 sm:w-16">
              <span className={`font-mono text-[15px] font-medium ${isCurrent ? "text-gold" : "text-cream/60"}`}>{step.time}</span>
              {isCurrent && (
                <span className="self-start rounded-full bg-gold px-2 py-0.5 font-mono text-[10px] font-medium tracking-[0.06em] text-ink">
                  NOW
                </span>
              )}
            </div>
            <div className="flex min-w-0 flex-1 flex-col gap-2.5">
              <p
                className={`m-0 text-lg leading-[1.4] font-bold sm:text-[21px] ${
                  isDone ? "line-through decoration-cream/35" : ""
                }`}
              >
                {step.question}
              </p>
              <p className="m-0 text-sm leading-[1.55] text-cream/66">
                <span className="font-mono text-[12px] text-gold">A good answer includes:</span> {step.good}
              </p>
            </div>
            <label className="flex h-11 w-11 shrink-0 cursor-pointer items-center justify-center">
              <input
                type="checkbox"
                checked={isDone}
                onChange={() => toggle(i)}
                aria-label={`Mark step ${step.time} done`}
                className="m-0 h-[22px] w-[22px] cursor-pointer accent-gold"
              />
            </label>
          </motion.li>
        );
      })}
    </ol>
  );
};

export default ScriptSteps;
