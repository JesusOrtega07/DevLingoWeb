import type { ReactNode } from "react";

type Tone = "gold" | "cream" | "muted" | "danger";

const TONES: Record<Tone, string> = {
  gold: "border-gold/50 text-gold",
  cream: "border-cream/40 text-cream",
  muted: "border-line text-cream/60",
  danger: "border-danger/50 text-danger",
};

type Props = { tone?: Tone; children: ReactNode };

const Badge = ({ tone = "muted", children }: Props) => (
  <span className={`inline-flex h-6 items-center rounded-full border px-2.5 font-mono text-[12px] whitespace-nowrap ${TONES[tone]}`}>
    {children}
  </span>
);

export default Badge;
