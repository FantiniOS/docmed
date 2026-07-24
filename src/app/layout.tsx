import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Sidebar } from "@/components/layout/sidebar";
import { MobileHeader } from "@/components/layout/mobile-header";
import { Toaster } from "@/components/ui/toast";
import "./globals.css";

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "DOCMED — Prontuário Médico Familiar",
    template: "%s | DOCMED",
  },
  description:
    "Sistema de prontuário médico familiar. Acesse informações de saúde da sua família de forma rápida e segura — ideal para consultórios e emergências.",
  keywords: [
    "prontuário médico",
    "saúde familiar",
    "exames médicos",
    "consultas",
    "emergência",
  ],
};

export const viewport: Viewport = {
  themeColor: "#0f1117",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" className={`${inter.variable} dark`}>
      <body className="min-h-dvh bg-background text-foreground antialiased">
        <TooltipProvider>
          {/* Desktop Sidebar */}
          <Sidebar />

          {/* Mobile Header (Hamburger Menu) */}
          <MobileHeader />

          {/* Main Content — offset by sidebar width on desktop */}
          <main className="lg:pl-64 min-h-dvh">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6">
              {children}
            </div>
          </main>

          <Toaster />
        </TooltipProvider>
      </body>
    </html>
  );
}
