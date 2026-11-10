type Props = { status: "PENDING" | "INTERVIEWED" | "NO_SCRIPT" };

// Etiqueta de estado de las tarjetas (mockup 02): Pending gris crema, Interviewed verde.
const STYLES = {
  PENDING: { label: "Pending", className: "bg-cream/7 text-cream/72" },
  INTERVIEWED: { label: "Interviewed", className: "bg-[rgba(127,181,142,0.16)] text-[#8CC79F]" },
  NO_SCRIPT: { label: "No script yet", className: "bg-danger/10 text-danger" },
} as const;

const StatusTag = ({ status }: Props) => (
  <span
    className={`rounded-full px-2.5 py-1 font-mono text-[11px] tracking-[0.04em] whitespace-nowrap ${STYLES[status].className}`}
  >
    {STYLES[status].label}
  </span>
);

export default StatusTag;
