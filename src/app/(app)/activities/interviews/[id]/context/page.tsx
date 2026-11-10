import type { Metadata } from "next";

import FadeIn from "@/components/FadeIn";
import PageContainer from "@/components/layout/PageContainer";
import InlineText from "@/features/scripts/components/InlineText";
import BlockText from "@/features/scripts/components/BlockText";
import { parseJob, splitCandidate, splitRole, splitRule } from "@/features/interviews/context-view";
import QuoteText from "@/features/interviews/components/QuoteText";
import { getMyInterview } from "@/features/interviews/queries";

export const metadata: Metadata = { title: "Context · Interview · DevLingo" };

const Eyebrow = ({ children }: { children: string }) => (
  <span className="font-mono text-[13px] tracking-[0.06em] text-gold">{children}</span>
);

// Pestaña Context (mockup 04).
const Page = async ({ params }: PageProps<"/activities/interviews/[id]/context">) => {
  const { id } = await params;
  const interview = await getMyInterview(id);
  const { context, meta } = interview.script;

  const job = parseJob(context.job);
  const candidate = splitCandidate(context.candidate, interview.member.displayName);
  const role = splitRole(context.role);

  return (
    <PageContainer className="flex flex-col gap-6">
      <FadeIn className="flex flex-wrap items-stretch gap-6">
        <article className="box-border flex min-w-0 flex-[999_1_560px] flex-col gap-5 rounded-[20px] border border-line bg-surface p-6 sm:p-9">
          <Eyebrow>01 // the job</Eyebrow>
          <h2 className="m-0 text-[28px] leading-[1.2] font-extrabold">{meta.interview}</h2>
          {job && job.chips.length > 0 && (
            <ul className="m-0 flex list-none flex-wrap gap-2 p-0">
              {job.chips.map((chip) => (
                <li key={chip} className="rounded-full border border-line px-3 py-1.5 font-mono text-[12px]">
                  {chip}
                </li>
              ))}
            </ul>
          )}
          {job?.description ? (
            <p className="m-0 text-base leading-[1.65] text-cream/80">{job.description}</p>
          ) : (
            context.job && (
              <p className="m-0 text-base leading-[1.65] text-cream/80">
                <InlineText nodes={context.job} />
              </p>
            )
          )}
          {job && job.skills.length > 0 && (
            <div className="flex flex-col gap-2.5">
              <span className="text-[13px] font-bold tracking-[0.04em] text-cream/60 uppercase">Key skills</span>
              <ul className="m-0 flex list-none flex-wrap gap-2 p-0">
                {job.skills.map((skill) => (
                  <li key={skill} className="rounded-[10px] bg-gold/12 px-3.5 py-2 text-sm font-semibold text-gold">
                    {skill}
                  </li>
                ))}
              </ul>
            </div>
          )}
          {job?.requires && (
            <p className="m-0 border-t border-line pt-4 text-[15px] leading-normal">
              <span className="font-bold">Requires:</span> <span className="text-cream/80">{job.requires}</span>
            </p>
          )}
        </article>

        <div className="flex min-w-0 flex-[1_1_380px] flex-col gap-6">
          <article className="box-border flex flex-1 flex-col gap-3.5 rounded-[20px] border border-line bg-surface p-6 sm:p-8">
            <Eyebrow>02 // the candidate</Eyebrow>
            <h2 className="m-0 text-[22px] leading-[1.25] font-extrabold">{candidate.heading}</h2>
            {candidate.body && <p className="m-0 text-[15px] leading-[1.65] text-cream/80">{candidate.body}</p>}
          </article>
          <article className="box-border flex flex-1 flex-col gap-3.5 rounded-[20px] border border-line bg-surface p-6 sm:p-8">
            <Eyebrow>03 // your role</Eyebrow>
            {role.heading && <h2 className="m-0 text-[22px] leading-[1.25] font-extrabold">{role.heading}</h2>}
            {role.body && <p className="m-0 text-[15px] leading-[1.65] text-cream/80">{role.body}</p>}
          </article>
        </div>
      </FadeIn>

      {context.rules.length > 0 && (
        <FadeIn delay={0.06}>
          <article className="box-border flex flex-col gap-5 rounded-[20px] border border-line bg-surface p-6 sm:p-9">
            <Eyebrow>04 // rules</Eyebrow>
            <ul className="m-0 flex list-none flex-col p-0">
              {context.rules.map((rule, i) => {
                const { label, body } = splitRule(rule);
                return (
                  <li
                    key={i}
                    className={`grid gap-2 border-t border-line pt-[18px] sm:grid-cols-3 sm:items-baseline sm:gap-6 ${
                      i === context.rules.length - 1 ? "" : "pb-[18px]"
                    }`}
                  >
                    {label && <span className="text-base font-bold">{label}</span>}
                    <span className={`text-base leading-normal text-cream/80 ${label ? "sm:col-span-2" : "sm:col-span-3"}`}>
                      <QuoteText nodes={body} />
                    </span>
                  </li>
                );
              })}
            </ul>
          </article>
        </FadeIn>
      )}

      {context.notes.length > 0 && (
        <article className="box-border flex flex-col gap-3 rounded-[20px] border border-line bg-surface p-6 text-[15px] leading-[1.65] text-cream/80 sm:p-9">
          <Eyebrow>05 // notes</Eyebrow>
          <BlockText blocks={context.notes} />
        </article>
      )}
    </PageContainer>
  );
};

export default Page;
