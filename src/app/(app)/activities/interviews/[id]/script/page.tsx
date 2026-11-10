import type { Metadata } from "next";

import FadeIn from "@/components/FadeIn";
import PageContainer from "@/components/layout/PageContainer";
import InlineText from "@/features/scripts/components/InlineText";
import type { Inline, TimedLine } from "@/features/scripts/types";
import { curlyQuotes, plainText, stripWrappingQuotes } from "@/features/interviews/context-view";
import ScriptSteps from "@/features/interviews/components/ScriptSteps";
import { getMyInterview } from "@/features/interviews/queries";

export const metadata: Metadata = { title: "Script · Interview · DevLingo" };

/** Frase que Lili dice en voz alta, siempre entre comillas tipográficas. */
const spoken = (nodes: Inline[]) => `“${curlyQuotes(stripWrappingQuotes(plainText(nodes)))}”`;

const SpokenLine = ({ line, label }: { line: TimedLine; label: string }) => (
  <blockquote className="m-0 flex flex-col gap-3 rounded-[20px] border border-gold/35 bg-gold/8 px-6 py-6 sm:px-8 sm:py-7">
    <span className="font-mono text-[13px] text-gold">
      {`${line.time} // ${label}`}
    </span>
    <p className="m-0 text-lg leading-normal font-semibold text-gold sm:text-[22px]">{spoken(line.text)}</p>
  </blockquote>
);

// Pestaña Script (mockup 05): Opening, pasos con tiempo y Closing.
const Page = async ({ params }: PageProps<"/activities/interviews/[id]/script">) => {
  const { id } = await params;
  const interview = await getMyInterview(id);
  const { opening, steps, closing } = interview.script.script;

  return (
    <PageContainer narrow>
      <FadeIn className="flex flex-col gap-7">
        <SpokenLine line={opening} label="opening" />
        <ScriptSteps
          interviewId={interview.id}
          scriptVersion={interview.scriptVersion}
          steps={steps.map((s) => ({
            time: s.time,
            question: spoken(s.question),
            good: <InlineText nodes={s.goodAnswer} />,
          }))}
        />
        <SpokenLine line={closing} label="closing" />
      </FadeIn>
    </PageContainer>
  );
};

export default Page;
