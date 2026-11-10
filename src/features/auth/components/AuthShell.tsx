import Image from "next/image";
import type { ReactNode } from "react";

import FadeIn from "@/components/FadeIn";

type Props = {
  tagline: string;
  children: ReactNode;
};

// Marco de las pantallas sin sesión (login e invitación), según el mockup 01-sign-in.
const AuthShell = ({ tagline, children }: Props) => (
  <main className="flex min-h-dvh w-full flex-col items-center gap-10 px-6 pt-[72px] pb-12">
    <FadeIn className="flex flex-col items-center gap-3">
      <Image src="/logo.svg" alt="DevLingo Community" width={240} height={191} priority unoptimized />
      <p className="m-0 font-mono text-[15px] tracking-[0.08em] text-gold">{tagline}</p>
    </FadeIn>

    <FadeIn delay={0.08} className="w-full max-w-[440px]">
      {children}
    </FadeIn>

    <p className="mt-auto mb-0 font-mono text-[13px] text-cream/60">
      From “Hello, World!” to “Hello, everyone!”
    </p>
  </main>
);

export default AuthShell;
