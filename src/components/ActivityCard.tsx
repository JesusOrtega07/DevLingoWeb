import Link from "next/link";

type Props = {
  href: string;
  label: string;
  title: string;
  description: string;
};

const ActivityCard = ({ href, label, title, description }: Props) => (
  <Link
    href={href}
    className="group flex flex-col gap-2 rounded-[20px] border border-line bg-surface p-6 transition-colors hover:border-gold/60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold"
  >
    <span className="font-mono text-[12px] tracking-[0.08em] text-gold">{label}</span>
    <span className="text-lg font-bold">{title}</span>
    <span className="text-[15px] leading-normal text-cream/66">{description}</span>
    <span className="mt-2 text-sm font-semibold text-gold transition-transform group-hover:translate-x-0.5">
      Open →
    </span>
  </Link>
);

export default ActivityCard;
