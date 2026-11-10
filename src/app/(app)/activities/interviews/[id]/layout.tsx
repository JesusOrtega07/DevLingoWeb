import Link from "next/link";
import { notFound } from "next/navigation";

import MemberAvatar from "@/components/MemberAvatar";
import { idSchema } from "@/features/admin/schemas";
import { durationLabel, parseJob } from "@/features/interviews/context-view";
import HeaderAside from "@/features/interviews/components/HeaderAside";
import InterviewTabs from "@/features/interviews/components/InterviewTabs";
import { getMyInterview } from "@/features/interviews/queries";

// Encabezado común de la entrevista (mockups 04–07): volver, integrante, datos y pestañas.
// getMyInterview exige EXPERT y que la entrevista esté asignada a quien la pide.
const InterviewLayout = async ({ children, params }: LayoutProps<"/activities/interviews/[id]">) => {
  const { id } = await params;
  if (!idSchema.safeParse(id).success) notFound();
  const interview = await getMyInterview(id);

  const company = parseJob(interview.script.context.job)?.company;
  const duration = durationLabel(interview.script.script.closing.seconds);
  const meta = [company, duration].filter(Boolean).join(" · ");

  return (
    <>
      <section className="border-b border-line">
        <div className="mx-auto box-border flex max-w-[1440px] flex-col gap-6 px-6 pt-8 sm:px-10 lg:px-20">
          <Link href="/activities/interviews" className="self-start text-sm font-semibold text-gold no-underline hover:text-cream">
            ← Back to DevLingo Family
          </Link>
          <div className="flex flex-wrap items-center justify-between gap-6">
            <div className="flex items-center gap-5">
              <MemberAvatar size={64} />
              <div className="flex flex-col gap-1">
                <h1 className="m-0 text-[30px] leading-[1.15] font-extrabold">{interview.member.displayName}</h1>
                <span className="text-[15px] text-cream/70">
                  <span className="font-semibold text-gold">{interview.interest}</span> · {interview.position}
                </span>
              </div>
            </div>
            <HeaderAside interviewId={interview.id} meta={meta} totalSeconds={interview.script.script.closing.seconds} />
          </div>
          <InterviewTabs interviewId={interview.id} />
        </div>
      </section>
      {children}
    </>
  );
};

export default InterviewLayout;
