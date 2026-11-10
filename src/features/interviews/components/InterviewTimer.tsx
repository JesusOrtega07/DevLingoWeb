"use client";

import { useEffect, useState } from "react";

import { readSession, writeSession } from "@/lib/session-storage";

type Props = { interviewId: string; totalSeconds: number };

type TimerState = { baseMs: number; since: number | null };

const clock = (totalSeconds: number) => {
  const s = Math.max(0, Math.floor(totalSeconds));
  return `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
};

const iconButton =
  "flex h-11 w-11 cursor-pointer items-center justify-center rounded-xl focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold disabled:cursor-default";
const idle = `${iconButton} border border-line bg-transparent text-cream hover:border-gold/60`;
const active = `${iconButton} border-none bg-gold text-ink`;

// Cronómetro de la entrevista (mockup 05). Vive en el layout, así que sigue corriendo al
// cambiar de pestaña; se guarda en sessionStorage para sobrevivir a una recarga.
const InterviewTimer = ({ interviewId, totalSeconds }: Props) => {
  const key = `devlingo:timer:${interviewId}`;
  const [timer, setTimer] = useState<TimerState>({ baseMs: 0, since: null });
  const [now, setNow] = useState(0);

  useEffect(() => {
    const saved = readSession<TimerState>(key);
    // Carga única del estado guardado tras montar (sessionStorage no existe en el servidor).
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (saved && typeof saved.baseMs === "number") setTimer(saved);
    setNow(Date.now());
  }, [key]);

  useEffect(() => {
    if (timer.since === null) return;
    const id = window.setInterval(() => setNow(Date.now()), 250);
    return () => window.clearInterval(id);
  }, [timer.since]);

  const update = (next: TimerState) => {
    setTimer(next);
    setNow(Date.now());
    writeSession(key, next);
  };

  const elapsedMs = timer.baseMs + (timer.since === null ? 0 : Math.max(0, now - timer.since));
  const running = timer.since !== null;
  const over = totalSeconds > 0 && elapsedMs / 1000 > totalSeconds;

  return (
    <div className="flex items-center gap-4 rounded-2xl border border-line bg-surface py-2.5 pr-3 pl-[22px]">
      <div className="flex flex-col gap-0.5">
        <span className="font-mono text-[11px] tracking-[0.06em] text-cream/60">
          ELAPSED{totalSeconds > 0 && ` / ${clock(totalSeconds)}`}
        </span>
        <span
          role="timer"
          aria-live="off"
          className={`font-mono text-[32px] leading-[1.1] font-medium tabular-nums ${over ? "text-danger" : "text-gold"}`}
        >
          {clock(elapsedMs / 1000)}
        </span>
      </div>
      <div className="flex gap-1.5">
        <button
          type="button"
          aria-label="Play"
          disabled={running}
          className={running ? idle : active}
          onClick={() => update({ baseMs: timer.baseMs, since: Date.now() })}
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" aria-hidden="true">
            <path d="M4.5 3l8 5-8 5z" />
          </svg>
        </button>
        <button
          type="button"
          aria-label="Pause"
          disabled={!running}
          className={running ? active : idle}
          onClick={() => update({ baseMs: elapsedMs, since: null })}
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
            <path d="M5.5 3.5v9M10.5 3.5v9" />
          </svg>
        </button>
        <button type="button" aria-label="Reset" className={idle} onClick={() => update({ baseMs: 0, since: null })}>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M3 8a5 5 0 1 0 1.5-3.6" />
            <path d="M3 2.5v2.5h2.5" />
          </svg>
        </button>
      </div>
    </div>
  );
};

export default InterviewTimer;
