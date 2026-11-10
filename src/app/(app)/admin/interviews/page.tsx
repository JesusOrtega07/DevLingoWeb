import type { Metadata } from "next";
import Link from "next/link";

import Badge from "@/components/ui/Badge";
import PageHeader from "@/components/ui/PageHeader";
import Panel from "@/components/ui/Panel";
import CreateInterviewForm from "@/features/admin/components/CreateInterviewForm";
import { STATUS_LABEL } from "@/features/admin/labels";
import { listInterviews, listMembersForSelect } from "@/features/admin/queries";

export const metadata: Metadata = { title: "Interviews · Admin · DevLingo" };

const Page = async () => {
  const [interviews, members] = await Promise.all([listInterviews(), listMembersForSelect()]);

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        eyebrow="Interviews"
        title="Interviews"
        description="Create an interview, upload its .md script and assign an English Expert."
      />

      <Panel title="New interview">
        <CreateInterviewForm members={members} />
      </Panel>

      <Panel title={`All interviews (${interviews.length})`}>
        {interviews.length === 0 ? (
          <p className="m-0 text-sm text-cream/66">No interviews yet.</p>
        ) : (
          <div className="-mx-6 overflow-x-auto sm:-mx-8">
            <table className="w-full min-w-[680px] border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-line text-cream/60">
                  <th className="px-6 py-3 font-semibold sm:pl-8">Member</th>
                  <th className="px-3 py-3 font-semibold">Position</th>
                  <th className="px-3 py-3 font-semibold">English Expert</th>
                  <th className="px-3 py-3 font-semibold">Script</th>
                  <th className="px-6 py-3 font-semibold sm:pr-8">Status</th>
                </tr>
              </thead>
              <tbody>
                {interviews.map((i) => (
                  <tr key={i.id} className="border-b border-line last:border-b-0">
                    <td className="px-6 py-3 sm:pl-8">
                      <Link href={`/admin/interviews/${i.id}`} className="font-semibold text-cream hover:text-gold">
                        {i.member.displayName}
                      </Link>
                    </td>
                    <td className="px-3 py-3">{i.position}</td>
                    <td className="px-3 py-3">
                      {i.assignment ? i.assignment.expert.name : <Badge tone="danger">Unassigned</Badge>}
                    </td>
                    <td className="px-3 py-3">
                      {i.currentScript ? (
                        <span className="font-mono text-[13px] text-cream/80">v{i.currentScript.version}</span>
                      ) : (
                        <Badge tone="danger">Missing</Badge>
                      )}
                    </td>
                    <td className="px-6 py-3 sm:pr-8">
                      <Badge tone={i.status === "INTERVIEWED" ? "cream" : "gold"}>{STATUS_LABEL[i.status]}</Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Panel>
    </div>
  );
};

export default Page;
