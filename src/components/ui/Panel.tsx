import type { ReactNode } from "react";

type Props = {
  title?: string;
  description?: string;
  children: ReactNode;
  className?: string;
};

// Tarjeta con los valores del mockup 01 (fondo #1E1E22, borde #2A2A30, radio 20).
const Panel = ({ title, description, children, className = "" }: Props) => (
  <section className={`flex flex-col gap-5 rounded-[20px] border border-line bg-surface p-6 sm:p-8 ${className}`}>
    {(title || description) && (
      <div className="flex flex-col gap-1">
        {title && <h2 className="m-0 text-lg font-bold">{title}</h2>}
        {description && <p className="m-0 text-sm leading-normal text-cream/66">{description}</p>}
      </div>
    )}
    {children}
  </section>
);

export default Panel;
