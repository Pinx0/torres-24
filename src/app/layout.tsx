import type { Metadata } from "next";
import { Geist, Geist_Mono, Orbitron } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Header } from "@/components/header";
import { MainHeader } from "@/components/main-header";
import { createClient } from "@/lib/supabase/server";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const orbitron = Orbitron({
  variable: "--font-orbitron",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800", "900"],
});

export const metadata: Metadata = {
  title: "Torres 24 - Portal del Vecino",
  description: "Portal de la comunidad de propietarios Torres 24. Gestiona gastos, incidencias, parking y más.",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const isAuthenticated = !!user;

  return (
    <html lang="es">
      <head>
        <meta charSet="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>Torres 24 - Portal del Vecino</title>
        <meta name="description" content="Portal de la comunidad de propietarios Torres 24. Gestiona gastos, incidencias, parking y más." />
        <meta name="author" content="Torres 24" />
        <link rel="icon" type="image/png" href="/favicon.png" />

        <meta property="og:title" content="Torres 24 - Portal del Vecino" />
        <meta property="og:description" content="Portal de la comunidad de propietarios Torres 24. Gestiona gastos, incidencias, parking y más." />
        <meta property="og:type" content="website" />

        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:site" content="@Torres24" />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${orbitron.variable} antialiased`}
      >
        <TooltipProvider>
          <Toaster />
          <Header />
          {isAuthenticated && <MainHeader />}
          {children}
        </TooltipProvider>
      </body>
    </html>
  );
}
