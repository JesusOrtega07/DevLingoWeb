"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  { slug: "context", label: "Context" },
  { slug: "script", label: "Script" },
  { slug: "score-sheet", label: "Score sheet" },
  { slug: "files", label: "Files" },
];

type Props = { interviewId: string };

// Pestañas de la entrevista (mockups 04–07). Cada una es su propia ruta.
const InterviewTabs = ({ interviewId }: Props) => {
  const pathname = usePathname();
  return (
    <nav aria-label="Interview sections" className="flex flex-wrap gap-x-8 gap-y-1">
      {TABS.map(({ slug, label }) => {
        const href = `/activities/interviews/${interviewId}/${slug}`;
        const active = pathname === href;
        return (
          <Link
            key={slug}
            href={href}
            aria-current={active ? "page" : undefined}
            className={`border-b-2 pt-3 pb-3.5 text-[15px] no-underline transition-colors ${
              active ? "border-gold font-bold text-cream" : "border-transparent font-semibold text-cream/60 hover:text-cream"
            }`}
          >
            {label}
          </Link>
        );
      })}
    </nav>
  );
};

export default InterviewTabs;
