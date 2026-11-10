import Link from "next/link";

import FadeIn from "@/components/FadeIn";
import PageContainer from "@/components/layout/PageContainer";
import { listMyFeedback } from "@/features/feedback/queries";
import { formatDate } from "@/lib/format";

const ReadyTag = () => (
  <span className="rounded-full bg-[rgba(127,181,142,0.16)] px-2.5 py-1 font-mono text-[11px] tracking-[0.04em] whitespace-nowrap text-[#8CC79F]">
    Feedback ready
  </span>
);

const WaitingTag = () => (
  <span className="rounded-full bg-cream/7 px-2.5 py-1 font-mono text-[11px] tracking-[0.04em] whitespace-nowrap text-cream/72">
    Waiting for feedback
  </span>
);

// Vista del member: sus entrevistas. Solo las que ya tienen feedback guardado se pueden abrir.
const MemberInterviews = async () => {
  const interviews = await listMyFeedback();
  const ready = interviews.filter((i) => i.feedbackAt).length;

  return (
    <PageContainer className="flex flex-col gap-10 lg:pt-16">
      <FadeIn className="flex flex-wrap items-end justify-between gap-6">
        <div className="flex flex-col gap-3">
          <span className="font-mono text-[13px] tracking-[0.06em] text-gold">&lt;my-interviews /&gt;</span>
          <h1 className="m-0 text-[36px] leading-[1.08] font-extrabold tracking-[-0.02em] sm:text-[52px]">
            Your interviews
          </h1>
          <p className="m-0 text-lg leading-normal text-cream/70">Read the feedback from your mock interviews.</p>
        </div>
        <span className="font-mono text-[13px] text-cream/60">
          {`// ${interviews.length} ${interviews.length === 1 ? "interview" : "interviews"} · ${ready} with feedback`}
        </span>
      </FadeIn>

      {interviews.length === 0 ? (
        <p className="m-0 rounded-[20px] border border-line bg-surface p-8 text-[15px] text-cream/66">
          You don&apos;t have interviews yet. When one is scheduled, it will show up here.
        </p>
      ) : (
        <FadeIn delay={0.06}>
          <ul className="m-0 grid list-none grid-cols-[repeat(auto-fill,minmax(min(100%,320px),1fr))] gap-6 p-0">
            {interviews.map((i) => {
              const body = (
                <>
                  <div className="flex items-start justify-between gap-3">
                    <span className="text-[15px] font-semibold text-gold">{i.interest}</span>
                    {i.feedbackAt ? <ReadyTag /> : <WaitingTag />}
                  </div>
                  <span className="text-[22px] leading-[1.2] font-bold">{i.position}</span>
                  <span className="font-mono text-[12px] text-cream/60">
                    {i.feedbackAt
                      ? `${i.expertName ? `by ${i.expertName} · ` : ""}${formatDate(i.feedbackAt)}`
                      : "Your English Expert will share it after the interview."}
                  </span>
                  {i.feedbackAt && <span className="mt-auto pt-4 text-sm font-bold text-gold">Read feedback →</span>}
                </>
              );
              const box = "box-border flex h-full min-h-[200px] flex-col gap-2 rounded-[20px] border bg-surface p-7";
              return (
                <li key={i.id}>
                  {i.feedbackAt ? (
                    <Link
                      href={`/activities/interviews/feedback/${i.id}`}
                      className={`${box} border-line text-cream no-underline transition-colors hover:border-gold/60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold`}
                    >
                      {body}
                    </Link>
                  ) : (
                    <div className={`${box} border-line opacity-80`}>{body}</div>
                  )}
                </li>
              );
            })}
          </ul>
        </FadeIn>
      )}
    </PageContainer>
  );
};

export default MemberInterviews;
