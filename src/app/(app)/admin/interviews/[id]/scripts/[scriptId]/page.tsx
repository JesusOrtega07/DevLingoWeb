import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import PageHeader from "@/components/ui/PageHeader";
import Panel from "@/components/ui/Panel";
import { formatDate } from "@/features/admin/labels";
import { getScriptOriginal } from "@/features/admin/queries";
import { idSchema } from "@/features/admin/schemas";
import { requireRole } from "@/lib/dal";

export const metadata: Metadata = { title: "Original script · Admin · DevLingo" };

// Muestra el .md tal como se subió, como texto plano (React lo escapa; no se interpreta).
const Page = async ({ params }: PageProps<"/admin/interviews/[id]/scripts/[scriptId]">) => {
  await requireRole("ADMIN");
  const { id, scriptId } = await params;
  if (!idSchema.safeParse(id).success || !idSchema.safeParse(scriptId).success) notFound();
  const script = await getScriptOriginal(id, scriptId);
  if (!script) notFound();

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        eyebrow={`Script v${script.version}`}
        title={script.fileName}
        description={`${script.interview.member.displayName} · ${script.interview.position} · ${formatDate(script.createdAt)}`}
        actions={
          <Link href={`/admin/interviews/${id}`} className="text-sm font-semibold text-gold hover:text-cream">
            ← Back to interview
          </Link>
        }
      />
      <Panel>
        <pre className="m-0 overflow-x-auto font-mono text-[13px] leading-relaxed whitespace-pre-wrap text-cream/90">
          {script.originalMd}
        </pre>
        <p className="m-0 font-mono text-[12px] break-all text-cream/50">sha256 {script.sha256}</p>
      </Panel>
    </div>
  );
};

export default Page;
