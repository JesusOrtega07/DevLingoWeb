"use client";

import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

type Props = { name: string; position: string };

// Aviso "Evaluation saved" del mockup 08. Se oculta solo y limpia ?saved= de la URL.
const SavedToast = ({ name, position }: Props) => {
  const [open, setOpen] = useState(true);
  const reduce = useReducedMotion();
  const pathname = usePathname();

  useEffect(() => {
    // history.replaceState (soportado por Next) quita ?saved sin volver a pedir la página;
    // router.replace la volvería a renderizar sin el aviso y lo desmontaría al instante.
    window.history.replaceState(null, "", pathname);
    const timer = setTimeout(() => setOpen(false), 5000);
    return () => clearTimeout(timer);
  }, [pathname]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          role="status"
          initial={reduce ? false : { opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={reduce ? undefined : { opacity: 0, y: -12 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
          className="fixed top-[100px] right-6 z-50 flex items-center gap-3.5 rounded-[14px] border border-[rgba(127,181,142,0.45)] bg-surface px-5 py-4 shadow-[0_12px_32px_rgba(0,0,0,0.35)] sm:right-10 lg:right-20"
        >
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[rgba(127,181,142,0.16)]">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="#8CC79F" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M3 8.5l3.2 3L13 4.5" />
            </svg>
          </span>
          <span className="flex flex-col gap-0.5">
            <span className="text-[15px] font-bold">Evaluation saved</span>
            <span className="font-mono text-[12px] text-cream/60">
              {name} · {position}
            </span>
          </span>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default SavedToast;
