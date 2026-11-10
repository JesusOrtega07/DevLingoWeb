import type { Metadata } from "next";
import Link from "next/link";

import PageHeader from "@/components/ui/PageHeader";
import { getOverview } from "@/features/admin/queries";

export const metadata: Metadata = { title: "Admin · DevLingo" };

const Stat = ({ label, value, href }: { label: string; value: number; href: string }) => (
  <Link
    href={href}
    className="flex flex-col gap-1 rounded-[20px] border border-line bg-surface p-6 transition-colors hover:border-gold/60"
  >
    <span className="font-mono text-[28px] font-medium text-gold">{value}</span>
    <span className="text-sm text-cream/66">{label}</span>
  </Link>
);

const Page = async () => {
  const o = await getOverview();

  return (
    <div className="flex flex-col gap-8">
      <PageHeader eyebrow="Admin" title="Admin panel" description="Accounts, members, interviews and assignments." />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Stat label="Accounts" value={o.users} href="/admin/users" />
        <Stat label="Members" value={o.members} href="/admin/users" />
        <Stat label="Interviews" value={o.interviews} href="/admin/interviews" />
        <Stat label="Pending interviews" value={o.pending} href="/admin/interviews" />
        <Stat label="Without an English Expert" value={o.unassigned} href="/admin/interviews" />
        <Stat label="Without a script" value={o.withoutScript} href="/admin/interviews" />
      </div>
    </div>
  );
};

export default Page;
