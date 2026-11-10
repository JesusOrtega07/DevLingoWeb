import Image from "next/image";

// Página temporal de la fase 0. En la fase de auth se convierte en el inicio por rol.
const Page = () => (
  <main className="flex flex-1 flex-col items-center justify-center gap-6 px-6 text-center">
    <Image src="/logo.svg" alt="DevLingo Community" width={214} height={170} priority unoptimized />
    <p className="font-mono text-sm text-gold">From &quot;Hello, World!&quot; to &quot;Hello, everyone!&quot;</p>
  </main>
);

export default Page;
