import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import FadeIn from "@/components/FadeIn";
import PageContainer from "@/components/layout/PageContainer";
import SiteFooter from "@/components/layout/SiteFooter";
import { idSchema } from "@/features/admin/schemas";
import { AREA_FIELDS } from "@/features/evaluations/schemas";
import { getMyFeedback } from "@/features/feedback/queries";
import { SCORE_AREAS } from "@/features/scripts/types";
import { formatDate } from "@/lib/format";

export const metadata: Metadata = { title: "Feedback · Interviews · DevLingo" };

const NEXT_ROUND = { YES: "Yes", MAYBE: "Maybe", NO: "No" } as const;

const card = "box-border flex flex-col gap-3.5 rounded-[20px] border border-line bg-surface p-6 sm:px-8 sm:py-7";
const h2 = "m-0 text-[22px] leading-[1.25] font-extrabold";
// El texto es libre (escrito por la expert): se respeta el salto de línea y nunca se interpreta como HTML.
const prose = "m-0 text-base leading-[1.65] whitespace-pre-line text-cream/85";

// Feedback de una entrevista, solo para su propio member y solo si ya está guardado.
const Page = async ({ params }: PageProps<"/activities/interviews/feedback/[id]">) => {
  const { id } = await params;
  if (!idSchema.safeParse(id).success) notFound();
  const { position, interest, evaluation } = await getMyFeedback(id);

  return (
    <>
      <PageContainer narrow className="flex flex-col gap-8">
        <FadeIn className="flex flex-col gap-6">
          <Link
            href="/activities/interviews"
            className="self-start text-sm font-semibold text-gold no-underline hover:text-cream"
          >
            ← Back to your interviews
          </Link>
          <div className="flex flex-col gap-3">
            <span className="font-mono text-[13px] tracking-[0.06em] text-gold">&lt;feedback /&gt;</span>
            <h1 className="m-0 text-[32px] leading-[1.1] font-extrabold tracking-[-0.01em] sm:text-[44px]">{position}</h1>
            <span className="text-[15px] text-cream/70">
              <span className="font-semibold text-gold">{interest}</span>
              {` · by ${evaluation.expert.name} · ${formatDate(evaluation.updatedAt)}`}
            </span>
          </div>
        </FadeIn>

        <FadeIn delay={0.05} className="flex flex-col gap-8">
          <section className="box-border flex flex-col gap-3 rounded-[20px] border border-gold/35 bg-gold/8 p-6 sm:px-8 sm:py-7">
            <span className="font-mono text-[13px] text-gold">{"// your strength"}</span>
            <p className="m-0 text-lg leading-normal font-semibold whitespace-pre-line text-gold sm:text-[22px]">
              {evaluation.strength}
            </p>
          </section>

          <section className={card}>
            <h2 className={h2}>Top 2 to improve</h2>
            <ol className="m-0 flex list-none flex-col gap-3 p-0">
              {[evaluation.improve1, evaluation.improve2].map((text, i) => (
                <li key={i} className="flex items-start gap-3.5">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gold/14 font-mono text-sm text-gold">
                    {i + 1}
                  </span>
                  <span className="pt-1 text-base leading-normal">{text}</span>
                </li>
              ))}
            </ol>
          </section>

          {AREA_FIELDS.map((field, i) => (
            <section key={field} className={card}>
              <div className="flex items-baseline gap-3.5">
                <span className="font-mono text-sm text-gold">{String(i + 1).padStart(2, "0")}</span>
                <h2 className={h2}>{SCORE_AREAS[i]}</h2>
              </div>
              <p className={prose}>{evaluation[field]}</p>
            </section>
          ))}

          {evaluation.mistakes.length > 0 && (
            <section className={`${card} gap-4`}>
              <h2 className={h2}>Mistakes heard</h2>
              <table className="w-full table-fixed border-separate border-spacing-0 overflow-hidden rounded-[14px] border border-line text-left">
                <thead className="bg-ink font-mono text-[12px] tracking-[0.04em] text-cream/60">
                  <tr>
                    <th scope="col" className="px-4 py-3 font-normal">
                      YOU SAID
                    </th>
                    <th scope="col" className="border-l border-line px-4 py-3 font-normal">
                      BETTER
                    </th>
                  </tr>
                </thead>
                <tbody className="text-[15px] leading-normal">
                  {evaluation.mistakes.map((m, i) => (
                    <tr key={i}>
                      <td className="border-t border-line px-4 py-3.5 align-top break-words text-cream/80">“{m.heSaid}”</td>
                      <td className="border-t border-l border-line px-4 py-3.5 align-top font-semibold break-words text-gold">
                        “{m.better}”
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </section>
          )}

          <section className={`${card} sm:flex-row sm:items-center sm:justify-between`}>
            <h2 className={h2}>Next round?</h2>
            <span className="flex h-11 items-center self-start rounded-full bg-gold px-[26px] text-[15px] font-semibold text-ink sm:self-auto">
              {NEXT_ROUND[evaluation.nextRound]}
            </span>
          </section>
        </FadeIn>
      </PageContainer>
      <SiteFooter />
    </>
  );
};

export default Page;
