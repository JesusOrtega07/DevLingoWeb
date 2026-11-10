import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import Badge from "@/components/ui/Badge";
import PageHeader from "@/components/ui/PageHeader";
import Panel from "@/components/ui/Panel";
import ActiveToggleForm from "@/features/admin/components/ActiveToggleForm";
import EditUserForm from "@/features/admin/components/EditUserForm";
import InviteLinkForm from "@/features/admin/components/InviteLinkForm";
import { ROLE_LABEL, STATUS_LABEL, accountStatus, formatDate } from "@/features/admin/labels";
import { getUser } from "@/features/admin/queries";
import { idSchema } from "@/features/admin/schemas";
import { requireRole } from "@/lib/dal";

export const metadata: Metadata = { title: "Account · Admin · DevLingo" };

const Page = async ({ params }: PageProps<"/admin/users/[id]">) => {
  const admin = await requireRole("ADMIN");
  const { id } = await params;
  if (!idSchema.safeParse(id).success) notFound();
  const user = await getUser(id);
  if (!user) notFound();

  const status = accountStatus(user);
  const locked = user.lockedUntil && user.lockedUntil > new Date();

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        eyebrow={ROLE_LABEL[user.role]}
        title={user.name}
        description={user.email}
        actions={
          <div className="flex gap-2">
            <Badge tone={status.tone}>{status.label}</Badge>
            {locked && <Badge tone="danger">Locked (too many attempts)</Badge>}
          </div>
        }
      />

      <Panel title="Details">
        <EditUserForm
          userId={user.id}
          name={user.name}
          isMember={user.role === "MEMBER"}
          age={user.member?.age ?? null}
          interest={user.member?.interest ?? null}
        />
      </Panel>

      {user.member && (
        <Panel title="Interviews">
          {user.member.interviews.length === 0 ? (
            <p className="m-0 text-sm text-cream/66">No interviews yet.</p>
          ) : (
            <ul className="m-0 flex list-none flex-col gap-2 p-0">
              {user.member.interviews.map((i) => (
                <li key={i.id} className="flex items-center justify-between gap-3">
                  <Link href={`/admin/interviews/${i.id}`} className="font-semibold text-cream hover:text-gold">
                    {i.position}
                  </Link>
                  <Badge tone={i.status === "INTERVIEWED" ? "cream" : "gold"}>{STATUS_LABEL[i.status]}</Badge>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      )}

      <Panel
        title="Access"
        description={
          user.hasPassword
            ? "A reset link lets the person choose a new password. Using it signs out their other sessions."
            : "The person hasn't set a password yet. Create a new link if the previous one expired."
        }
      >
        <InviteLinkForm userId={user.id} hasPassword={user.hasPassword} disabled={!user.isActive} />
        <div className="border-t border-line pt-5">
          <ActiveToggleForm userId={user.id} isActive={user.isActive} isSelf={user.id === admin.id} />
        </div>
        <p className="m-0 font-mono text-[12px] text-cream/50">
          Created {formatDate(user.createdAt)} · {user._count.sessions} session(s) on record
        </p>
      </Panel>
    </div>
  );
};

export default Page;
