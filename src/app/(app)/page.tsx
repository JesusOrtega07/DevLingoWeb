import ActivityCard from "@/components/ActivityCard";
import FadeIn from "@/components/FadeIn";
import PageContainer from "@/components/layout/PageContainer";
import { requireUser } from "@/lib/dal";

const INTERVIEWS_DESCRIPTION = {
  ADMIN: "Mock job interviews: members, scripts and assignments.",
  EXPERT: "Conduct and score the mock interviews assigned to you.",
  MEMBER: "Practice job interviews in English and read your feedback.",
} as const;

// Inicio después del login. La actividad de entrevistas vive en su propia ruta.
const Page = async () => {
  const user = await requireUser();

  return (
    <PageContainer>
      <FadeIn className="flex flex-col gap-8">
        <div className="flex flex-col gap-1.5">
          <p className="m-0 font-mono text-[13px] tracking-[0.08em] text-gold">&lt; Hello, everyone! /&gt;</p>
          <h1 className="m-0 text-[26px] leading-[1.25] font-bold">Welcome, {user.name}</h1>
        </div>

        <section aria-labelledby="activities" className="flex flex-col gap-4">
          <h2 id="activities" className="m-0 text-sm font-semibold text-cream/66">
            Activities
          </h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <ActivityCard
              href="/activities/interviews"
              label="ACTIVITY"
              title="Interviews"
              description={INTERVIEWS_DESCRIPTION[user.role]}
            />
            {user.role === "ADMIN" && (
              <ActivityCard
                href="/admin"
                label="ADMIN"
                title="Admin panel"
                description="Accounts, members, interviews and assignments."
              />
            )}
          </div>
        </section>
      </FadeIn>
    </PageContainer>
  );
};

export default Page;
