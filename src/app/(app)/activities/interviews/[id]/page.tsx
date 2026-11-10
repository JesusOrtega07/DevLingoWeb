import { redirect } from "next/navigation";

// /activities/interviews/[id] abre la primera pestaña.
const Page = async ({ params }: PageProps<"/activities/interviews/[id]">) => {
  const { id } = await params;
  redirect(`/activities/interviews/${id}/context`);
};

export default Page;
