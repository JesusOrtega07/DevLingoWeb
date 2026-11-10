"use client";

import { usePathname } from "next/navigation";

import InterviewTimer from "@/features/interviews/components/InterviewTimer";

type Props = { interviewId: string; meta: string; totalSeconds: number };

// Lado derecho del encabezado: el cronómetro en la pestaña Script y los datos de la
// entrevista en las demás. El cronómetro solo se oculta, para que no se reinicie.
const HeaderAside = ({ interviewId, meta, totalSeconds }: Props) => {
  const onScript = usePathname().endsWith("/script");
  return (
    <>
      <div hidden={!onScript}>
        <InterviewTimer interviewId={interviewId} totalSeconds={totalSeconds} />
      </div>
      {!onScript && meta && <span className="font-mono text-[13px] text-cream/60">{meta}</span>}
    </>
  );
};

export default HeaderAside;
