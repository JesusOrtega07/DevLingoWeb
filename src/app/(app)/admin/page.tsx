import type { Metadata } from "next";

import { requireRole } from "@/lib/dal";

export const metadata: Metadata = { title: "Admin · DevLingo" };

// Marcador: el panel de admin llega en la fase 4.
const Page = async () => {
  await requireRole("ADMIN");

  return (
    <div className="flex flex-col gap-1.5">
      <p className="m-0 font-mono text-[13px] tracking-[0.08em] text-gold">&lt; Admin /&gt;</p>
      <h1 className="m-0 text-[26px] leading-[1.25] font-bold">Admin panel</h1>
    </div>
  );
};

export default Page;
