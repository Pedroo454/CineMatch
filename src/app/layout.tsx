import type { Metadata, Viewport } from "next";
import { Inter, Playfair_Display } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";
import { LogoMark } from "@/components/Logo";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const display = Playfair_Display({ subsets: ["latin"], variable: "--font-display" });

export const metadata: Metadata = {
  title: { default: "CineMatch — Your taste. Your next story.", template: "%s · CineMatch" },
  description: "Descubra, organize e avalie filmes e séries com recomendações feitas para o seu gosto.",
};

export const viewport: Viewport = { themeColor: "#08080a" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className={`${inter.variable} ${display.variable}`}>
      <body className="flex min-h-screen flex-col">
        <Navbar />
        <main className="flex-1">{children}</main>
        <footer className="mt-16 border-t border-ink-700/60 py-8 text-xs text-neutral-500">
          <div className="container-x flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2">
              <LogoMark size={20} />
              <span>CineMatch — Your taste. Your next story.</span>
            </div>
            <p className="max-w-xl">
              Dados de filmes e séries fornecidos pelo TMDB. Este produto usa a API do TMDB, mas não é endossado nem certificado por ele.
              Disponibilidade de streaming: JustWatch (via TMDB).
            </p>
          </div>
        </footer>
      </body>
    </html>
  );
}
