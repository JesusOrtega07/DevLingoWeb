import type { Metadata } from "next";
import { redirect } from "next/navigation";

import FadeIn from "@/components/FadeIn";
import PageContainer from "@/components/layout/PageContainer";
import SiteFooter from "@/components/layout/SiteFooter";
import { idSchema } from "@/features/admin/schemas";
import MemberInterviews from "@/features/feedback/components/MemberInterviews";
import FamilyGrid from "@/features/interviews/components/FamilyGrid";
import SavedToast from "@/features/interviews/components/SavedToast";
import { getSavedNotice, listMyInterviews } from "@/features/interviews/queries";
import { requireUser } from "@/lib/dal";

export const metadata: Metadata = { title: "Interviews · DevLingo" };

// Vista de la English Expert: su DevLingo Family (mockups 02, 03 y 08).
const ExpertFamily = async ({ savedId }: { savedId: string | null }) => {
  const [interviews, saved] = await Promise.all([
    listMyInterviews(),
    savedId ? getSavedNotice(savedId) : Promise.resolve(null),
  ]);
  const interviewed = interviews.filter((i) => i.status === "INTERVIEWED").length;
  const memberCount = new Set(interviews.map((i) => i.member.displayName)).size;

  return (
    <>
      {saved && <SavedToast name={saved.member.displayName} position={saved.position} />}
      <PageContainer className="flex flex-col gap-10 lg:pt-16">
        <FadeIn className="flex flex-wrap items-end justify-between gap-6">
          <div className="flex flex-col gap-3">
            <span className="font-mono text-[13px] tracking-[0.06em] text-gold">&lt;mock-interviews /&gt;</span>
            <h1 className="m-0 text-[36px] leading-[1.08] font-extrabold tracking-[-0.02em] sm:text-[52px]">
              DevLingo Family
            </h1>
            <p className="m-0 text-lg leading-normal text-cream/70">Choose a member to start the interview.</p>
          </div>
          <span className="font-mono text-[13px] text-cream/60">
            {`// ${memberCount} ${memberCount === 1 ? "member" : "members"} · ${interviewed} interviewed`}
          </span>
        </FadeIn>

        {interviews.length === 0 ? (
          <p className="m-0 rounded-[20px] border border-line bg-surface p-8 text-[15px] text-cream/66">
            No interviews are assigned to you yet. The admin will assign them from the panel.
          </p>
        ) : (
          <FamilyGrid
            cards={interviews.map((i) => ({
              id: i.id,
              name: i.member.displayName,
              age: i.member.age,
              interest: i.interest,
              position: i.position,
              status: i.status,
              hasScript: i.hasScript,
            }))}
          />
        )}
      </PageContainer>
      <SiteFooter />
    </>
  );
};

const Page = async ({ searchParams }: PageProps<"/activities/interviews">) => {
  const user = await requireUser();
  if (user.role === "ADMIN") redirect("/admin/interviews");

  if (user.role === "EXPERT") {
    const { saved } = await searchParams;
    const savedId = typeof saved === "string" && idSchema.safeParse(saved).success ? saved : null;
    return <ExpertFamily savedId={savedId} />;
  }

  // Member: solo sus propias entrevistas y su feedback ya guardado.
  return (
    <>
      <MemberInterviews />
      <SiteFooter />
    </>
  );
};

export default Page;
