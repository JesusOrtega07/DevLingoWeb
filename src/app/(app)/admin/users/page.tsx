import type { Metadata } from "next";
import Link from "next/link";

import Badge from "@/components/ui/Badge";
import PageHeader from "@/components/ui/PageHeader";
import Panel from "@/components/ui/Panel";
import CreateUserForm from "@/features/admin/components/CreateUserForm";
import { ROLE_LABEL, accountStatus } from "@/features/admin/labels";
import { listUsers } from "@/features/admin/queries";

export const metadata: Metadata = { title: "Accounts · Admin · DevLingo" };

const Page = async () => {
  const users = await listUsers();

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        eyebrow="Accounts"
        title="Accounts"
        description="There is no public sign-up: create the account here and send the person their invitation link."
      />

      <Panel title="New account">
        <CreateUserForm />
      </Panel>

      <Panel title={`All accounts (${users.length})`}>
        <div className="-mx-6 overflow-x-auto sm:-mx-8">
          <table className="w-full min-w-[640px] border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-line text-cream/60">
                <th className="px-6 py-3 font-semibold sm:pl-8">Name</th>
                <th className="px-3 py-3 font-semibold">Email</th>
                <th className="px-3 py-3 font-semibold">Role</th>
                <th className="px-3 py-3 font-semibold">Age</th>
                <th className="px-6 py-3 font-semibold sm:pr-8">Status</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => {
                const status = accountStatus(user);
                return (
                  <tr key={user.id} className="border-b border-line last:border-b-0">
                    <td className="px-6 py-3 sm:pl-8">
                      <Link href={`/admin/users/${user.id}`} className="font-semibold text-cream hover:text-gold">
                        {user.name}
                      </Link>
                    </td>
                    <td className="px-3 py-3 font-mono text-[13px] text-cream/80">{user.email}</td>
                    <td className="px-3 py-3">{ROLE_LABEL[user.role]}</td>
                    <td className="px-3 py-3 text-cream/80">{user.member?.age ?? "—"}</td>
                    <td className="px-6 py-3 sm:pr-8">
                      <Badge tone={status.tone}>{status.label}</Badge>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Panel>
    </div>
  );
};

export default Page;
