import type { ButtonHTMLAttributes } from "react";

type Props = ButtonHTMLAttributes<HTMLButtonElement> & { pending?: boolean };

// Botón dorado del mockup 01 (alto 52, radio 12, texto 16 bold).
const PrimaryButton = ({ pending, children, className = "", ...props }: Props) => (
  <button
    {...props}
    disabled={pending || props.disabled}
    aria-busy={pending || undefined}
    className={`h-[52px] cursor-pointer rounded-xl border-none bg-gold font-sans text-base font-bold text-ink transition-opacity hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold disabled:cursor-wait disabled:opacity-70 ${className}`}
  >
    {children}
  </button>
);

export default PrimaryButton;
