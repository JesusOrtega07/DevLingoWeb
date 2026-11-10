import type { Metadata } from "next";
import Link from "next/link";

import AuthShell from "@/features/auth/components/AuthShell";
import InviteForm from "@/features/auth/components/InviteForm";
import { findValidInvitation } from "@/features/auth/invitation";

export const metadata: Metadata = {
  title: "Activate account · DevLingo",
  // El enlace lleva un token: que no se indexe ni se filtre como referrer.
  robots: { index: false, follow: false },
  referrer: "no-referrer",
};

const Page = async ({ params }: PageProps<"/invite/[token]">) => {
  const { token } = await params;
  const invitation = await findValidInvitation(token);

  return (
    <AuthShell tagline="< Set up your account />">
      {invitation ? (
        <InviteForm token={token} name={invitation.user.name} email={invitation.user.email} />
      ) : (
        <div className="box-border flex w-full flex-col gap-4 rounded-[20px] border border-line bg-surface p-10">
          <h1 className="m-0 text-[26px] leading-[1.25] font-bold">Link not valid</h1>
          <p className="m-0 text-[15px] leading-normal text-cream/66">
            This invitation was already used or has expired. Ask an admin for a new link.
          </p>
          <Link href="/login" className="text-[15px] font-semibold text-gold hover:text-cream">
            Go to sign in
          </Link>
        </div>
      )}
    </AuthShell>
  );
};

export default Page;
