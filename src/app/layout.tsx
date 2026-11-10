import type { Metadata } from "next";
import { JetBrains_Mono, Montserrat } from "next/font/google";
import { connection } from "next/server";

import "./globals.css";

// next/font descarga las fuentes en el build y las sirve desde el propio servidor,
// así que no hay peticiones a Google en tiempo de ejecución (compatible con la CSP).
const montserrat = Montserrat({
  variable: "--font-montserrat",
  subsets: ["latin"],
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "DevLingo Community",
  description: 'From "Hello, World!" to "Hello, everyone!"',
};

const RootLayout = async ({ children }: LayoutProps<"/">) => {
  // Todo el sitio se renderiza por petición: así cada respuesta (incluida la 404) lleva
  // su propio nonce de CSP. Las páginas dependen de la sesión, así que no se pierde nada.
  await connection();

  return (
    <html lang="en" className={`${montserrat.variable} ${jetbrainsMono.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col font-sans">{children}</body>
    </html>
  );
};

export default RootLayout;
