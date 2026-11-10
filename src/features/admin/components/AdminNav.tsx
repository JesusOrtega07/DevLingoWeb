"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  { href: "/admin", label: "Overview", exact: true },
  { href: "/admin/users", label: "Accounts", exact: false },
  { href: "/admin/interviews", label: "Interviews", exact: false },
];

const AdminNav = () => {
  const pathname = usePathname();
  return (
    <nav aria-label="Admin" className="flex gap-1 overflow-x-auto border-b border-line">
      {LINKS.map(({ href, label, exact }) => {
        const active = exact ? pathname === href : pathname.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            aria-current={active ? "page" : undefined}
            className={`-mb-px border-b-2 px-3 py-2.5 text-sm font-semibold whitespace-nowrap transition-colors ${
              active ? "border-gold text-gold" : "border-transparent text-cream/66 hover:text-cream"
            }`}
          >
            {label}
          </Link>
        );
      })}
    </nav>
  );
};

export default AdminNav;
