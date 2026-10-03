import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";

export const metadata: Metadata = {
  title: "AutoLink — Seu carro. Seus serviços.",
  description: "Encontre oficinas, solicite atendimento e acompanhe os serviços do seu carro com a AutoLink.",
  applicationName: "AutoLink",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
