"use client";

import { useState } from "react";

type Props = { label: string; value: string };

// Campo de solo lectura con botón para copiar (p. ej. un enlace de invitación).
const CopyField = ({ label, value }: Props) => {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  };

  return (
    <div className="flex flex-col gap-2">
      <span className="text-sm font-semibold">{label}</span>
      <div className="flex gap-2">
        <input
          readOnly
          value={value}
          aria-label={label}
          onFocus={(e) => e.currentTarget.select()}
          className="h-12 min-w-0 flex-1 rounded-xl border border-line bg-ink px-4 font-mono text-[13px] text-cream outline-none focus:border-gold"
        />
        <button
          type="button"
          onClick={copy}
          className="h-12 shrink-0 cursor-pointer rounded-xl border-none bg-gold px-4 font-sans text-sm font-bold text-ink hover:opacity-90"
        >
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
      <p className="m-0 text-[13px] text-cream/60">Valid for 72 hours and only once. It won&apos;t be shown again.</p>
    </div>
  );
};

export default CopyField;
