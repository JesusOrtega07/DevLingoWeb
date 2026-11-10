import type { Metadata } from "next";

import { requireUser } from "@/lib/dal";

export const metadata: Metadata = { title: "Interviews · DevLingo" };

// Marcador: la vista real llega en las fases de expert (02–08) y de member.
const Page = async () => {
  await requireUser();

  return (
    <div className="flex flex-col gap-1.5">
      <p className="m-0 font-mono text-[13px] tracking-[0.08em] text-gold">&lt; Interviews /&gt;</p>
      <h1 className="m-0 text-[26px] leading-[1.25] font-bold">Coming soon</h1>
    </div>
  );
};

export default Page;
