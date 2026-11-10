"use client";

import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import Link from "next/link";
import { useState } from "react";

import MemberAvatar from "@/components/MemberAvatar";
import StatusTag from "@/features/interviews/components/StatusTag";

export type FamilyCard = {
  id: string;
  name: string;
  age: number | null;
  interest: string;
  position: string;
  status: "PENDING" | "INTERVIEWED";
  hasScript: boolean;
};

type Props = { cards: FamilyCard[] };

// Tarjetas de la DevLingo Family (mockups 02 y 03). Al elegir una se pide confirmación.
const FamilyGrid = ({ cards }: Props) => {
  const [selected, setSelected] = useState<string | null>(null);
  const reduce = useReducedMotion();

  return (
    <ul className="m-0 grid list-none grid-cols-[repeat(auto-fill,minmax(260px,1fr))] gap-6 p-0">
      {cards.map((card) => {
        const isSelected = selected === card.id;
        const tag = card.hasScript ? card.status : "NO_SCRIPT";
        const done = card.status === "INTERVIEWED";
        return (
          <li key={card.id} className="contents">
            <div
              className={`relative box-border flex aspect-square flex-col items-center justify-center gap-1.5 rounded-[20px] bg-surface px-6 pt-8 pb-7 text-center transition-colors ${
                isSelected ? "border-2 border-gold" : "border border-line hover:border-gold/50"
              }`}
            >
              <span className="absolute top-4 right-4">
                <StatusTag status={tag} />
              </span>

              <button
                type="button"
                onClick={() => setSelected(isSelected ? null : card.id)}
                aria-expanded={isSelected}
                aria-label={`${card.name}, ${card.position}. ${done ? "Interviewed" : "Pending"}.`}
                className="flex cursor-pointer flex-col items-center gap-1.5 border-none bg-transparent p-0 font-sans text-cream after:absolute after:inset-0 after:rounded-[20px] focus-visible:outline-none focus-visible:after:outline-2 focus-visible:after:outline-offset-2 focus-visible:after:outline-gold"
              >
                <motion.span
                  className="mb-2.5 block"
                  animate={{ scale: isSelected ? 56 / 72 : 1 }}
                  transition={{ duration: reduce ? 0 : 0.25, ease: "easeOut" }}
                >
                  <MemberAvatar size={72} />
                </motion.span>
                <span className="text-[22px] leading-[1.2] font-bold">{card.name}</span>
                {card.age !== null && <span className="text-sm text-cream/66">Age {card.age}</span>}
                <span className="text-[15px] font-semibold text-gold">{card.interest}</span>
                <span className="font-mono text-[12px] text-cream/66">{card.position}</span>
              </button>

              <AnimatePresence initial={false}>
                {isSelected && (
                  <motion.div
                    key="confirm"
                    initial={reduce ? false : { opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={reduce ? undefined : { opacity: 0, height: 0 }}
                    transition={{ duration: 0.22, ease: "easeOut" }}
                    className="relative z-10 w-full overflow-hidden"
                  >
                    <div className="mt-3.5 flex flex-col items-center gap-3 border-t border-line pt-4">
                      {card.hasScript ? (
                        <>
                          <span className="text-[15px] font-bold">
                            {done ? "Open this interview?" : "Start this interview?"}
                          </span>
                          <div className="flex gap-2.5">
                            <Link
                              href={`/activities/interviews/${card.id}/context`}
                              className="flex h-10 items-center rounded-[10px] bg-gold px-4 text-sm font-bold text-ink no-underline hover:opacity-90"
                            >
                              {done ? "Yes, open" : "Yes, start"}
                            </Link>
                            <button
                              type="button"
                              onClick={() => setSelected(null)}
                              className="h-10 cursor-pointer rounded-[10px] border border-line bg-transparent px-4 font-sans text-sm font-semibold text-cream hover:border-gold"
                            >
                              Not now
                            </button>
                          </div>
                        </>
                      ) : (
                        <span className="text-sm text-cream/66">The admin hasn&apos;t uploaded the script yet.</span>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </li>
        );
      })}
    </ul>
  );
};

export default FamilyGrid;
