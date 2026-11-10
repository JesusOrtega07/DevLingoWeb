"use client";

import { usePathname } from "next/navigation";

// Nombre de la sección junto a "DevLingo" en el encabezado (mockup: "DevLingo Interviews").
const SectionLabel = () => {
  const pathname = usePathname();
  const label = pathname.startsWith("/activities/interviews")
    ? "Interviews"
    : pathname.startsWith("/admin")
      ? "Admin"
      : "Community";
  return <span className="font-medium text-cream/60">{label}</span>;
};

export default SectionLabel;
