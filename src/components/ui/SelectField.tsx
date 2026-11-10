import type { SelectHTMLAttributes } from "react";

type Option = { value: string; label: string };

type Props = SelectHTMLAttributes<HTMLSelectElement> & {
  id: string;
  label: string;
  options: Option[];
  placeholder?: string;
  errors?: string[];
};

const SelectField = ({ id, label, options, placeholder, errors, ...props }: Props) => {
  const errorId = errors?.length ? `${id}-error` : undefined;
  return (
    <div className="flex flex-col gap-2">
      <label htmlFor={id} className="text-sm font-semibold">
        {label}
      </label>
      <select
        id={id}
        {...props}
        aria-invalid={errorId ? true : undefined}
        aria-describedby={errorId}
        className="h-12 cursor-pointer rounded-xl border border-line bg-ink px-4 font-sans text-[15px] text-cream outline-none transition-colors focus:border-gold aria-invalid:border-danger"
      >
        {placeholder !== undefined && <option value="">{placeholder}</option>}
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      {errorId && (
        <p id={errorId} className="m-0 text-[13px] leading-snug text-danger">
          {errors?.[0]}
        </p>
      )}
    </div>
  );
};

export default SelectField;
