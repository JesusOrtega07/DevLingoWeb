import type { ReactNode } from "react";

type Props = { children: ReactNode; narrow?: boolean; className?: string };

// Contenedor de página con los márgenes de los mockups (máx. 1440, laterales de 80 en escritorio).
const PageContainer = ({ children, narrow = false, className = "" }: Props) => (
  <main
    className={`mx-auto box-border w-full px-6 pt-10 pb-16 sm:px-10 lg:px-20 lg:pt-12 lg:pb-24 ${
      narrow ? "max-w-[1040px]" : "max-w-[1440px]"
    } ${className}`}
  >
    {children}
  </main>
);

export default PageContainer;
