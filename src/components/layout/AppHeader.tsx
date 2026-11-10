import Image from "next/image";
import Link from "next/link";

import { logout } from "@/features/auth/actions";
import type { SessionUser } from "@/features/auth/session";

const ROLE_LABEL: Record<SessionUser["role"], string> = {
  ADMIN: "Admin",
  EXPERT: "English Expert",
  MEMBER: "Member",
};

type Props = { user: Pick<SessionUser, "name" | "role"> };

const AppHeader = ({ user }: Props) => (
  <header className="border-b border-line">
    <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between gap-4 px-6">
      <Link href="/" className="flex items-center" aria-label="DevLingo home">
        <Image src="/logo.svg" alt="DevLingo Community" width={56} height={45} unoptimized />
      </Link>

      <div className="flex items-center gap-4">
        <div className="flex flex-col items-end leading-tight">
          <span className="text-sm font-semibold">{user.name}</span>
          <span className="font-mono text-[12px] text-gold">{ROLE_LABEL[user.role]}</span>
        </div>
        <form action={logout}>
          <button
            type="submit"
            className="h-9 cursor-pointer rounded-lg border border-line bg-transparent px-3 font-sans text-[13px] font-semibold text-cream transition-colors hover:border-gold hover:text-gold"
          >
            Sign out
          </button>
        </form>
      </div>
    </div>
  </header>
);

export default AppHeader;
