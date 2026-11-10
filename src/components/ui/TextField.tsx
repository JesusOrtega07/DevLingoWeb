import type { InputHTMLAttributes } from "react";

type Props = InputHTMLAttributes<HTMLInputElement> & {
  id: string;
  label: string;
  errors?: string[];
};

// Campo de texto con los valores del mockup 01 (alto 48, radio 12, borde #2A2A30).
const TextField = ({ id, label, errors, "aria-describedby": describedBy, ...inputProps }: Props) => {
  const errorId = errors?.length ? `${id}-error` : undefined;
  const describedByIds = [describedBy, errorId].filter(Boolean).join(" ") || undefined;
  return (
    <div className="flex flex-col gap-2">
      <label htmlFor={id} className="text-sm font-semibold">
        {label}
      </label>
      <input
        id={id}
        {...inputProps}
        aria-invalid={errorId ? true : undefined}
        aria-describedby={describedByIds}
        className="h-12 rounded-xl border border-line bg-ink px-4 font-sans text-[15px] text-cream outline-none transition-colors placeholder:text-cream/40 focus:border-gold aria-invalid:border-danger"
      />
      {errorId && (
        <p id={errorId} className="m-0 text-[13px] leading-snug text-danger">
          {errors?.[0]}
        </p>
      )}
    </div>
  );
};

export default TextField;
