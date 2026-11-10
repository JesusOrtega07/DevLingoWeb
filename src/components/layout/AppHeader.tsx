import Link from "next/link";

import LogoMark from "@/components/LogoMark";
import SectionLabel from "@/components/layout/SectionLabel";
import { logout } from "@/features/auth/actions";
import type { SessionUser } from "@/features/auth/session";

const ROLE_LABEL: Record<SessionUser["role"], string> = {
  ADMIN: "Admin",
  EXPERT: "English Expert",
  MEMBER: "Member",
};

type Props = { user: Pick<SessionUser, "name" | "role"> };

// Encabezado según los mockups 02–07 (alto 76, borde inferior #2A2A30).
const AppHeader = ({ user }: Props) => (
  <header className="border-b border-line">
    <div className="mx-auto flex min-h-[76px] max-w-[1440px] flex-wrap items-center justify-between gap-4 px-6 sm:px-10 lg:px-20">
      <Link href="/" className="flex items-center gap-3 text-cream no-underline" aria-label="DevLingo home">
        <LogoMark />
        <span className="text-base font-bold">
          DevLingo <SectionLabel />
        </span>
      </Link>

      <div className="flex items-center gap-4">
        <span className="text-sm font-semibold">
          {user.name} <span className="font-medium text-cream/60">· {ROLE_LABEL[user.role]}</span>
        </span>
        <form action={logout}>
          <button
            type="submit"
            className="h-10 cursor-pointer rounded-[10px] border border-line bg-transparent px-[18px] font-sans text-sm font-semibold text-cream transition-colors hover:border-gold hover:text-gold"
          >
            Sign out
          </button>
        </form>
      </div>
    </div>
  </header>
);

export default AppHeader;
