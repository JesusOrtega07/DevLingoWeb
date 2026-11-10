import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import Badge from "@/components/ui/Badge";
import PageHeader from "@/components/ui/PageHeader";
import Panel from "@/components/ui/Panel";
import AssignExpertForm from "@/features/admin/components/AssignExpertForm";
import ScriptUploader from "@/features/admin/components/ScriptUploader";
import { STATUS_LABEL, formatDate } from "@/features/admin/labels";
import { getInterview, listActiveExperts } from "@/features/admin/queries";
import { idSchema } from "@/features/admin/schemas";
import { requireRole } from "@/lib/dal";

export const metadata: Metadata = { title: "Interview · Admin · DevLingo" };

const Page = async ({ params }: PageProps<"/admin/interviews/[id]">) => {
  await requireRole("ADMIN");
  const { id } = await params;
  if (!idSchema.safeParse(id).success) notFound();
  const [interview, experts] = await Promise.all([getInterview(id), listActiveExperts()]);
  if (!interview) notFound();

  // Si la expert asignada fue desactivada, igual se muestra como opción actual.
  const assignedName = interview.assignment?.expert.name;
  const expertOptions =
    interview.assignment && !experts.some((e) => e.id === interview.assignment?.expertId)
      ? [...experts, { id: interview.assignment.expertId, name: `${assignedName} (inactive)` }]
      : experts;
  const nextVersion = (interview.scripts[0]?.version ?? 0) + 1;

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        eyebrow="Interview"
        title={`${interview.member.displayName} · ${interview.position}`}
        description={`Interest: ${interview.interest}${interview.member.age ? ` · Age ${interview.member.age}` : ""}`}
        actions={
          <Badge tone={interview.status === "INTERVIEWED" ? "cream" : "gold"}>{STATUS_LABEL[interview.status]}</Badge>
        }
      />

      <Panel
        title="English Expert"
        description={
          interview.evaluation
            ? `Evaluation saved ${formatDate(interview.evaluation.savedAt)}. Changing the expert lets the new one edit it.`
            : "Only the assigned English Expert can open and score this interview."
        }
      >
        <AssignExpertForm
          interviewId={interview.id}
          currentExpertId={interview.assignment?.expertId ?? null}
          experts={expertOptions}
        />
      </Panel>

      <Panel
        title={interview.scripts.length ? "Replace the script" : "Upload the script"}
        description="The file must follow templates/interview-template.md. You'll see a preview before saving; every upload becomes a new version."
      >
        <ScriptUploader interviewId={interview.id} nextVersion={nextVersion} />
      </Panel>

      <Panel title="Script versions">
        {interview.scripts.length === 0 ? (
          <p className="m-0 text-sm text-cream/66">No script yet. The English Expert can&apos;t start without one.</p>
        ) : (
          <ul className="m-0 flex list-none flex-col p-0">
            {interview.scripts.map((s) => (
              <li
                key={s.id}
                className="flex flex-wrap items-center justify-between gap-3 border-b border-line py-3 last:border-b-0"
              >
                <div className="flex flex-col gap-0.5">
                  <span className="flex items-center gap-2 font-semibold">
                    <span className="font-mono text-gold">v{s.version}</span> {s.fileName}
                    {s.id === interview.currentScriptId && <Badge tone="gold">Current</Badge>}
                  </span>
                  <span className="text-[13px] text-cream/60">
                    {formatDate(s.createdAt)} · {s.uploadedBy.name}
                  </span>
                </div>
                <Link
                  href={`/admin/interviews/${interview.id}/scripts/${s.id}`}
                  className="text-sm font-semibold text-gold hover:text-cream"
                >
                  View original
                </Link>
              </li>
            ))}
          </ul>
        )}
      </Panel>
    </div>
  );
};

export default Page;
