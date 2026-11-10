import type { Metadata } from "next";
import { redirect } from "next/navigation";

import AuthShell from "@/features/auth/components/AuthShell";
import LoginForm from "@/features/auth/components/LoginForm";
import { getCurrentUser } from "@/lib/dal";

export const metadata: Metadata = { title: "Sign in · DevLingo" };

const Page = async () => {
  // Con una sesión válida no tiene sentido ver el login.
  if (await getCurrentUser()) redirect("/");

  return (
    <AuthShell tagline="< Community Access />">
      <LoginForm />
    </AuthShell>
  );
};

export default Page;
