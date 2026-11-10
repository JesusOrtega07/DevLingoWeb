import type { Metadata } from "next";

import FadeIn from "@/components/FadeIn";
import PageContainer from "@/components/layout/PageContainer";
import { getMyInterview } from "@/features/interviews/queries";

export const metadata: Metadata = { title: "Files · Interview · DevLingo" };

const BriefcaseIcon = () => (
  <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#D7A361" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <rect x="3" y="7" width="18" height="13" rx="2" />
    <path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
    <path d="M3 12h18" />
  </svg>
);

const DocIcon = () => (
  <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#D7A361" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z" />
    <path d="M14 3v5h5" />
    <path d="M9 13h6M9 17h4" />
  </svg>
);

// Por ahora los enlaces no tienen función real (decisión del proyecto): se muestran las
// tarjetas del mockup 07 con el botón deshabilitado.
const FILES = [
  { title: "Job post", detail: "Link · coming soon", Icon: BriefcaseIcon },
  { title: "Study guide", detail: "Document · coming soon", Icon: DocIcon },
];

// Pestaña Files (mockup 07).
const Page = async ({ params }: PageProps<"/activities/interviews/[id]/files">) => {
  const { id } = await params;
  await getMyInterview(id);

  return (
    <PageContainer>
      <FadeIn className="flex flex-col gap-6">
        <span className="font-mono text-[13px] text-cream/60">{`// ${FILES.length} files`}</span>
        <div className="grid grid-cols-[repeat(auto-fill,minmax(min(100%,340px),1fr))] gap-6">
          {FILES.map(({ title, detail, Icon }) => (
            <article
              key={title}
              className="box-border flex items-center gap-5 rounded-[20px] border border-line bg-surface p-6 sm:p-7"
            >
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-[14px] bg-gold/12">
                <Icon />
              </div>
              <div className="flex min-w-0 flex-1 flex-col gap-1">
                <span className="text-lg font-bold">{title}</span>
                <span className="font-mono text-[12px] text-cream/60">{detail}</span>
              </div>
              <button
                type="button"
                disabled
                title="Not available yet"
                className="h-11 cursor-not-allowed rounded-[10px] border border-gold bg-transparent px-5 font-sans text-sm font-bold text-gold opacity-50"
              >
                Open
              </button>
            </article>
          ))}
        </div>
      </FadeIn>
    </PageContainer>
  );
};

export default Page;
