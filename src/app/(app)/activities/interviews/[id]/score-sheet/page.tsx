import type { Metadata } from "next";

import FadeIn from "@/components/FadeIn";
import PageContainer from "@/components/layout/PageContainer";
import ScoreSheetForm, { type ScoreValues } from "@/features/evaluations/components/ScoreSheetForm";
import type { AreaField } from "@/features/evaluations/schemas";
import BlockText from "@/features/scripts/components/BlockText";
import InlineText from "@/features/scripts/components/InlineText";
import { getMyEvaluation, getMyInterview } from "@/features/interviews/queries";

export const metadata: Metadata = { title: "Score sheet · Interview · DevLingo" };

const savedLabel = (date: Date) =>
  new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "America/Mexico_City",
  }).format(date);

// Pestaña Score sheet (mockup 06). Si ya hay evaluación, el formulario sale relleno para editarla.
const Page = async ({ params }: PageProps<"/activities/interviews/[id]/score-sheet">) => {
  const { id } = await params;
  const interview = await getMyInterview(id);
  const evaluation = await getMyEvaluation(interview.id);
  const { intro, areas } = interview.script.scoreSheet;

  const initial: ScoreValues = evaluation
    ? {
        fluency: evaluation.fluency,
        grammar: evaluation.grammar,
        vocabulary: evaluation.vocabulary,
        pronunciation: evaluation.pronunciation,
        confidence: evaluation.confidence,
        strength: evaluation.strength,
        improve1: evaluation.improve1,
        improve2: evaluation.improve2,
        nextRound: evaluation.nextRound,
        mistakes: evaluation.mistakes,
      }
    : {
        fluency: "",
        grammar: "",
        vocabulary: "",
        pronunciation: "",
        confidence: "",
        strength: "",
        improve1: "",
        improve2: "",
        nextRound: "",
        mistakes: [],
      };

  return (
    <PageContainer narrow>
      <FadeIn>
        <ScoreSheetForm
          interviewId={interview.id}
          intro={
            intro.length > 0 ? (
              <BlockText blocks={intro} />
            ) : (
              "Write a short analysis for each area: what went well and what needs work, with examples you heard."
            )
          }
          areas={areas.map(({ area, lookAt }) => ({
            field: area.toLowerCase() as AreaField,
            title: area,
            lookAt: lookAt ? <InlineText nodes={lookAt} /> : null,
          }))}
          initial={initial}
          saved={evaluation ? { label: savedLabel(evaluation.updatedAt), revisions: evaluation._count.revisions } : null}
        />
      </FadeIn>
    </PageContainer>
  );
};

export default Page;
