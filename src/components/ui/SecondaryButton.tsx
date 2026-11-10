import type { ButtonHTMLAttributes } from "react";

type Props = ButtonHTMLAttributes<HTMLButtonElement> & { pending?: boolean; tone?: "default" | "danger" };

const SecondaryButton = ({ pending, tone = "default", children, className = "", ...props }: Props) => (
  <button
    {...props}
    disabled={pending || props.disabled}
    aria-busy={pending || undefined}
    className={`h-10 cursor-pointer rounded-xl border bg-transparent px-4 font-sans text-sm font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold disabled:cursor-not-allowed disabled:opacity-60 ${
      tone === "danger"
        ? "border-danger/50 text-danger hover:border-danger hover:bg-danger/10"
        : "border-line text-cream hover:border-gold hover:text-gold"
    } ${className}`}
  >
    {children}
  </button>
);

export default SecondaryButton;
