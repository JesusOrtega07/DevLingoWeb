import type { ReactNode } from "react";

type Props = {
  eyebrow: string;
  title: string;
  description?: string;
  actions?: ReactNode;
};

const PageHeader = ({ eyebrow, title, description, actions }: Props) => (
  <div className="flex flex-wrap items-end justify-between gap-4">
    <div className="flex flex-col gap-1.5">
      <p className="m-0 font-mono text-[13px] tracking-[0.08em] text-gold">&lt; {eyebrow} /&gt;</p>
      <h1 className="m-0 text-[26px] leading-[1.25] font-bold">{title}</h1>
      {description && <p className="m-0 text-[15px] leading-normal text-cream/66">{description}</p>}
    </div>
    {actions}
  </div>
);

export default PageHeader;
